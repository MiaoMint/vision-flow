import { memo, useRef, useState } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Video, Play, Pause } from "lucide-react";
import type { VideoNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";
import { GenerateVideo } from "../../../wailsjs/go/ai/Service";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const VideoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as VideoNodeData;
  const { updateNodeData } = useReactFlow();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleRun = async () => {
    if (!nodeData.providerId || !nodeData.modelId) {
      updateNodeData(id, { error: "Please select a provider and model" });
      return;
    }
    if (!nodeData.prompt) {
      updateNodeData(id, { error: "Please enter a prompt" });
      return;
    }

    updateNodeData(id, { processing: true, error: undefined, videoUrl: undefined });
    setIsPlaying(false);

    try {
      const response = await GenerateVideo({
        prompt: nodeData.prompt,
        model: nodeData.modelId,
        providerId: nodeData.providerId,
      });
      console.log("GenerateVideo response:", response);
      updateNodeData(id, { processing: false, videoUrl: response.content });
    } catch (err: any) {
      console.error("GenerateVideo error:", err);
      updateNodeData(id, { processing: false, error: err.toString() });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="relative">
      <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0">
        {nodeData.processing ? (
          <Spinner className="h-4 w-4 mr-1" />
        ) : (
          <Video className="h-4 w-4 text-purple-500" />
        )}
        <input
          value={nodeData.label}
          onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
          className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
      </div>

      <Card
        className={`max-w-200 min-w-32 py-0! gap-0 ${nodeData.error ? "ring-2 ring-destructive" : selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />

        <div className="p-0 overflow-hidden bg-muted/20 min-h-37.5 flex items-center justify-center relative group">
          {nodeData.processing ? (
            <div className="w-full h-37.5 p-4 space-y-2 flex flex-col justify-center">
              <Skeleton className="h-32 w-full mx-auto" />
            </div>
          ) : nodeData.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={nodeData.videoUrl}
                className="w-full h-auto max-h-75 object-contain"
                onEnded={onVideoEnded}
                onClick={togglePlay}
              />
              <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-200 ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-12 w-12 bg-background/80 hover:bg-background shadow-lg backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
              </div>
            </>
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
          onRun={handleRun}
        />
      )}
    </div>
  );
});

VideoNode.displayName = "VideoNode";
