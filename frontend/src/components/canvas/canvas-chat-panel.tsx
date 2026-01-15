import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, X } from "lucide-react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useCanvasStore } from "@/stores/use-canvas-store";

export function CanvasChatPanel() {
    const { _ } = useLingui();
    const isOpen = useCanvasStore((state) => state.isChatOpen);
    const onClose = useCanvasStore((state) => state.toggleChat);
    const message = useCanvasStore((state) => state.chatMessage);
    const onMessageChange = useCanvasStore((state) => state.setChatMessage);

    if (!isOpen) return null;

    return (
        <div className="w-96 bg-background border-l flex flex-col pt-14 shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-semibold">
                    <Trans>AI Assistant</Trans>
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="text-sm text-muted-foreground">
                    <Trans>This is the AI chat interface...</Trans>
                </div>
            </div>
            <div className="border-t p-4">
                <div className="flex gap-2">
                    <Textarea
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        placeholder={_(msg`Enter message...`)}
                        className="min-h-15"
                    />
                    <Button size="icon">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
