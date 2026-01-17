import { memo } from "react";
import {
  type NodeProps,
  NodeToolbar,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Download, Image as ImageIcon } from "lucide-react";
import type { ImageNodeData } from "./types";
import { GenerateImage } from "../../../wailsjs/go/ai/Service";
import { DownloadAssetFile } from "../../../wailsjs/go/database/Service";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseNode } from "./base-node";
import { useNodeRun } from "../../hooks/use-node-run";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";
import { toast } from "sonner";

export const ImageNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const nodeData = data as unknown as ImageNodeData;
  const isSelected = props.selected;
  const { updateNodeData } = useReactFlow();
  const { _ } = useLingui();

  const { handleRun } = useNodeRun({
    id,
    nodeData,
    apiFunction: GenerateImage,
    onSuccess: (response) => {
      updateNodeData(id, { imageUrl: response.content });
    },
    onStart: () => {
      updateNodeData(id, { imageUrl: undefined });
    },
  });

  const handleSave = async () => {
    if (nodeData.imageUrl == null) {
      toast.error(_(msg`No image to save`));
      return;
    }
    try {
      await DownloadAssetFile(nodeData.imageUrl.split("/").pop() || "");
      toast.success(_(msg`Asset saved`));
    } catch (err) {
      console.error("Failed to save asset:", err);
      toast.error(_(msg`Failed to save`));
    }
  };

  return (
    <BaseNode
      {...props}
      icon={ImageIcon}
      iconColorClass="text-blue-500"
      onRun={handleRun}
      promptPlaceholder={_(msg`Enter image processing prompt...`)}
      minWidth={200}
      minHeight={200}
    >
      <NodeToolbar
        isVisible={isSelected}
        position={Position.Top}
        align="center"
        offset={30}
      >
        <ButtonGroup>
          <Button
            onClick={handleSave}
            title="Download"
            size={"icon"}
            variant={"outline"}
          >
            <Download className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </NodeToolbar>

      <div className="p-0 overflow-hidden bg-muted/20 w-full flex-1 flex items-center justify-center">
        {nodeData.processing ? (
          <div className="size-full p-4 space-y-2 flex flex-col justify-center">
            <Skeleton className="h-32 w-full mx-auto" />
          </div>
        ) : nodeData.imageUrl ? (
          <img
            src={nodeData.imageUrl}
            alt="Preview"
            className="size-full object-contain"
          />
        ) : (
          <div className="text-xs text-muted-foreground italic p-4">
            <Trans>No image yet</Trans>
          </div>
        )}
      </div>
    </BaseNode>
  );
});

ImageNode.displayName = "ImageNode";
