import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Image, Video, Music } from "lucide-react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type NodeType } from "../nodes";
import { type Node } from "@xyflow/react";
import { useCanvasStore } from "@/stores/use-canvas-store";

export function CanvasLeftPanel() {
  const { _ } = useLingui();
  const addNode = useCanvasStore((state) => state.addNode);
  const nodeIdCounter = useCanvasStore((state) => state.nodeIdCounter);
  const projectId = useCanvasStore((state) => state.project?.id);

  const handleAddNode = (type: NodeType) => {
    const typeLabels: Record<NodeType, string> = {
      text: _(msg`Text`),
      image: _(msg`Image`),
      video: _(msg`Video`),
      audio: _(msg`Audio`),
      group: _(msg`Group`),
    };

    const newNode: Node = {
      id: `node-${nodeIdCounter}`,
      type: type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: `${typeLabels[type]} ${_(msg`Node`)} ${nodeIdCounter}`,
        type: type,
        projectId: projectId,
      },
    };

    addNode(newNode);
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
      <Card className="p-2 shadow-lg rounded-full">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Text Node`)}
            onClick={() => handleAddNode("text")}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Image Node`)}
            onClick={() => handleAddNode("image")}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Video Node`)}
            onClick={() => handleAddNode("video")}
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={_(msg`Audio Node`)}
            onClick={() => handleAddNode("audio")}
          >
            <Music className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
