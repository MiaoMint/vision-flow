import { useTheme } from "@/components/theme-provider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function GeneralSettings() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="p-8 max-w-2xl space-y-6">
            <div>
                <h3 className="text-lg font-medium">通用设置</h3>
                <p className="text-sm text-muted-foreground">配置应用程序的通用选项。</p>
            </div>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="theme">主题</Label>
                    <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger id="theme" className="w-50">
                            <SelectValue placeholder="选择主题" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">浅色</SelectItem>
                            <SelectItem value="dark">深色</SelectItem>
                            <SelectItem value="system">跟随系统</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        选择应用程序的主题外观
                    </p>
                </div>
            </div>
        </div>
    );
}
