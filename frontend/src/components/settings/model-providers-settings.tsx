import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Pencil, List, Loader2 } from "lucide-react";
import {
  ListModelProviders,
  SaveModelProvider,
  DeleteModelProvider,
} from "../../../wailsjs/go/database/Service";
import { ListModels } from "../../../wailsjs/go/ai/Service";
import { database, ai } from "../../../wailsjs/go/models";
import { Trans } from "@lingui/react/macro";

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
  const [editingProvider, setEditingProvider] =
    useState<database.ModelProvider | null>(null);
  const [formData, setFormData] = useState<database.ModelProvider>(
    new database.ModelProvider()
  );

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
          <h3 className="text-lg font-medium">
            <Trans>Model Providers</Trans>
          </h3>
          <p className="text-sm text-muted-foreground">
            <Trans>Configure AI model providers.</Trans>
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          <Trans>Add Provider</Trans>
        </Button>
      </div>

      <div className="space-y-4 mb-10">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          providers.map((provider) => (
            <Card
              key={provider.id}
              className="relative group hover:shadow-sm transition-all hover:border-primary/20 py-0"
            >
              <div className="p-4 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold">{provider.name}</h4>
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                    {provider.type}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="truncate">
                    <span className="font-medium">BaseURL:</span>{" "}
                    {provider.baseUrl || "Default"}
                  </div>
                  <div className="truncate">
                    <span className="font-medium">API Key:</span> ••••••••
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleListModels(provider.id)}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleOpenDialog(provider)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? (
                <Trans>Edit Service</Trans>
              ) : (
                <Trans>Add Service</Trans>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">
                <Trans>Provider Type</Trans>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData(
                    new database.ModelProvider({
                      ...formData,
                      type: val as any,
                    })
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">
                <Trans>Name</Trans>
              </Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData(
                    new database.ModelProvider({
                      ...formData,
                      name: e.target.value,
                    })
                  )
                }
                placeholder="e.g. My OpenAI"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey || ""}
                onChange={(e) =>
                  setFormData(
                    new database.ModelProvider({
                      ...formData,
                      apiKey: e.target.value,
                    })
                  )
                }
                placeholder="sk-..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">
                Base URL (<Trans>Optional</Trans>)
              </Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl || ""}
                onChange={(e) =>
                  setFormData(
                    new database.ModelProvider({
                      ...formData,
                      baseUrl: e.target.value,
                    })
                  )
                }
                placeholder="https://api.example.com/v1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={handleSave}>
              <Trans>Save</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modelListDialogOpen} onOpenChange={setModelListDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <Trans>Available Model List</Trans>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4">
            {loadingModels ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentModels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Trans>No models found or failed to load</Trans>
              </div>
            ) : (
              <div className="grid gap-2">
                {currentModels.map((model) => (
                  <div
                    key={model.id}
                    className="p-3 border rounded-md flex justify-between items-center bg-card hover:bg-accent/50 transition-colors"
                  >
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
            <AlertDialogTitle>
              <Trans>Confirm Delete?</Trans>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans>
                This action cannot be undone. This will permanently delete the
                model provider configuration.
              </Trans>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans>Cancel</Trans>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trans>Delete</Trans>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
