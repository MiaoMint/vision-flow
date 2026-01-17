import { useState } from "react";
import { AlertCircle, Download, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BackupData, ResetDatabase } from "../../../wailsjs/go/app/Service";
import { Trans } from "@lingui/react/macro";

interface StartupErrorScreenProps {
  error: string;
}

export function StartupErrorScreen({ error }: StartupErrorScreenProps) {
  const [backupStatus, setBackupStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleBackup = async () => {
    try {
      await BackupData();
      setBackupStatus("success");
    } catch (err) {
      console.error(err);
      setBackupStatus("error");
    }
  };

  const handleReset = async () => {
    try {
      await ResetDatabase();
      setResetStatus("success");
    } catch (err) {
      console.error(err);
      setResetStatus("error");
    }
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-background p-4"
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <Card className="w-full max-w-md shadow-lg border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-6 w-6" />
            <CardTitle className="text-xl"><Trans>Startup Error</Trans></CardTitle>
          </div>
          <CardDescription>
            <Trans>VisionFlow encountered a problem during initialization. This usually
            indicates a corrupted database or configuration file.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle><Trans>Error Details</Trans></AlertTitle>
            <AlertDescription className="font-mono text-xs mt-1 break-all">
              {error}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="text-sm font-medium"><Trans>Recovery Options</Trans></h3>

            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={handleBackup}
                className="justify-start"
              >
                <Download className="mr-2 h-4 w-4" />
                {backupStatus === "success" ? <Trans>Backup Saved</Trans> : <Trans>Backup Data...</Trans>}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="justify-start"
                    disabled={resetStatus === "success"}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {resetStatus === "success"
                      ? <Trans>Reset Complete</Trans>
                      : <Trans>Reset Database</Trans>}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle><Trans>Are you absolutely sure?</Trans></AlertDialogTitle>
                    <AlertDialogDescription>
                      <Trans>This action will reset the database. This cannot be undone
                      unless you have a backup.</Trans>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel><Trans>Cancel</Trans></AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      <Trans>Continue</Trans>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted-foreground">
          <Trans>After resetting, please restart VisionFlow.</Trans>
        </CardFooter>
      </Card>
    </div>
  );
}
