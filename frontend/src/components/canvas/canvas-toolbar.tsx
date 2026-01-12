import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare, Download, Upload } from "lucide-react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useSystemInfo } from "@/hooks/use-system-info";
import { cn } from "@/lib/utils";

interface CanvasToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onImport: () => void;
  onExport: () => void;
  onToggleChat: () => void;
}

export function CanvasToolbar({
  name,
  onNameChange,
  onBack,
  onImport,
  onExport,
  onToggleChat,
}: CanvasToolbarProps) {
  const { _ } = useLingui();
  const { systemInfo } = useSystemInfo();

  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-20 flex items-center gap-4 p-2 backdrop-blur-md bg-background/80 border-b border-border/50",
        systemInfo?.isMac && "pl-24"
      )}
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="max-w-sm border-none bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold"
        placeholder={_(msg`Project name`)}
      />
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          title="Import JSON"
          onClick={onImport}
        >
          <Upload className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Copy JSON"
          onClick={onExport}
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleChat}>
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
