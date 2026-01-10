import { useEffect, useState } from "react";
import { GetWailsJSON, CheckUpdate } from "../../../wailsjs/go/app/Service";
import { Button } from "@/components/ui/button";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateDialog } from "@/components/update-dialog";

export function AboutSettings() {
  const [wailsJson, setWailsJson] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    async function fetchWailsJSON() {
      const data = await GetWailsJSON();
      setWailsJson(JSON.parse(data));
    }
    fetchWailsJSON();
  }, []);

  const handleCheckUpdate = async () => {
    setChecking(true);
    try {
      const info = await CheckUpdate();
      if (info.error) {
        toast.error("Check update failed: " + info.error);
      } else if (info.hasUpdate) {
        setUpdateInfo(info);
        setShowUpdateDialog(true);
      } else {
        toast.success("You are on the latest version.");
      }
    } catch (e: any) {
      toast.error("Failed to check update: " + e.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl h-full flex flex-col">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
            <img src="/appicon.png" alt="logo" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold">VisionFlow</h3>
            <p className="text-sm text-muted-foreground">
              Version {wailsJson?.info?.productVersion}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-center">
            VisionFlow 是一个可视化工作流编排工具，通过直观的节点式界面，
            让你轻松设计和管理 AI 驱动的智能工作流。
          </p>
          <Button
            variant="outline"
            onClick={handleCheckUpdate}
            disabled={checking}
          >
            {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            检查更新
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-8">
        © 2026 VisionFlow. All rights reserved.
      </div>

      <UpdateDialog
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        info={updateInfo}
      />
    </div>
  );
}

