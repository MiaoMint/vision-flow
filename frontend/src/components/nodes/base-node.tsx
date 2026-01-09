import { Handle, Position, useReactFlow, type NodeProps, NodeResizeControl, NodeToolbar, EdgeText } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { NodeParametersPanel } from "./node-parameters-panel";
import type { BaseNodeData } from "./types";
import { PlusCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface BaseNodeProps extends NodeProps {
    icon: LucideIcon;
    iconColorClass?: string;
    children: React.ReactNode;
    onRun: () => void;
    promptPlaceholder?: string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export function BaseNode({
    id,
    data,
    selected,
    icon: Icon,
    iconColorClass = "text-primary",
    children,
    onRun,
    promptPlaceholder,
    minWidth = 200,
    minHeight = 200,
    maxWidth,
    maxHeight,
    width,
    height,
}: BaseNodeProps) {
    const nodeData = data as unknown as BaseNodeData;
    const { updateNodeData, getNodes, updateNode } = useReactFlow();

    // Only show parameters panel when single node is selected
    const selectedNodesCount = getNodes().filter((node) => node.selected).length;
    const isSelected = selected && selectedNodesCount === 1;

    useEffect(() => {
        if (!width && !height) {
            updateNode(id, {
                width: minWidth,
                height: minHeight
            });
        }
    }, []);

    return (
        <div className="size-full group">
            {isSelected && (
                <NodeResizeControl
                    minWidth={minWidth}
                    minHeight={minHeight}
                    maxWidth={maxWidth}
                    maxHeight={maxHeight}
                    position="bottom-right"
                >
                    <div className="absolute bottom-0 right-0 p-4 rounded-br-2xl cursor-nwse-resize bg-transparent nodrag z-50 pointer-events-auto" style={{ cursor: 'nwse-resize' }}></div>
                </NodeResizeControl>
            )}


            <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0 nodrag">
                {nodeData.processing ? (
                    <Spinner className="h-4 w-4 mr-1" />
                ) : (
                    <Icon className={cn("h-4 w-4", iconColorClass)} />
                )}
                <input
                    value={nodeData.label}
                    onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
                    className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                />
            </div>
            <Handle type="target" className="opacity-0 group-hover:opacity-100 transition-all" position={Position.Left} />
            <Handle type="source" className="opacity-0 group-hover:opacity-100 transition-all" position={Position.Right} />
            <Card
                className={cn(
                    "py-0! gap-0 size-full",
                    nodeData.error ? "ring-2 ring-destructive" : selected ? "ring-2 ring-primary" : "",
                    nodeData.processing ? "opacity-70" : ""
                )}
                style={{
                    minWidth,
                    minHeight,
                    maxWidth,
                    maxHeight
                }}
            >
                {children}
            </Card>

            <NodeToolbar
                isVisible={isSelected}
                position={Position.Bottom}
                align="center"
            >
                <NodeParametersPanel
                    nodeId={id}
                    nodeData={nodeData}
                    promptPlaceholder={promptPlaceholder}
                    onRun={onRun}
                />
            </NodeToolbar>

        </div >
    );
}
