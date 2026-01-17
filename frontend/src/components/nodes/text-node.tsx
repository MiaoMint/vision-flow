import { memo, useState } from "react";
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
import { cn } from "@/lib/utils";

export const TextNode = memo((props: NodeProps) => {
  const { id, data } = props;
  const nodeData = data as unknown as TextNodeData;
  const { updateNodeData } = useReactFlow();
  const { _ } = useLingui();
  const [isEditing, setIsEditing] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, {
      content: e.target.value,
    });
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

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
    >
      <div className={cn("p-2 w-full flex-1 flex overflow-auto", isEditing && "nodrag")}>
        {nodeData.processing ? (
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : isEditing ? (
          <textarea
            className="flex-1 bg-transparent outline-none resize-none"
            placeholder={_(msg`No content yet, double-click to edit`)}
            value={nodeData.content || ""}
            onChange={handleContentChange}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <div
            className={cn("flex-1 text-sm whitespace-pre-wrap", !nodeData.content && "text-muted-foreground")}
            onDoubleClick={handleDoubleClick}
          >
            {nodeData.content || _(msg`No content yet, double-click to edit`)}
          </div>
        )}
      </div>
    </BaseNode>
  );
});

TextNode.displayName = "TextNode";
