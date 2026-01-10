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
    if (!info) return null;

    const handleUpdate = () => {
        BrowserOpenURL(info.releaseURL);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New Version Available</DialogTitle>
                    <DialogDescription>
                        A new version {info.latestVersion} is available.
                        Current version: {info.currentVersion}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm font-medium mb-2">Release Notes:</p>
                    <div className="bg-muted p-3 rounded-md max-h-[300px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono break-words">
                            {info.releaseNotes || "No release notes available."}
                        </pre>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Later
                    </Button>
                    <Button onClick={handleUpdate}>Download Update</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
