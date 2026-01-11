import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Trans } from "@lingui/react/macro";
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";

interface ModelSelectorProps {
    providerId?: number;
    modelId?: string;
    onProviderChange: (providerId: number) => void;
    onModelChange: (modelId: string) => void;
}

export function ModelSelector({
    providerId,
    modelId,
    onProviderChange,
    onModelChange,
}: ModelSelectorProps) {
    const { _ } = useLingui();
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
        if (providerId) {
            const load = async () => {
                setLoadingModels(true);
                try {
                    const list = await ListModels(providerId);
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
    }, [providerId]);

    const handleProviderSelect = (selectedProviderId: number) => {
        if (providerId === selectedProviderId) return;
        onProviderChange(selectedProviderId);
    };

    const handleModelSelect = (selectedModelId: string) => {
        onModelChange(selectedModelId);
        setOpen(false);
    };

    const selectedProvider = providers.find((p) => p.id === providerId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="w-60" asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-8 text-xs"
                >
                    <div className="w-full text-ellipsis justify-start flex items-center gap-2 overflow-hidden">
                        {selectedProvider && modelId
                            ? `${selectedProvider.name} / ${modelId}`
                            : <Trans>Select model...</Trans>}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-125 p-0" align="start">
                <div className="flex h-75">
                    {/* Providers Column */}
                    <div className="w-1/3 border-r overflow-y-auto bg-muted/30 p-1">
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1">
                            <Trans>Provider</Trans>
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
                                            providerId === provider.id &&
                                            "bg-accent text-accent-foreground font-medium"
                                        )}
                                    >
                                        <span className="truncate">{provider.name}</span>
                                        {providerId === provider.id && (
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
                                placeholder={_(msg`Search models...`)}
                                className="h-9 border-b"
                            />
                            <CommandList className="max-h-full flex-1 min-h-0 w-75">
                                {loadingModels ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <CommandEmpty><Trans>Model not found</Trans></CommandEmpty>
                                        <CommandGroup
                                            heading={
                                                selectedProvider
                                                    ? `${selectedProvider.name} ${_(msg`Models`)}`
                                                    : _(msg`Please select a provider first`)
                                            }
                                        >
                                            {models.map((model) => (
                                                <CommandItem
                                                    key={model.id}
                                                    value={model.id}
                                                    onSelect={() => handleModelSelect(model.id)}
                                                    className="text-xs"
                                                >
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex items-center">
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4 shrink-0",
                                                                    modelId === model.id
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            <span className="truncate">{model.id}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 pl-6">
                                                            {model.input?.map((i) => (
                                                                <span
                                                                    key={`in-${i}`}
                                                                    className="px-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]"
                                                                >
                                                                    In: {i}
                                                                </span>
                                                            ))}
                                                            {model.output?.map((o) => (
                                                                <span
                                                                    key={`out-${o}`}
                                                                    className="px-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px]"
                                                                >
                                                                    Out: {o}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
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
    );
}
