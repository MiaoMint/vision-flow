import { memo } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Music } from "lucide-react";
import type { AudioNodeData } from "./types";
import { GenerateAudio } from "../../../wailsjs/go/ai/Service";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseNode } from "./base-node";
import { useNodeRun } from "../../hooks/use-node-run";

export const AudioNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const nodeData = data as unknown as AudioNodeData;
  const { updateNodeData } = useReactFlow();

  const { handleRun } = useNodeRun({
    id,
    nodeData,
    apiFunction: GenerateAudio,
    onSuccess: (response) => {
      updateNodeData(id, { audioUrl: response.content });
    },
    onStart: () => {
      updateNodeData(id, { audioUrl: undefined });
    },
  });

  return (
    <BaseNode
      {...props}
      icon={Music}
      iconColorClass="text-green-500"
      onRun={handleRun}
      promptPlaceholder="输入音频处理提示词..."
      minWidth={200}
      minHeight={75}
    >
      <div className="p-4 flex items-center justify-center bg-muted/20 w-full flex-1">
        {nodeData.processing ? (
          <div className="size-full space-y-2">
            <Skeleton className="h-8 w-full" />
          </div>
        ) : nodeData.audioUrl ? (
          <audio src={nodeData.audioUrl} controls className="size-full" />
        ) : (
          <div className="text-xs text-muted-foreground italic">暂无音频</div>
        )}
      </div>
    </BaseNode>
  );
});

AudioNode.displayName = "AudioNode";
