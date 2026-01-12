import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Image, Video, Music } from "lucide-react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type NodeType } from "../nodes";

interface CanvasLeftPanelProps {
  onAddNode: (type: NodeType) => void;
}

export function CanvasLeftPanel({ onAddNode }: CanvasLeftPanelProps) {
  const { _ } = useLingui();

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
      <Card className="p-2 shadow-lg rounded-full">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Text Node`)}
            onClick={() => onAddNode("text")}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Image Node`)}
            onClick={() => onAddNode("image")}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Video Node`)}
            onClick={() => onAddNode("video")}
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Audio Node`)}
            onClick={() => onAddNode("audio")}
          >
            <Music className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
