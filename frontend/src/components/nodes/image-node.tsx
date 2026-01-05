import { memo } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Image as ImageIcon } from "lucide-react";
import type { ImageNodeData } from "./types";
import { GenerateImage } from "../../../wailsjs/go/ai/Service";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseNode } from "./base-node";
import { useNodeRun } from "../../hooks/use-node-run";

export const ImageNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const nodeData = data as unknown as ImageNodeData;
  const { updateNodeData } = useReactFlow();

  const { handleRun } = useNodeRun({
    id,
    nodeData,
    apiFunction: GenerateImage,
    onSuccess: (response) => {
      updateNodeData(id, { imageUrl: response.content });
    },
    onStart: () => {
      updateNodeData(id, { imageUrl: undefined });
    },
  });

  return (
    <BaseNode
      {...props}
      icon={ImageIcon}
      iconColorClass="text-blue-500"
      onRun={handleRun}
      promptPlaceholder="输入图片处理提示词..."
      minWidth={200}
      minHeight={200}
    >
      <div className="p-0 overflow-hidden bg-muted/20 w-full flex-1 flex items-center justify-center">
        {nodeData.processing ? (
          <div className="size-full p-4 space-y-2 flex flex-col justify-center">
            <Skeleton className="h-32 w-full mx-auto" />
          </div>
        ) : nodeData.imageUrl ? (
          <img
            src={nodeData.imageUrl}
            alt="Preview"
            className="size-full object-contain"
          />
        ) : (
          <div className="text-xs text-muted-foreground italic p-4">
            暂无图片
          </div>
        )}
      </div>
    </BaseNode>
  );
});

ImageNode.displayName = "ImageNode";
