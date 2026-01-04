import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Music } from "lucide-react";
import type { AudioNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";
import { GenerateAudio } from "../../../wailsjs/go/ai/Service";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export const AudioNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as AudioNodeData;
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

    updateNodeData(id, { processing: true, error: undefined, audioUrl: undefined });

    try {
      const response = await GenerateAudio({
        prompt: nodeData.prompt,
        model: nodeData.modelId,
        providerId: nodeData.providerId,
      });
      console.log("GenerateAudio response:", response);
      updateNodeData(id, { processing: false, audioUrl: response.content });
    } catch (err: any) {
      console.error("GenerateAudio error:", err);
      updateNodeData(id, { processing: false, error: err.toString() });
    }
  };

  return (
    <div className="relative">
      <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0">
        {nodeData.processing ? (
          <Spinner className="h-4 w-4 mr-1" />
        ) : (
          <Music className="h-4 w-4 text-green-500" />
        )}
        <input
          value={nodeData.label}
          onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
          className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
      </div>

      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />

        <div className="p-4 flex items-center justify-center bg-muted/20 min-h-16">
          {nodeData.processing ? (
            <div className="w-full space-y-2">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : nodeData.audioUrl ? (
            <audio src={nodeData.audioUrl} controls className="w-full" />
          ) : (
            <div className="text-xs text-muted-foreground italic">暂无音频</div>
          )}
        </div>

        <Handle type="source" position={Position.Right} />
      </Card>

      {selected && (
        <NodeParametersPanel
          nodeId={id}
          nodeData={nodeData}
          promptPlaceholder="输入音频处理提示词..."
          onRun={handleRun}
        />
      )}
    </div>
  );
});

AudioNode.displayName = "AudioNode";
