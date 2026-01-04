import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { WorkflowNodeData } from "./types";
import { Loader2, Play } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { ModelSelector } from "@/components/ai/model-selector";

interface NodeParametersPanelProps {
  nodeId: string;
  nodeData: WorkflowNodeData;
  promptPlaceholder?: string;
  onRun?: () => void;
}

export function NodeParametersPanel({
  nodeId,
  nodeData,
  promptPlaceholder = "输入 AI 处理提示词...",
  onRun,
}: NodeParametersPanelProps) {
  const { updateNodeData } = useReactFlow();

  const handleProviderChange = (providerId: number) => {
    // Select provider and clear model
    updateNodeData(nodeId, { providerId, modelId: "" });
  };

  const handleModelChange = (modelId: string) => {
    updateNodeData(nodeId, { modelId });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(nodeId, { prompt: e.target.value });
  };

  return (
    <Card className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-175 shadow-lg z-50 flex flex-col py-0! overflow-hidden gap-0!">
      <div className="flex-1 flex flex-col min-h-40">
        <Textarea
          placeholder={promptPlaceholder}
          className="flex-1 resize-none border-0 focus-visible:ring-0 rounded-none p-3 text-sm shadow-none"
          value={nodeData.prompt || ""}
          onChange={handlePromptChange}
        />

        {(nodeData.input || nodeData.output || nodeData.error) && (
          <div className="border-t bg-muted/20 max-h-40 overflow-y-auto">
            {nodeData.input && (
              <div className="p-2 border-b last:border-0 opacity-80">
                <label className="text-xs text-muted-foreground block mb-1">
                  输入
                </label>
                <div className="text-xs font-mono text-muted-foreground truncate">
                  {typeof nodeData.input === "string"
                    ? nodeData.input
                    : JSON.stringify(nodeData.input)}
                </div>
              </div>
            )}
            {nodeData.output && (
              <div className="p-2 border-b last:border-0 opacity-80">
                <label className="text-xs text-muted-foreground block mb-1">
                  输出
                </label>
                <div className="text-xs font-mono text-muted-foreground truncate">
                  {typeof nodeData.output === "string"
                    ? nodeData.output
                    : JSON.stringify(nodeData.output)}
                </div>
              </div>
            )}
            {nodeData.error && (
              <div className="p-2 bg-destructive/10 text-destructive text-xs">
                {nodeData.error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-2 border-t bg-muted/30 flex gap-2 justify-between">
        <ModelSelector
          providerId={nodeData.providerId}
          modelId={nodeData.modelId}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
        />

        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onRun}
          disabled={!onRun || nodeData.processing}
        >
          {nodeData.processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </Button>
      </div>
    </Card>
  );
}
