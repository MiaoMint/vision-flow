import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ListModels } from "../../../wailsjs/go/ai/Service";
import { ai } from "../../../wailsjs/go/models";

export function ModelsListSettings() {
    const [models, setModels] = useState<ai.Model[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setLoading(true);
        try {
            const list = await ListModels(null);
            setModels(list || []);
        } catch (err) {
            console.error("Failed to load models", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">可用模型</h3>
                    <p className="text-sm text-muted-foreground">查看所有已配置提供商的 AI 模型。</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadModels} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    刷新
                </Button>
            </div>

            <div className="flex-1 overflow-auto">
                {loading && models.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>正在加载模型列表...</p>
                    </div>
                ) : models.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Box className="h-10 w-10 mb-4 opacity-50" />
                        <p className="text-lg font-medium">未找到模型</p>
                        <p className="text-sm mt-1">请先在"模型提供商"中配置 API Key</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {models.map((model, index) => (
                            <div key={`${model.id}-${index}`} className="group px-3 py-2 border rounded-md hover:bg-accent/50 transition-colors bg-card flex flex-col justify-center min-w-35">
                                <div className="font-mono text-xs font-medium truncate" title={model.id}>
                                    {model.id}
                                </div>
                                <div className="flex justify-between items-center mt-1 gap-2">
                                    <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                        {model.provider_name && (
                                            <span className="font-medium text-foreground/80">{model.provider_name}</span>
                                        )}
                                        <span className="opacity-70">{model.provider_type}</span>
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {model.input && model.input.length > 0 && (
                                        <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-accent/30 px-1 rounded">
                                            <span className="opacity-70">In:</span>
                                            <span>{model.input.join(", ")}</span>
                                        </div>
                                    )}
                                    {model.output && model.output.length > 0 && (
                                        <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-accent/30 px-1 rounded">
                                            <span className="opacity-70">Out:</span>
                                            <span>{model.output.join(", ")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
