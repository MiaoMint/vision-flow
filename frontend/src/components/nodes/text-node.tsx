import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import type { TextNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";

export const TextNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as TextNodeData;

  return (
    <div className="relative">
      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />

        <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{nodeData.label}</span>
          {nodeData.processing && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" />
          )}
        </div>

        <div className="p-4 min-h-25 flex items-center justify-center">
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
