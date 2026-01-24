package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
	"visionflow/database"

	"github.com/cloudwego/eino-ext/components/model/claude"
	"github.com/cloudwego/eino-ext/components/model/gemini"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"google.golang.org/genai"
)

type ExecutionRequest struct {
	Prompt  string
	Model   string
	History []map[string]string
}

// Run executes the canvas agent workflow
func Run(ctx context.Context, req ExecutionRequest, config *database.ModelProvider, defaultModel string, emit EventEmitter, stateUpdateChan chan StateUpdate) error {
	// 1. Prepare History Messages
	var messages []adk.Message

	// Add chat history
	for _, historyItem := range req.History {
		role := historyItem["role"]
		content := historyItem["content"]
		switch role {
		case "user":
			messages = append(messages, schema.UserMessage(content))
		case "assistant":
			messages = append(messages, schema.AssistantMessage(content, nil))
		}
	}
	// Add the prompt
	messages = append(messages, schema.UserMessage(req.Prompt))

	// 2. Create Agent
	modelID := req.Model
	if modelID == "" {
		modelID = defaultModel
	}

	canvasAgent, err := NewCanvasAgent(ctx, config, modelID, emit, stateUpdateChan)
	if err != nil {
		return fmt.Errorf("failed to create agent: %w", err)
	}

	// 3. Run Agent using ADK Runner
	runner := adk.NewRunner(ctx, adk.RunnerConfig{
		Agent: canvasAgent.agent,
	})

	iter := runner.Run(ctx, messages)

	// 4. Stream Events
	for {
		event, ok := iter.Next()
		if !ok {
			break
		}

		if event.Err != nil {
			return fmt.Errorf("agent event error: %w", event.Err)
		}

		// Handle message output
		if event.Output != nil && event.Output.MessageOutput != nil {
			if event.Output.MessageOutput.IsStreaming {
				// Stream mode
				stream := event.Output.MessageOutput.MessageStream
				for {
					msg, err := stream.Recv()
					if err != nil {
						break
					}
					if msg.Content != "" {
						emit("content", msg.Content)
					}
				}
			} else {
				// Non-stream mode
				if event.Output.MessageOutput.Message != nil && event.Output.MessageOutput.Message.Content != "" {
					emit("content", event.Output.MessageOutput.Message.Content)
				}
			}
		}
	}

	emit("done", nil)
	return nil
}

type CanvasAgent struct {
	agent           adk.Agent
	currentNodes    any
	currentEdges    any
	stateUpdateChan chan StateUpdate
	emit            EventEmitter
}

// StateUpdate represents a canvas state update from frontend
type StateUpdate struct {
	Nodes any `json:"nodes"`
	Edges any `json:"edges"`
}

