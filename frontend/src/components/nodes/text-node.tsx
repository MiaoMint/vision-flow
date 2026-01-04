import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import type { TextNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";

export const TextNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as TextNodeData;
  const { updateNodeData } = useReactFlow();

  return (
    <div className="relative">
      <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0">
        <FileText className="h-4 w-4 text-primary" />
        <input
          value={nodeData.label}
          onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
          className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
        {nodeData.processing && (
          <Loader2 className="h-3 w-3 animate-spin ml-auto" />
        )}
      </div>

      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />
        <div className="p-4 min-h-32 flex items-center justify-center">
          {nodeData.content ? (
            <div className="text-sm whitespace-pre-wrap w-full">
              {nodeData.content}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">暂无内容</div>
          )}
        </div>

        <Handle type="source" position={Position.Right} />
      </Card>

      {selected && (
        <NodeParametersPanel
          nodeId={id}
          nodeData={nodeData}
          promptPlaceholder="输入 AI 处理提示词..."
        />
      )}
    </div>
  );
});

TextNode.displayName = "TextNode";
