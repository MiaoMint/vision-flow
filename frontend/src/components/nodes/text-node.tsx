import { memo } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { FileText } from "lucide-react";
import type { TextNodeData } from "./types";
import { GenerateText } from "../../../wailsjs/go/ai/Service";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseNode } from "./base-node";
import { useNodeRun } from "../../hooks/use-node-run";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";

export const TextNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const nodeData = data as unknown as TextNodeData;
  const { updateNodeData } = useReactFlow();
  const { _ } = useLingui();

  const { handleRun } = useNodeRun({
    id,
    nodeData,
    apiFunction: GenerateText,
    onSuccess: (response) => {
      updateNodeData(id, { content: response.content });
    },
    onStart: () => {
      updateNodeData(id, { content: undefined });
    },
  });

  return (
    <BaseNode
      {...props}
      icon={FileText}
      onRun={handleRun}
      promptPlaceholder={_(msg`Enter AI processing prompt...`)}
      minWidth={200}
      minHeight={200}
      maxWidth={400}
      maxHeight={400}
    >
      <div className="p-4 w-full flex-1 overflow-auto">
        {nodeData.processing ? (
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : nodeData.content ? (
          <div className="text-sm whitespace-pre-wrap">
            {nodeData.content}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic"><Trans>No content yet</Trans></div>
        )}
      </div>
    </BaseNode>
  );
});

TextNode.displayName = "TextNode";
