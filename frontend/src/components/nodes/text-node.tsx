import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { TextNodeData } from "./types";
import { NodeParametersPanel } from "./node-parameters-panel";
import { GenerateText } from "../../../wailsjs/go/ai/Service";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export const TextNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as TextNodeData;
  const { updateNodeData } = useReactFlow();

  const handleRun = async () => {
    if (!nodeData.providerId || !nodeData.modelId) {
      updateNodeData(id, { error: "Please select a provider and model" });
      return;
    }
    if (!nodeData.prompt) {
      updateNodeData(id, { error: "Please enter a prompt" });
      return;
    }

    updateNodeData(id, { processing: true, error: undefined, content: undefined });

    try {
      const response = await GenerateText({
        prompt: nodeData.prompt,
        model: nodeData.modelId,
        providerId: nodeData.providerId,
      });
      console.log("GenerateText response:", response);
      updateNodeData(id, { processing: false, content: response.content });
    } catch (err: any) {
      console.error("GenerateText error:", err);
      updateNodeData(id, { processing: false, error: err.toString() });
    }
  };

  return (
    <div className="relative">
      <div className="p-3 flex items-center gap-2 absolute -top-10 left-0 right-0">
        {nodeData.processing ? (
          <Spinner className="h-4 w-4 mr-1" />
        ) : (
          <FileText className="h-4 w-4 text-primary" />
        )}
        <input
          value={nodeData.label}
          onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
          className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
        />
      </div>

      <Card
        className={`max-w-75 min-w-52 py-0! gap-0 ${selected ? "ring-2 ring-primary" : ""
          } ${nodeData.processing ? "opacity-70" : ""}`}
      >
        <Handle type="target" position={Position.Left} />
        <div className="p-4 max-h-75 min-h-32">
          {nodeData.processing ? (
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : nodeData.content ? (
            <div className="text-sm whitespace-pre-wrap w-full">
              {nodeData.content}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">暂无内容</div>
          )}
        </div>

        <Handle type="source" position={Position.Right} />
      </Card>

      {selected && (
        <NodeParametersPanel
          nodeId={id}
          nodeData={nodeData}
          promptPlaceholder="输入 AI 处理提示词..."
          onRun={handleRun}
        />
      )}
    </div>
  );
});

TextNode.displayName = "TextNode";
