import { memo } from "react";
import {
  type NodeProps,
  useReactFlow,
  NodeToolbar,
  Position,
} from "@xyflow/react";
import { Music, Download } from "lucide-react";
import type { AudioNodeData } from "./types";
import { GenerateAudio } from "../../../wailsjs/go/ai/Service";
import { DownloadAssetFile } from "../../../wailsjs/go/database/Service";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseNode } from "./base-node";
import { useNodeRun } from "../../hooks/use-node-run";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const AudioNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const isSelected = props.selected;
  const nodeData = data as unknown as AudioNodeData;
  const { updateNodeData } = useReactFlow();
  const { _ } = useLingui();

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

  const handleSave = async () => {
    if (!nodeData.audioUrl) {
      toast.error(_(msg`No audio to save`));
      return;
    }
    try {
      const filename = nodeData.audioUrl.split("/").pop() || "";
      await DownloadAssetFile(filename);
      toast.success(_(msg`Asset saved`));
    } catch (err) {
      console.error("Failed to save asset:", err);
      toast.error(_(msg`Failed to save`));
    }
  };

  return (
    <BaseNode
      {...props}
      icon={Music}
      iconColorClass="text-green-500"
      onRun={handleRun}
      promptPlaceholder={_(msg`Enter audio processing prompt...`)}
      minWidth={200}
      minHeight={75}
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

      <div className="p-4 flex items-center justify-center bg-muted/20 w-full flex-1">
        {nodeData.processing ? (
          <div className="size-full space-y-2">
            <Skeleton className="h-8 w-full" />
          </div>
        ) : nodeData.audioUrl ? (
          <audio src={nodeData.audioUrl} controls className="size-full" />
        ) : (
          <div className="text-xs text-muted-foreground italic">
            <Trans>No audio yet</Trans>
          </div>
        )}
      </div>
    </BaseNode>
  );
});

AudioNode.displayName = "AudioNode";
