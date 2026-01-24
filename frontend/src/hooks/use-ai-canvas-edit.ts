import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/stores/use-canvas-store";
import { EventsOn } from "../../wailsjs/runtime/runtime"; // Adjust import path if needed
import type { Node, Edge } from "@xyflow/react";
import { CanvasAgent, UpdateCanvasState } from "../../wailsjs/go/ai/Service";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function useAICanvasEdit() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const {
        nodes,
        edges,
        project,
        addNode,
        deleteNode,
        createGroup,
        connectNodes,
    } = useCanvasStore();

    // Refs for current state to be accessible in event handlers without dependency cycles
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const messagesRef = useRef(messages);

    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
    }, [nodes, edges]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const handleToolCall = useCallback((name: string, args: any) => {
        console.log("Tool Call:", name, args);

        const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        switch (name) {
            case "add_node": {
                const {
                    type,
                    id,
                    x,
                    y,
                    content,
                    label,
                    prompt,
                    is_source,
                } = args;

                const finalId = id || generateId();

                const newNode: Node = {
                    id: finalId,
                    type,
                    position: { x, y },
                    data: {
                        label,
                        isUserProvided: is_source,
                        prompt,
                        content,
                    },
                };

                addNode(newNode);
                // Optimistically update ref so subsequent tools see this node
                nodesRef.current = [...nodesRef.current, newNode];
                break;
            }

            case "create_group": {
                const { node_ids, label } = args;
                createGroup(node_ids, label);
                break;
            }

            case "delete_node":
                const { id: deleteId } = args;
                deleteNode(deleteId);
                // Update ref
                nodesRef.current = nodesRef.current.filter(n => n.id !== deleteId);
                break;

            case "connect_nodes":
                const { source, target } = args;
                connectNodes(source, target);
                break;

        }
    }, [addNode, deleteNode, createGroup, connectNodes]);

    useEffect(() => {
        const stopContent = EventsOn("ai:stream:content", (content: string) => {
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                    return [...prev.slice(0, -1), { ...last, content: last.content + content }];
                } else {
                    return [...prev, { role: "assistant", content }];
                }
            });
        });

        const stopTool = EventsOn("ai:stream:tool", (data: any) => {
            if (data && data.name) {
                // Execute tool effect only, do not update chat history
                handleToolCall(data.name, data.args);
            }
        });

        // Handle session ID from backend
        const stopSession = EventsOn("ai:stream:session", (id: string) => {
            console.log("Received session ID from backend:", id);
            setSessionId(id);
        });

        const stopDone = EventsOn("ai:stream:done", () => {
            setIsStreaming(false);
            setSessionId(null); // Clear session when done
        });

        const stopError = EventsOn("ai:stream:error", (err: string) => {
            console.error("AI Stream Error:", err);
            setIsStreaming(false);
            setSessionId(null); // Clear session on error
            setMessages(prev => [...prev, { role: "assistant", content: `\n[Error: ${err}]` }]);
        });

        // Handle canvas state request from agent
        const stopStateRequest = EventsOn("ai:stream:get_canvas_state_request", async () => {
            console.log("Agent requested canvas state");
            
            if (!sessionId) {
                console.warn("No active session ID");
                return;
            }
            
            // Get the latest canvas state
            const currentNodes = nodesRef.current.map(n => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data
            }));
            
            const currentEdges = edgesRef.current.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target
            }));
            
            // Send state back to backend
            try {
                await UpdateCanvasState(sessionId, currentNodes, currentEdges);
                console.log("Canvas state sent to backend");
            } catch (err) {
                console.error("Failed to send canvas state:", err);
            }
        });

        return () => {
            if (stopContent) stopContent();
            if (stopTool) stopTool();
            if (stopSession) stopSession();
            if (stopDone) stopDone();
            if (stopError) stopError();
            if (stopStateRequest) stopStateRequest();
        };
    }, [handleToolCall, sessionId]);

    const sendMessage = async (content: string, modelId: string, providerId: number) => {
        if (!content.trim()) return;

        const userMsg: Message = { role: "user", content };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);

        try {
            // Call Backend - session ID will be generated by backend and sent via event
            await CanvasAgent({
                prompt: content,
                model: modelId,
                providerId: providerId,
                history: messagesRef.current.map(m => ({ role: m.role, content: m.content }))
            });
        } catch (err) {
            console.error(err);
            setIsStreaming(false);
            setSessionId(null);
        }
    };

    return {
        messages,
        isStreaming,
        sendMessage
    };
}
