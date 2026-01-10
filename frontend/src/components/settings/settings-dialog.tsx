import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelProvidersSettings } from "./model-providers-settings";
import { ModelsListSettings } from "./models-list-settings";
import { GeneralSettings } from "./general-settings";
import { AboutSettings } from "./about-settings";
import { DebugSettings } from "./debug-settings";
import { Settings, Sparkles, Info, Bug, List } from "lucide-react";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const isDev = import.meta.env.DEV;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-200 h-150 overflow-hidden p-0 gap-0">
                <DialogTitle className="hidden">Settings</DialogTitle>
                <Tabs defaultValue="general" orientation="vertical" className="flex h-full w-full">
                    {/* Sidebar */}
                    <div className="w-60 bg-muted/30 border-r h-full flex flex-col shrink-0">
                        <div className="p-6 pb-4">
                            <h2 className="text-lg font-semibold tracking-tight">设置</h2>
                            <p className="text-sm text-muted-foreground">VisionFlow Preferences</p>
                        </div>

                        <TabsList className="flex flex-col w-full h-auto justify-start bg-transparent p-2 space-y-1">
                            <TabsTrigger
                                value="general"
                                className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all cursor-pointer"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                通用
                            </TabsTrigger>
                            <TabsTrigger
                                value="models"
                                className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                模型提供商
                            </TabsTrigger>
                            <TabsTrigger
                                value="models-list"
                                className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all cursor-pointer"
                            >
                                <List className="w-4 h-4 mr-2" />
                                可用模型
                            </TabsTrigger>
                            <TabsTrigger
                                value="about"
                                className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all cursor-pointer"
                            >
                                <Info className="w-4 h-4 mr-2" />
                                关于
                            </TabsTrigger>
                            {isDev && (
                                <TabsTrigger
                                    value="debug"
                                    className="w-full justify-start px-3 py-2 h-9  data-[state=active]:bg-background data-[state=active]:shadow-sm  transition-all cursor-pointer"
                                >
                                    <Bug className="w-4 h-4 mr-2" />
                                    调试
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 h-150 bg-background flex flex-col ">

                        {/* General Settings */}
                        <TabsContent value="general" className="h-full overflow-y-auto m-0">
                            <GeneralSettings />
                        </TabsContent>

                        {/* Model Settings */}
                        <TabsContent value="models" className="h-full overflow-y-auto m-0">
                            <ModelProvidersSettings />
                        </TabsContent>

                        {/* Models List */}
                        <TabsContent value="models-list" className="h-full overflow-y-auto m-0">
                            <ModelsListSettings />
                        </TabsContent>

                        {/* About Settings */}
                        <TabsContent value="about" className="h-full overflow-y-auto m-0">
                            <AboutSettings />
                        </TabsContent>

                        {/* Debug Settings */}
                        {isDev && (
                            <TabsContent value="debug" className="h-full overflow-y-auto m-0">
                                <DebugSettings />
                            </TabsContent>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
