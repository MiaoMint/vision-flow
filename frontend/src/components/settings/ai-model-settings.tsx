import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GetAIConfig, SaveAIConfig } from "../../../wailsjs/go/database/Service";
import { database } from "../../../wailsjs/go/models";

const PROVIDERS = ["gemini", "openai", "claude"];

export function AIModelSettings() {
    const [configs, setConfigs] = useState<Record<string, database.AIConfig>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        const newConfigs: Record<string, database.AIConfig> = {};
        try {
            for (const provider of PROVIDERS) {
                const config = await GetAIConfig(provider);
                newConfigs[provider] = config || new database.AIConfig({ provider });
            }
            setConfigs(newConfigs);
        } catch (err) {
            console.error("Failed to load configs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (provider: string) => {
        const config = configs[provider];
        if (!config) return;
        try {
            config.provider = provider;
            await SaveAIConfig(config);
            // Ideally show a toast
        } catch (err) {
            console.error(`Failed to save ${provider}`, err);
        }
    };

    const handleChange = (provider: string, field: "apiKey" | "baseUrl", value: string) => {
        setConfigs((prev) => ({
            ...prev,
            [provider]: new database.AIConfig({
                ...prev[provider],
                [field]: value,
            }),
        }));
    };

    return (
        <div className="p-8 max-w-3xl">
            <div className="mb-6">
                <h3 className="text-lg font-medium">模型服务</h3>
                <p className="text-sm text-muted-foreground">配置各大 AI 模型的访问凭证。</p>
            </div>
            <div className="space-y-8">
                {PROVIDERS.map((provider, index) => {
                    const config = configs[provider] || new database.AIConfig({ provider });

                    return (
                        <div key={provider} className="space-y-4">
                            {index > 0 && <Separator className="my-6" />}

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-medium capitalize">{provider}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Configure connection details for {provider}.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSave(provider)}
                                    disabled={loading}
                                >
                                    保存
                                </Button>
                            </div>

                            <div className="grid gap-4 bg-muted/30 p-4 rounded-lg border">
                                <div className="grid gap-2">
                                    <Label htmlFor={`${provider}-key`}>API Key</Label>
                                    <Input
                                        id={`${provider}-key`}
                                        type="password"
                                        className="bg-background"
                                        value={config.apiKey || ""}
                                        onChange={(e) => handleChange(provider, "apiKey", e.target.value)}
                                        placeholder={`sk-...`}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`${provider}-base`}>Base URL</Label>
                                    <Input
                                        id={`${provider}-base`}
                                        className="bg-background"
                                        value={config.baseUrl || ""}
                                        onChange={(e) => handleChange(provider, "baseUrl", e.target.value)}
                                        placeholder="Default"
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Optional. Leave empty to use the default endpoint.
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
