import { memo, useRef } from "react";
import { type NodeProps, NodeResizeControl, NodeToolbar, Position } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Play, Ungroup, Square } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { toast } from "sonner";
import type { BaseNodeData } from "./types";

export const GroupNode = memo(({ id, data, selected, }: NodeProps) => {
    const nodeData = data as unknown as BaseNodeData;
    const { updateNodeData, deleteElements, getNodes, getEdges, getNode, getIntersectingNodes } = useReactFlow();
    const abortRef = useRef(false);

    const pollNodes = async (nodeIds: string[]) => {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (abortRef.current) {
                    clearInterval(interval);
                    resolve();
                    return;
                }
                const nodes = getNodes().filter(n => nodeIds.includes(n.id));
                const allDone = nodes.every(n => !n.data.processing);
                if (allDone) {
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
        });
    };

    const onRun = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const groupNode = getNode(id);
        if (!groupNode) return;

        const intersectingNodes = getIntersectingNodes(groupNode).filter(n => n.id !== id && n.type !== "group");

        const isAnyRunning = intersectingNodes.some(n => n.data.processing);
        if (isAnyRunning) {
            toast.warning("Some nodes are already running, skipping execution");
            return;
        }

        updateNodeData(id, { processing: true });
        abortRef.current = false;

        try {
            const edges = getEdges();
            const nodeIds = new Set(intersectingNodes.map(n => n.id));

            const dependencies = new Map<string, Set<string>>();
            intersectingNodes.forEach(n => dependencies.set(n.id, new Set()));

            edges.forEach(edge => {
                if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
                    dependencies.get(edge.target)?.add(edge.source);
                }
            });

            const layers: string[][] = [];
            const processed = new Set<string>();

            while (processed.size < intersectingNodes.length) {
                const currentLayer: string[] = [];
                for (const node of intersectingNodes) {
                    if (processed.has(node.id)) continue;

                    const nodeDeps = dependencies.get(node.id);
                    const allDepsProcessed = Array.from(nodeDeps || []).every(d => processed.has(d));

                    if (allDepsProcessed) {
                        currentLayer.push(node.id);
                    }
                }

                if (abortRef.current) break;

                if (currentLayer.length === 0) {
                    toast.error("Circular dependency detected, executing remaining nodes individually");
                    intersectingNodes.filter(n => !processed.has(n.id)).forEach(n => currentLayer.push(n.id));
                }

                currentLayer.sort((aId, bId) => {
                    const a = getNode(aId);
                    const b = getNode(bId);
                    if (!a || !b) return 0;
                    if (Math.abs(a.position.y - b.position.y) > 10) return a.position.y - b.position.y;
                    return a.position.x - b.position.x;
                });

                layers.push(currentLayer);
                currentLayer.forEach(id => processed.add(id));
            }

            const runId = Date.now().toString();

            for (const layer of layers) {
                if (abortRef.current) {
                    toast.info("Workflow stopped");
                    break;
                }

                layer.forEach(nodeId => {
                    updateNodeData(nodeId, { runTrigger: runId });
                });

                // Allow a brief moment for state to propagate
                await new Promise(r => setTimeout(r, 200));

                await pollNodes(layer);

                const layerNodes = getNodes().filter(n => layer.includes(n.id));
                const hasError = layerNodes.some(n => n.data.error);
                if (hasError) {
                    toast.error("Workflow stopped due to node error");
                    break;
                }
            }

        } catch (error) {
            console.error("Group execution failed", error);
            toast.error("Group execution failed");
        } finally {
            updateNodeData(id, { processing: false });
        }
    };

    const onUngroup = (e: React.MouseEvent) => {
        e.stopPropagation();
        abortRef.current = true;
        deleteElements({ nodes: [{ id }] });
    };

    const onStop = (e: React.MouseEvent) => {
        e.stopPropagation();
        abortRef.current = true;
    };

    const isSelected = selected;

    return (
        <div className={cn(["h-full w-full relative group border rounded-2xl bg-muted/20", selected && "border-primary bg-primary/5 "])}>

            <NodeResizeControl
                minWidth={100}
                minHeight={100}
                position="bottom-right"
                className="bg-transparent border-none"
            >
                <div
                    className="absolute bottom-0 right-0 p-4 rounded-br-2xl cursor-nwse-resize bg-transparent nodrag z-50 pointer-events-auto"
                    style={{ cursor: 'nwse-resize' }}
                />
            </NodeResizeControl>

            <NodeToolbar
                isVisible={isSelected}
                position={Position.Top}
                align="center"
            >
                <ButtonGroup>
                    <Button
                        onClick={data.processing ? onStop : onRun}
                        title={data.processing ? "Stop Workflow" : "Execute Workflow"}
                        size={"icon"}
                        variant={data.processing ? "destructive" : "outline"}
                    >
                        {data.processing ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                        className="text-destructive hover:text-destructive hover:bg-muted"
                        onClick={onUngroup}
                        title="Dissolve Group"
                        size={"icon"}
                        variant={"outline"}
                    >
                        <Ungroup className="h-4 w-4" />
                    </Button>
                </ButtonGroup>
            </NodeToolbar>


            <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0 nodrag">
                {nodeData.processing && (
                    <Spinner className="h-4 w-4 mr-1" />
                )}
                <input
                    value={nodeData.label}
                    onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
                    className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                />
            </div>
        </div>
    );
});

GroupNode.displayName = "GroupNode";
