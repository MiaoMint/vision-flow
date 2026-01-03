import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Pencil, List, Loader2 } from "lucide-react";
import { ListModelProviders, SaveModelProvider, DeleteModelProvider } from "../../../wailsjs/go/database/Service";
import { ListModels } from "../../../wailsjs/go/ai/Service";
import { database, ai } from "../../../wailsjs/go/models";

const PROVIDER_TYPES = [
    { value: "gemini", label: "Google Gemini" },
    { value: "openai", label: "OpenAI" },
    { value: "claude", label: "Anthropic Claude" },
];

export function ModelProvidersSettings() {
    // Local interface for state management if bindings aren't perfect yet
    const [providers, setProviders] = useState<database.ModelProvider[]>([]);
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<database.ModelProvider | null>(null);
    const [formData, setFormData] = useState<database.ModelProvider>(new database.ModelProvider());

    // Model List Dialog state
    const [modelListDialogOpen, setModelListDialogOpen] = useState(false);
    const [currentModels, setCurrentModels] = useState<ai.Model[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const list = await ListModelProviders();
            setProviders(list || []);
        } catch (err) {
            console.error("Failed to load providers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (provider?: database.ModelProvider) => {
        if (provider) {
            setEditingProvider(provider);
            setFormData(new database.ModelProvider(provider));
        } else {
            setEditingProvider(null);
            setFormData(new database.ModelProvider({ type: "openai" })); // Default
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingProvider(null);
    };

    const handleSave = async () => {
        try {
            if (!formData.name) {
                // simple validation
                return;
            }
            await SaveModelProvider(formData);
            await loadProviders();
            handleCloseDialog();
        } catch (err) {
            console.error("Failed to save provider", err);
        }
    };

    const handleDelete = (id: number) => {
        setProviderToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (providerToDelete === null) return;
        try {
            await DeleteModelProvider(providerToDelete);
            await loadProviders();
        } catch (err) {
            console.error("Failed to delete provider", err);
        } finally {
            setDeleteDialogOpen(false);
            setProviderToDelete(null);
        }
    };

    const handleListModels = async (providerId: number) => {
        setModelListDialogOpen(true);
        setLoadingModels(true);
        setCurrentModels([]);
        try {
            // ListModels expects a pointer to string in Go, which maps to string|null in JS.
            // Passing the provider type string.
            const models = await ListModels(providerId);
            setCurrentModels(models || []);
        } catch (err) {
            console.error("Failed to list models", err);
        } finally {
            setLoadingModels(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">模型提供商</h3>
                    <p className="text-sm text-muted-foreground">配置 AI 模型提供商。</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加服务
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    providers.map((provider) => (
                        <Card key={provider.id} className="relative group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex justify-between items-center">
                                    {provider.name}
                                    <span className="text-xs font-normal text-muted-foreground px-2 py-1 bg-muted rounded-full">
                                        {provider.type}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground truncate">
                                    BaseURL: {provider.baseUrl || "Default"}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                    API Key: ••••••••
                                </div>

                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 rounded-md">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleListModels(provider.id)}>
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(provider)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(provider.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProvider ? "编辑服务" : "添加服务"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">提供商类型</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData(new database.ModelProvider({ ...formData, type: val as any }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDER_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">名称</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData(new database.ModelProvider({ ...formData, name: e.target.value }))}
                                placeholder="例如: My OpenAI"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={formData.apiKey || ""}
                                onChange={(e) => setFormData(new database.ModelProvider({ ...formData, apiKey: e.target.value }))}
                                placeholder="sk-..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="baseUrl">Base URL (可选)</Label>
                            <Input
                                id="baseUrl"
                                value={formData.baseUrl || ""}
                                onChange={(e) => setFormData(new database.ModelProvider({ ...formData, baseUrl: e.target.value }))}
                                placeholder="https://api.example.com/v1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>取消</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={modelListDialogOpen} onOpenChange={setModelListDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>可用模型列表</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto py-4">
                        {loadingModels ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : currentModels.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                未找到模型或加载失败
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {currentModels.map((model) => (
                                    <div key={model.id} className="p-3 border rounded-md flex justify-between items-center bg-card hover:bg-accent/50 transition-colors">
                                        <div className="font-mono text-sm">{model.id}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {model.owner}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销。这将永久删除该模型提供商配置。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
