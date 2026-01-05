import { memo } from "react";
import { type NodeProps, NodeResizeControl, NodeToolbar, Position } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup, } from "@/components/ui/button-group";
import { Play, Ungroup } from "lucide-react";

export const GroupNode = memo(({ id, data, selected }: NodeProps) => {
    const { updateNodeData, deleteElements } = useReactFlow();

    const onRun = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log("Execute group workflow", id);
        // data.onRun?.(); // If we passed a run handler in future
    };

    const onUngroup = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
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
                        onClick={onRun}
                        title="Execute Workflow"
                        size={"icon"}
                        variant={"outline"}
                    >
                        <Play className="h-4 w-4" />
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
                <input
                    value={data.label as string || "Group"}
                    onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
                    className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                />
            </div>
        </div>
    );
});

GroupNode.displayName = "GroupNode";
