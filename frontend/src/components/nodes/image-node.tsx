import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import type { ImageNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";
import { GenerateImage } from "../../../wailsjs/go/ai/Service";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as ImageNodeData;
  const { updateNodeData } = useReactFlow();

  const handleRun = async () => {
    if (!nodeData.providerId || !nodeData.modelId) {
      updateNodeData(id, { error: "Please select a provider and model" });
      return;
    }
    if (!nodeData.prompt) {
      updateNodeData(id, { error: "Please enter a prompt" });
      return;
    }

    updateNodeData(id, { processing: true, error: undefined, imageUrl: undefined });

    try {
      const response = await GenerateImage({
        prompt: nodeData.prompt,
        model: nodeData.modelId,
        providerId: nodeData.providerId,
      });
      console.log("GenerateImage response:", response);
      updateNodeData(id, { processing: false, imageUrl: response.content });
    } catch (err: any) {
      console.error("GenerateImage error:", err);
      updateNodeData(id, { processing: false, error: err.toString() });
    }
  };

  return (
    <div className="relative">
      <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0">
        {nodeData.processing ? (
          <Spinner className="h-4 w-4 mr-1" />
        ) : (
          <ImageIcon className="h-4 w-4 text-blue-500" />
        )}
        <input
          value={nodeData.label}
          onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
          className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
      </div>

      <Card
        className={`max-w-120 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />

        <div className="p-0 overflow-hidden bg-muted/20 min-h-37.5 flex items-center justify-center">
          {nodeData.processing ? (
            <div className="w-full h-37.5 p-4 space-y-2 flex flex-col justify-center">
              <Skeleton className="h-32 w-full mx-auto" />
            </div>
          ) : nodeData.imageUrl ? (
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
          onRun={handleRun}
        />
      )}
    </div>
  );
});

ImageNode.displayName = "ImageNode";
