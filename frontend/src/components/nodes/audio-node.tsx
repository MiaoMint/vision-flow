import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Music, Loader2 } from "lucide-react";
import type { AudioNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";

export const AudioNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as AudioNodeData;

  return (
    <div className="relative">
      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />

        <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
          <Music className="h-4 w-4 text-green-500" />
          <span className="font-semibold text-sm">{nodeData.label}</span>
          {nodeData.processing && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" />
          )}
        </div>

        <div className="p-4 flex items-center justify-center bg-muted/20">
          {nodeData.audioUrl ? (
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
        />
      )}
    </div>
  );
});

AudioNode.displayName = "AudioNode";
