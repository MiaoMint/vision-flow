import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Video, Loader2 } from "lucide-react";
import type { VideoNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";

export const VideoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as VideoNodeData;
  const { updateNodeData } = useReactFlow();

  return (
    <div className="relative">
      <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0">
        <Video className="h-4 w-4 text-purple-500" />
        <input
          value={nodeData.label}
          onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
          className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
        {nodeData.processing && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
      </div>

      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />



        <div className="p-0 overflow-hidden bg-muted/20 min-h-37.5 flex items-center justify-center">
          {nodeData.videoUrl ? (
            <video
              src={nodeData.videoUrl}
              controls
              className="w-full h-auto max-h-75 object-contain"
            />
          ) : (
            <div className="text-xs text-muted-foreground italic p-4">暂无视频</div>
          )}
        </div>

        <Handle type="source" position={Position.Right} />
      </Card>

      {selected && (
        <NodeParametersPanel
          nodeId={id}
          nodeData={nodeData}
          promptPlaceholder="输入视频处理提示词..."
        />
      )}
    </div>
  );
});

VideoNode.displayName = "VideoNode";
