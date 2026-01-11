import { memo, useRef, useState } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Video, Play, Pause } from "lucide-react";
import type { VideoNodeData } from "./types";
import { GenerateVideo } from "../../../wailsjs/go/ai/Service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BaseNode } from "./base-node";
import { useNodeRun } from "../../hooks/use-node-run";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";

export const VideoNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const nodeData = data as unknown as VideoNodeData;
  const { updateNodeData } = useReactFlow();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { _ } = useLingui();

  const { handleRun } = useNodeRun({
    id,
    nodeData,
    apiFunction: GenerateVideo,
    onSuccess: (response) => {
      updateNodeData(id, { videoUrl: response.content });
    },
    onStart: () => {
      updateNodeData(id, { videoUrl: undefined });
      setIsPlaying(false);
    },
  });

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
    <BaseNode
      {...props}
      icon={Video}
      iconColorClass="text-purple-500"
      onRun={handleRun}
      promptPlaceholder={_(msg`Enter video processing prompt...`)}
      minWidth={200}
      minHeight={200}
    >
      <div className="p-0 overflow-hidden bg-muted/20 w-full flex-1 flex items-center justify-center relative group">
        {nodeData.processing ? (
          <div className="w-full h-full p-4 space-y-2 flex flex-col justify-center">
            <Skeleton className="h-32 w-full mx-auto" />
          </div>
        ) : nodeData.videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={nodeData.videoUrl}
              className="w-full h-full object-contain"
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
          <div className="text-xs text-muted-foreground italic p-4"><Trans>No video yet</Trans></div>
        )}
      </div>
    </BaseNode>
  );
});

VideoNode.displayName = "VideoNode";
