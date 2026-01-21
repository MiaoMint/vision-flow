import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/stores/use-canvas-store";
import { EventsOn } from "../../wailsjs/runtime/runtime"; // Adjust import path if needed
import type { Node, Edge } from "@xyflow/react";
import { CanvasAgent } from "../../wailsjs/go/ai/Service";

interface Message {
    role: "user" | "assistant";
    content: string;
    toolCalls?: string[];
}

export function useAICanvasEdit() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const {
        nodes,
        edges,
        project,
        addNode,
        setNodes,
        setEdges,
        onConnect,
        recordState
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
                if (!node_ids || !Array.isArray(node_ids) || node_ids.length === 0) return;

                const targetNodes = nodesRef.current.filter(n => node_ids.includes(n.id));
                if (targetNodes.length === 0) return;

                // Calculate bounding box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                targetNodes.forEach(n => {
                    const nWidth = n.width || n.measured?.width || 200; // Default or measured
                    const nHeight = n.height || n.measured?.height || 200;
                    if (n.position.x < minX) minX = n.position.x;
                    if (n.position.y < minY) minY = n.position.y;
                    if (n.position.x + nWidth > maxX) maxX = n.position.x + nWidth;
                    if (n.position.y + nHeight > maxY) maxY = n.position.y + nHeight;
                });

                const PADDING = 50;
                const groupX = minX - PADDING;
                const groupY = minY - PADDING;
                const groupWidth = (maxX - minX) + (PADDING * 2);
                const groupHeight = (maxY - minY) + (PADDING * 2);

                const groupNode: Node = {
                    id: generateId(),
                    type: "group",
                    position: { x: groupX, y: groupY },
                    width: groupWidth,
                    height: groupHeight,
                    style: {
                        width: maxX - minX + PADDING * 2,
                        height: maxY - minY + PADDING * 2,
                        zIndex: -1,
                        border: "none",
                        background: "transparent",
                        padding: 0,
                    },
                    selectable: false,
                    data: { label: label || "Group" }
                };
                addNode(groupNode);
                nodesRef.current = [...nodesRef.current, groupNode];
                break;
            }

            case "delete_node":
                const { id: deleteId } = args;
                const filteredNodes = nodesRef.current.filter(n => n.id !== deleteId);
                setNodes(filteredNodes);
                nodesRef.current = filteredNodes;
                recordState();
                break;

            case "connect_nodes":
                const { source, target } = args;
                const exists = edgesRef.current.some(e => e.source === source && e.target === target);
                if (!exists) {
                    const newEdge = { id: `e-${source}-${target}`, source, target };
                    onConnect({ source, target, sourceHandle: null, targetHandle: null });
                    edgesRef.current = [...edgesRef.current, newEdge as any];
                }
                break;

        }
    }, [addNode, setNodes, setEdges, onConnect, recordState]);

    useEffect(() => {
        const stopContent = EventsOn("ai:stream:content", (content: string) => {
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                    return [...prev.slice(0, -1), { ...last, content: last.content + content }];
                } else {
                    return [...prev, { role: "assistant", content, toolCalls: [] }];
                }
            });
        });

        const stopTool = EventsOn("ai:stream:tool", (data: any) => {
            if (data && data.name) {
                // Add visual feedback to chat (merged into current message)
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    const toolName = data.name;

                    if (last && last.role === "assistant") {
                        // Append to existing toolCalls or create new array if undefined
                        const currentTools = last.toolCalls || [];
                        return [...prev.slice(0, -1), {
                            ...last,
                            toolCalls: [...currentTools, toolName]
                        }];
                    } else {
                        // Should technically be attached to an assistant message, create one if not exists
                        return [...prev, {
                            role: "assistant",
                            content: "",
                            toolCalls: [toolName]
                        }];
                    }
                });

                handleToolCall(data.name, data.args);
            }
        });

        const stopDone = EventsOn("ai:stream:done", () => {
            setIsStreaming(false);
        });

        const stopError = EventsOn("ai:stream:error", (err: string) => {
            console.error("AI Stream Error:", err);
            setIsStreaming(false);
            setMessages(prev => [...prev, { role: "assistant", content: `\n[Error: ${err}]` }]);
        });

        return () => {
            if (stopContent) stopContent();
            if (stopTool) stopTool();
            if (stopDone) stopDone();
            if (stopError) stopError();
        };
    }, [handleToolCall]);

    const sendMessage = async (content: string, modelId: string, providerId: number) => {
        if (!content.trim()) return;

        const userMsg: Message = { role: "user", content };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);

        try {
            // Simplify CurrentNodes for the request
            const simpleNodes = nodesRef.current.map(n => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data
            }));
            const simpleEdges = edgesRef.current.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target
            }));

            // Call Backend
            await CanvasAgent({
                prompt: content,
                currentNodes: simpleNodes,
                currentEdges: simpleEdges,
                model: modelId,
                providerId: providerId,
                history: messagesRef.current.map(m => ({ role: m.role, content: m.content }))
            });
        } catch (err) {
            console.error(err);
            setIsStreaming(false);
        }
    };

    return {
        messages,
        isStreaming,
        sendMessage
    };
}
