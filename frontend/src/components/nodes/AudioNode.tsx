import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Music, Loader2 } from "lucide-react";
import type { AudioNodeData } from "./types";

export const AudioNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as AudioNodeData;
  
  return (
    <Card
      className={`max-w-75 py-0! gap-0 ${
        selected ? "ring-2 ring-primary" : ""
      } ${nodeData.processing ? "opacity-70" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      
      <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
        <Music className="h-4 w-4 text-green-500" />
        <span className="font-semibold text-sm">{nodeData.label}</span>
        {nodeData.processing && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
      </div>
      
      <div className="p-3 space-y-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">提示词</label>
          <Textarea
            placeholder="输入音频处理提示词..."
            className="min-h-15 text-sm"
            defaultValue={nodeData.prompt}
          />
        </div>
        
        {nodeData.audioUrl && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">音频</label>
            <div className="w-full p-2 bg-muted rounded-md">
              <audio
                src={nodeData.audioUrl}
                controls
                className="w-full"
              />
            </div>
          </div>
        )}
        
        {nodeData.input && !nodeData.audioUrl && (
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

AudioNode.displayName = "AudioNode";
