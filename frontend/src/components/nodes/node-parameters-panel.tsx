import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ListModelProviders } from "../../../wailsjs/go/database/Service";
import { ListModels } from "../../../wailsjs/go/ai/Service";
import { database, ai } from "../../../wailsjs/go/models";
import type { WorkflowNodeData } from "./types";
import { Check, ChevronsUpDown, Loader2, Play } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";

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
  const [providers, setProviders] = useState<database.ModelProvider[]>([]);
  const [models, setModels] = useState<ai.Model[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [open, setOpen] = useState(false);

  // Load providers on mount
  useEffect(() => {
    const load = async () => {
      setLoadingProviders(true);
      try {
        const list = await ListModelProviders();
        setProviders(list || []);
      } catch (e) {
        console.error("Failed to load providers", e);
      } finally {
        setLoadingProviders(false);
      }
    };
    load();
  }, []);

  // Load models when provider changes
  useEffect(() => {
    if (nodeData.providerId) {
      const load = async () => {
        setLoadingModels(true);
        try {
          const list = await ListModels(nodeData.providerId!);
          setModels(list || []);
        } catch (e) {
          console.error("Failed to load models", e);
          setModels([]);
        } finally {
          setLoadingModels(false);
        }
      };
      load();
    } else {
      setModels([]);
    }
  }, [nodeData.providerId]);

  const handleProviderSelect = (providerId: number) => {
    // If clicking the same provider, do nothing (or maybe allow reload?)
    if (nodeData.providerId === providerId) return;

    // Select provider and clear model
    updateNodeData(nodeId, { providerId, modelId: "" });
  };

  const handleModelSelect = (modelId: string) => {
    updateNodeData(nodeId, { modelId });
    setOpen(false);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(nodeId, { prompt: e.target.value });
  };

  const selectedProvider = providers.find((p) => p.id === nodeData.providerId);
  const selectedModelId = nodeData.modelId;

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="w-60" asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className=" h-8 text-xs"
            >
              <div className="w-full text-ellipsis justify-start flex items-center gap-2 overflow-hidden">
                {selectedProvider && selectedModelId
                  ? `${selectedProvider.name} / ${selectedModelId}`
                  : "选择模型..."}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-125 p-0" align="start">
            <div className="flex h-75">
              {/* Providers Column */}
              <div className="w-1/3 border-r overflow-y-auto bg-muted/30 p-1">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1">
                  提供商
                </div>
                {loadingProviders ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderSelect(provider.id)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between",
                          nodeData.providerId === provider.id &&
                            "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <span className="truncate">{provider.name}</span>
                        {nodeData.providerId === provider.id && (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Models Column */}
              <div className="flex-1 flex flex-col">
                <Command className="h-full border-0">
                  <CommandInput
                    placeholder="搜索模型..."
                    className="h-9 border-b"
                  />
                  <CommandList className="max-h-full">
                    {loadingModels ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>未找到模型</CommandEmpty>
                        <CommandGroup
                          heading={
                            selectedProvider
                              ? `${selectedProvider.name} 模型`
                              : "请先选择提供商"
                          }
                        >
                          {models.map((model) => (
                            <CommandItem
                              key={model.id}
                              value={model.id}
                              onSelect={() => handleModelSelect(model.id)}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedModelId === model.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {model.id}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
