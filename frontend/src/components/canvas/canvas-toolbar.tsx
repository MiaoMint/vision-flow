import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare, Download, Upload, Undo2, Redo2 } from "lucide-react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useSystemInfo } from "@/hooks/use-system-info";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/use-canvas-store";
import { useCanvasImportExport } from "@/hooks/canvas/use-canvas-import-export";

interface CanvasToolbarProps {
  onBack: () => void;
}

export function CanvasToolbar({ onBack }: CanvasToolbarProps) {
  const { _ } = useLingui();
  const { systemInfo } = useSystemInfo();

  const name = useCanvasStore((state) => state.project?.name || "");
  const updateProjectName = useCanvasStore((state) => state.updateProjectName);
  const toggleChat = useCanvasStore((state) => state.toggleChat);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const historyIndex = useCanvasStore((state) => state.historyIndex);
  const historyLength = useCanvasStore((state) => state.history.length);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  const { handleImportClick, handleExport, fileInputRef, handleFileChange } = useCanvasImportExport();

  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-20 flex items-center gap-4 p-2 backdrop-blur-md bg-background/80 border-b border-border/50",
        systemInfo?.isMac && "pl-24"
      )}
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />

      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Input
        value={name}
        onChange={(e) => updateProjectName(e.target.value)}
        className="max-w-sm border-none bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold"
        placeholder={_(msg`Project name`)}
      />
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          title={_(msg`Undo (⌘Z)`)}
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={_(msg`Redo (⌘⇧Z)`)}
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 className="h-5 w-5" />
        </Button>
        <div className="w-px h-6 bg-border/50" />
        <Button
          variant="ghost"
          size="icon"
          title="Import JSON"
          onClick={handleImportClick}
        >
          <Upload className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Copy JSON"
          onClick={handleExport}
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleChat}>
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
