import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIModelSettings } from "./ai-model-settings";
import { Settings, Sparkles } from "lucide-react";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[800px] h-[600px] overflow-hidden p-0 gap-0">
                <DialogTitle className="hidden">Settings</DialogTitle>
                <Tabs defaultValue="models" orientation="vertical" className="flex h-full w-full">
                    {/* Sidebar */}
                    <div className="w-[240px] bg-muted/30 border-r h-full flex flex-col shrink-0">
                        <div className="p-6 pb-4">
                            <h2 className="text-lg font-semibold tracking-tight">设置</h2>
                            <p className="text-sm text-muted-foreground">Firebringer Preferences</p>
                        </div>

                        <TabsList className="flex flex-col w-full h-auto justify-start bg-transparent p-2 space-y-1">
                            <TabsTrigger
                                value="general"
                                className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                通用
                            </TabsTrigger>
                            <TabsTrigger
                                value="models"
                                className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                模型服务
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 h-[600px] bg-background flex flex-col ">

                        {/* General Settings */}
                        <TabsContent value="general" className="h-full overflow-y-auto m-0">
                            <div className="p-8 max-w-2xl space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium">通用设置</h3>
                                    <p className="text-sm text-muted-foreground">暂无通用设置项。</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Model Settings */}
                        <TabsContent value="models" className="h-full overflow-y-auto m-0">
                            <div className="p-8 max-w-3xl">
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium">模型服务</h3>
                                    <p className="text-sm text-muted-foreground">配置各大 AI 模型的访问凭证。</p>
                                </div>
                                <AIModelSettings />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
