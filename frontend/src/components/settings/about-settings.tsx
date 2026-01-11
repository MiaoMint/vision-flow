import { useEffect, useState } from "react";
import { GetWailsJSON, CheckUpdate } from "../../../wailsjs/go/app/Service";
import { Button } from "@/components/ui/button";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateDialog } from "@/components/update-dialog";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

export function AboutSettings() {
  const { _ } = useLingui();
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
        toast.error(_(msg`Failed to check for updates`) + ": " + info.error);
      } else if (info.hasUpdate) {
        setUpdateInfo(info);
        setShowUpdateDialog(true);
      } else {
        toast.success(_(msg`You are on the latest version.`));
      }
    } catch (e: any) {
      toast.error(_(msg`Failed to check for updates`) + ": " + e.message);
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
            <Trans>VisionFlow is a visual workflow orchestration tool that enables you to easily design and manage AI-driven intelligent workflows through an intuitive node-based interface.</Trans>
          </p>
          <Button
            variant="outline"
            onClick={handleCheckUpdate}
            disabled={checking}
          >
            {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trans>Check for Updates</Trans>
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

