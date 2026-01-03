import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import type { ImageNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";

export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as ImageNodeData;

  return (
    <div className="relative">
      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />

        <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-sm">{nodeData.label}</span>
          {nodeData.processing && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" />
          )}
        </div>

        <div className="p-0 overflow-hidden bg-muted/20 min-h-37.5 flex items-center justify-center">
          {nodeData.imageUrl ? (
            <img
              src={nodeData.imageUrl}
              alt="Preview"
              className="w-full h-auto max-h-75 object-contain"
            />
          ) : (
            <div className="text-xs text-muted-foreground italic p-4">
              暂无图片
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Right} />
      </Card>

      {selected && (
        <NodeParametersPanel
          nodeId={id}
          nodeData={nodeData}
          promptPlaceholder="输入图片处理提示词..."
        />
      )}
    </div>
  );
});

ImageNode.displayName = "ImageNode";
