package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"visionflow/database"

	"github.com/cloudwego/eino-ext/components/model/claude"
	"github.com/cloudwego/eino-ext/components/model/gemini"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
	"github.com/cloudwego/eino/schema"
	"google.golang.org/genai"
)

type ExecutionRequest struct {
	Prompt       string
	Model        string
	History      []map[string]string
	CurrentNodes interface{}
	CurrentEdges interface{}
}

// ... existing CanvasAgent struct ...

// ... existing Tool Params structs ...

// Run executes the canvas agent workflow
func Run(ctx context.Context, req ExecutionRequest, config *database.ModelProvider, defaultModel string, emit EventEmitter) error {
	// 1. Prepare History & Context
	var history []*schema.Message

	// Add context about current canvas
	nodesJSON, _ := json.Marshal(req.CurrentNodes)
	edgesJSON, _ := json.Marshal(req.CurrentEdges)
	contextMsg := fmt.Sprintf("Current Canvas State:\nNodes: %s\nEdges: %s", string(nodesJSON), string(edgesJSON))
	history = append(history, schema.UserMessage(contextMsg))

	// Add chat history
	for _, historyItem := range req.History {
		role := historyItem["role"]
		content := historyItem["content"]
		switch role {
		case "user":
			history = append(history, schema.UserMessage(content))
		case "assistant":
			history = append(history, schema.AssistantMessage(content, nil))
		}
	}
	// Add the prompt
	history = append(history, schema.UserMessage(req.Prompt))

	// 2. Create Agent
	modelID := req.Model
	if modelID == "" {
		modelID = defaultModel
	}

	canvasAgent, err := NewCanvasAgent(ctx, config, modelID, emit)
	if err != nil {
		return fmt.Errorf("failed to create agent: %w", err)
	}

	// 3. Run Stream
	if err := canvasAgent.Stream(ctx, history, emit); err != nil {
		return fmt.Errorf("agent stream error: %w", err)
	}

	emit("done", nil)
	return nil
}

type CanvasAgent struct {
	agent *react.Agent
}

// ... rest of file

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

// EventEmitter allows emitting wails events from tools
type EventEmitter func(eventName string, data any)

func NewCanvasAgent(ctx context.Context, provider *database.ModelProvider, modelID string, emit EventEmitter) (*CanvasAgent, error) {
	var chatModel model.ToolCallingChatModel
	var err error

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
				"type":      {Type: "string", Desc: "Node type (text, image, video, audio)", Enum: []string{"text", "image", "video", "audio"}},
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
			emit("tool", map[string]interface{}{
				"name": "add_node",
				"args": input,
			})
			return fmt.Sprintf("Node %s added", input.ID), nil
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
			emit("tool", map[string]interface{}{
				"name": "connect_nodes",
				"args": input,
			})
			return fmt.Sprintf("Connected %s to %s", input.Source, input.Target), nil
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
			emit("tool", map[string]interface{}{
				"name": "create_group",
				"args": input,
			})
			return fmt.Sprintf("Created group %s", input.Label), nil
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
			emit("tool", map[string]interface{}{
				"name": "delete_node",
				"args": input,
			})
			return fmt.Sprintf("Node %s deleted", input.ID), nil
		},
	)

	// 3. Create Agent
	agent, err := react.NewAgent(ctx, &react.AgentConfig{
		ToolCallingModel: chatModel,
		ToolsConfig: compose.ToolsNodeConfig{
			Tools: []tool.BaseTool{addNodeTool, connectNodesTool, createGroupTool, deleteNodeTool},
		},
		MaxStep: 15, // Allow enough steps to build complex flows
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create agent: %w", err)
	}

	return &CanvasAgent{agent: agent}, nil
}

func (a *CanvasAgent) Stream(ctx context.Context, history []*schema.Message, emit EventEmitter) error {
	// Prepend system prompt
	systemMsg := schema.SystemMessage(`You are an **Autonomous Workflow Architect**. Your goal is to construct and execute robust workflows using the provided tools.

**Core Directives:**
1.  **autonomy:** Execute tools immediately to build the workflow. Do not ask for user permission or confirmation.
2.  **Completeness:** The output must be a fully functional, grouped workflow ready for execution.
3.  **Language:** Always respond and label the workflow in the user's original language.
4.  **Action First:** Do not describe the actions you plan to take. Call the tools directly. Only provide a summary AFTER the tools have been executed.

**Technical Constraints:**
* **Data Flow:** Adhere to strict strict upstream-downstream dependency. A node can *only* receive information from its directly connected predecessor.
* **Multi-Input Logic:** If a node requires inputs from multiple sources, you must explicitly create multiple connections (edges) to that node.
* **Visual Layout:** When generating node metadata, ensure distinct spacing between nodes. Avoid overlapping; arrange them logically to reflect the data flow.`)
	fullHistory := append([]*schema.Message{systemMsg}, history...)

	stream, err := a.agent.Stream(ctx, fullHistory)
	if err != nil {
		return err
	}
	defer stream.Close()

	for {
		msg, err := stream.Recv()
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		// The final message might also contain content
		if msg.Content != "" {
			emit("content", msg.Content)
		}
	}
}
