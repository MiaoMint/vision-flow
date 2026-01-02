import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Video, Loader2 } from "lucide-react";
import type { VideoNodeData } from "./types";

export const VideoNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as VideoNodeData;
  
  return (
    <Card
      className={`max-w-75 py-0! gap-0 ${
        selected ? "ring-2 ring-primary" : ""
      } ${nodeData.processing ? "opacity-70" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      
      <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
        <Video className="h-4 w-4 text-purple-500" />
        <span className="font-semibold text-sm">{nodeData.label}</span>
        {nodeData.processing && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
      </div>
      
      <div className="p-3 space-y-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">提示词</label>
          <Textarea
            placeholder="输入视频处理提示词..."
            className="min-h-15 text-sm"
            defaultValue={nodeData.prompt}
          />
        </div>
        
        {nodeData.videoUrl && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">视频</label>
            <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
              <video
                src={nodeData.videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        
        {nodeData.input && !nodeData.videoUrl && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">输入数据</label>
            <div className="text-xs p-2 bg-muted rounded-md max-h-25 overflow-auto">
              {typeof nodeData.input === 'string' ? nodeData.input : JSON.stringify(nodeData.input)}
            </div>
          </div>
        )}
        
        {nodeData.error && (
          <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md">
            {nodeData.error}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} />
    </Card>
  );
});

VideoNode.displayName = "VideoNode";