// Tool definitions
type AddNodeParams struct {
	Type     string  `json:"type"`
	ID       string  `json:"id"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Content  string  `json:"content,omitempty"`
	Prompt   string  `json:"prompt,omitempty"`
	IsSource bool    `json:"is_source,omitempty"`
	Label    string  `json:"label,omitempty"`
}

type ConnectNodesParams struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

type GroupNodesParams struct {
	NodeIDs []string `json:"node_ids"`
	Label   string   `json:"label"`
}
type DeleteNodeParams struct {
	ID string `json:"id"`
}

type GetCanvasStateParams struct{}

// EventEmitter allows emitting wails events from tools
type EventEmitter func(eventName string, data any)

func NewCanvasAgent(ctx context.Context, provider *database.ModelProvider, modelID string, emit EventEmitter, stateUpdateChan chan StateUpdate) (*CanvasAgent, error) {
	var chatModel model.ToolCallingChatModel
	var err error

	// Initialize canvas agent with current state
	canvasAgent := &CanvasAgent{
		stateUpdateChan: stateUpdateChan,
		emit:            emit,
	}

	// 1. Initialize Chat Model based on provider type
	switch provider.Type {
	case database.ProviderOpenAI:
		chatModel, err = openai.NewChatModel(ctx, &openai.ChatModelConfig{
			APIKey:  provider.APIKey,
			BaseURL: provider.BaseURL,
			Model:   modelID,
		})
	case database.ProviderGemini:
		var genaiClient *genai.Client
		genaiClient, err = genai.NewClient(ctx, &genai.ClientConfig{
			APIKey: provider.APIKey,
			HTTPOptions: genai.HTTPOptions{
				BaseURL: provider.BaseURL,
			},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create gemini client: %w", err)
		}
		chatModel, err = gemini.NewChatModel(ctx, &gemini.Config{
			Client: genaiClient,
			Model:  modelID,
		})
	case database.ProviderClaude:
		var baseURL *string
		if provider.BaseURL != "" {
			s := provider.BaseURL
			baseURL = &s
		}
		chatModel, err = claude.NewChatModel(ctx, &claude.Config{
			APIKey:  provider.APIKey,
			BaseURL: baseURL,
			Model:   modelID,
		})
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider.Type)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create chat model: %w", err)
	}

	// 2. Define Tools
	mkMsg := func(desc string) *schema.ParameterInfo {
		return &schema.ParameterInfo{Type: "string", Desc: desc}
	}
	mkNum := func(desc string) *schema.ParameterInfo {
		return &schema.ParameterInfo{Type: "number", Desc: desc}
	}

	addNodeTool := utils.NewTool(
		&schema.ToolInfo{
			Name: "add_node",
			Desc: "Add a node to the canvas",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				"type":      {Type: "string", Desc: "Node type (text, image, video, audio)", Enum: []string{"text", "image", "video", "audio"}, Required: true},
				"id":        mkMsg("Unique ID"),
				"x":         mkNum("X position"),
				"y":         mkNum("Y position"),
				"content":   {Type: "string", Desc: "Content only for text node"},
				"prompt":    {Type: "string", Desc: "All nodes need prompts, except for the `is_source` node; this is crucial for the entire workflow to achieve high quality."},
				"label":     mkMsg("Label"),
				"is_source": {Type: "boolean", Desc: "Is source node"},
			}),
		},
		func(ctx context.Context, input *AddNodeParams) (string, error) {
			emit("tool", map[string]any{
				"name": "add_node",
				"args": input,
			})
			result := fmt.Sprintf("Node %s added successfully", input.ID)
			formatted := formatToolCall("add_node", input, result)
			return formatted, nil
		},
	)

	connectNodesTool := utils.NewTool(
		&schema.ToolInfo{
			Name: "connect_nodes",
			Desc: "Connect two nodes",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				"source": mkMsg("Source ID"),
				"target": mkMsg("Target ID"),
			}),
		},
		func(ctx context.Context, input *ConnectNodesParams) (string, error) {
			emit("tool", map[string]any{
				"name": "connect_nodes",
				"args": input,
			})
			result := fmt.Sprintf("Connected %s to %s successfully", input.Source, input.Target)
			formatted := formatToolCall("connect_nodes", input, result)
			return formatted, nil
		},
	)

	createGroupTool := utils.NewTool(
		&schema.ToolInfo{
			Name: "create_group",
			Desc: "Group nodes",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				"node_ids": {
					Type: "array",
					Desc: "Node IDs",
					ElemInfo: &schema.ParameterInfo{
						Type: "string",
					},
				},
				"label": mkMsg("Group Label"),
			}),
		},
		func(ctx context.Context, input *GroupNodesParams) (string, error) {
			emit("tool", map[string]any{
				"name": "create_group",
				"args": input,
			})
			result := fmt.Sprintf("Created group %s successfully", input.Label)
			formatted := formatToolCall("create_group", input, result)
			return formatted, nil
		},
	)

	deleteNodeTool := utils.NewTool(
		&schema.ToolInfo{
			Name: "delete_node",
			Desc: "Delete a node from the canvas",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				"id": mkMsg("Node ID to delete"),
			}),
		},
		func(ctx context.Context, input *DeleteNodeParams) (string, error) {
			emit("tool", map[string]any{
				"name": "delete_node",
				"args": input,
			})
			result := fmt.Sprintf("Node %s deleted successfully", input.ID)
			formatted := formatToolCall("delete_node", input, result)
			return formatted, nil
		},
	)

	getCanvasStateTool := utils.NewTool(
		&schema.ToolInfo{
			Name:        "get_canvas_state",
			Desc:        "Get the current canvas state including all nodes and edges. This returns the real-time state reflecting all changes made during this conversation.",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{}),
		},
		func(ctx context.Context, input *GetCanvasStateParams) (string, error) {
			// Request latest state from frontend
			emit("get_canvas_state_request", map[string]any{})

			// Wait for state update with timeout
			select {
			case update := <-canvasAgent.stateUpdateChan:
				canvasAgent.currentNodes = update.Nodes
				canvasAgent.currentEdges = update.Edges
			case <-time.After(2 * time.Second):
				// Timeout - use cached state
			}

			nodesJSON, _ := json.Marshal(canvasAgent.currentNodes)
			edgesJSON, _ := json.Marshal(canvasAgent.currentEdges)
			result := fmt.Sprintf("Current Canvas State:\nNodes: %s\nEdges: %s", string(nodesJSON), string(edgesJSON))
			formatted := formatToolCall("get_canvas_state", input, result)
			return formatted, nil
		},
	)

	// 3. Create ChatModelAgent using ADK
	agent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
		Name:        "CanvasAgent",
		Description: "An agent that creates and manages visual workflow canvas",
		Instruction: `You are an **Autonomous Workflow Architect & Visual Topology Expert**. Your goal is to construct and execute robust workflows using the provided tools, ensuring a strict, collision-free visual layout.

**Core Directives:**
1.  **Language:** **MUST** use Chinese (Simplified) for all thoughts and explanations.
2.  **Action-Oriented:** Your PRIMARY task is to CREATE nodes, CONNECT them, and GROUP them. Do NOT just query the state - you MUST modify the canvas.
3.  **Execution Order:** 
    - First: Check canvas state if needed (get_canvas_state)
    - Then: IMMEDIATELY create all required nodes (add_node)
    - Then: Connect the nodes (connect_nodes)
    - Finally: Group related nodes (create_group)
4.  **Completeness:** You MUST create a fully functional workflow with nodes, connections, and groups. Empty state is NOT acceptable.
5.  **No Confirmation:** Do NOT ask for permission. Execute the tools directly.

**Visual Topology Standards (CRITICAL - MATHEMATICAL LAYOUT):**
* **Constants:**
    * **Node Dimension:** Fixed box size of **200x200 units**.
    * **Minimum Gap:** 100 units between nodes.
    * **Grid Step:** Therefore, the minimum coordinate increment is **300 units** (200 size + 100 gap).

* **Coordinate Calculation Rules:**
    * **Origin:** Start the first node at {x: 0, y: 0}.
    * **Horizontal Flow (Sequential):** For the next logical step, increment X by at least **400 units** (leaving ample space for connection lines).
        * Formula: Next_X = Previous_X + 400
    * **Vertical Flow (Parallel/Branching):** For parallel branches, offset Y by at least **300 units**.
        * Formula: Branch_A_Y = Origin_Y - 300, Branch_B_Y = Origin_Y + 300.

* **Collision Protocol:**
    * Treat every node as a solid 200x200 block.
    * NEVER place a new node's coordinate within [Target_X ± 200, Target_Y ± 200] of an existing node.

**Technical Constraints:**
* **Data Flow:** Strict upstream-downstream dependency.
* **Multi-Input:** Explicitly create edge connections for all inputs.
* **Metadata:** You MUST inject x and y properties into every node object based on the Grid Step rules above.

**CRITICAL: You MUST use add_node, connect_nodes, and create_group tools to build the workflow. Simply checking the state is NOT enough!**`,
		Model: chatModel,
		ToolsConfig: adk.ToolsConfig{
			ToolsNodeConfig: compose.ToolsNodeConfig{
				Tools: []tool.BaseTool{addNodeTool, connectNodesTool, createGroupTool, deleteNodeTool, getCanvasStateTool},
			},
		},
		MaxIterations: 80,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create agent: %w", err)
	}

	canvasAgent.agent = agent
	return canvasAgent, nil
}

func formatToolCall(name string, args any, content string) string {
	argsBytes, _ := json.Marshal(args)
	argsStr := strings.ReplaceAll(string(argsBytes), "\"", "&quot;")
	return fmt.Sprintf(`<tool_call name="%s" args="%s">%s</tool_call>`, name, argsStr, content)
}
