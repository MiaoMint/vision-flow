import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserOpenURL } from "../../wailsjs/runtime/runtime";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

interface UpdateInfo {
    hasUpdate: boolean;
    latestVersion: string;
    currentVersion: string;
    releaseURL: string;
    releaseNotes: string;
    error?: string;
}

interface UpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    info: UpdateInfo | null;
}

export function UpdateDialog({ open, onOpenChange, info }: UpdateDialogProps) {
    const { _ } = useLingui();
    if (!info) return null;

    const handleUpdate = () => {
        BrowserOpenURL(info.releaseURL);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle><Trans>New Version Available</Trans></DialogTitle>
                    <DialogDescription>
                        <Trans>A new version {info.latestVersion} is available. Current version: {info.currentVersion}</Trans>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm font-medium mb-2"><Trans>Release Notes:</Trans></p>
                    <div className="bg-muted p-3 rounded-md max-h-75 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono wrap-break-word">
                            {info.releaseNotes || _(msg`No release notes available.`)}
                        </pre>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <Trans>Later</Trans>
                    </Button>
                    <Button onClick={handleUpdate}>
                        <Trans>Download Update</Trans>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
