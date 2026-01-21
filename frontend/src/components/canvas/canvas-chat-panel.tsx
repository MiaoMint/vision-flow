import { useRef, useEffect, useState } from "react"; // Added useState
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Bot, ChevronDown, Wrench, Play } from "lucide-react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useCanvasStore } from "@/stores/use-canvas-store";
import { useAICanvasEdit } from "@/hooks/use-ai-canvas-edit";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/ai/model-selector";

function ThinkingIndicator() {
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const timer = setInterval(() => {
            setDots((d) => (d.length < 3 ? d + "." : "."));
        }, 500);
        return () => clearInterval(timer);
    }, []);

    return <span className="text-muted-foreground ml-1">Thinking{dots}</span>;
}

// Redefine CollapsibleToolLogs that takes a list of tools
function CollapsibleToolLogs({ tools }: { tools: string[] }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!tools || tools.length === 0) return null;

    return (
        <div className="border border-border/50 rounded-md bg-muted/30 text-xs overflow-hidden my-2">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 cursor-pointer flex items-center gap-2 hover:bg-muted/50 transition-colors select-none"
            >
                <Wrench className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                    <Trans>Tools Used</Trans> {tools.length > 1 && `(${tools.length})`}
                </span>
                <ChevronDown className={cn("h-3 w-3 ml-auto text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </div>
            {isOpen && (
                <div className="p-2 pt-0 border-t border-transparent text-muted-foreground space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {tools.map((tool, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {tool}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function CanvasChatPanel() {
    const { _ } = useLingui();
    const isOpen = useCanvasStore((state) => state.isChatOpen);
    const onClose = useCanvasStore((state) => state.toggleChat);

    // Use our new hook
    const { messages, isStreaming, sendMessage } = useAICanvasEdit();
    const [input, setInput] = useState("");
    const [providerId, setProviderId] = useState(1);
    const [modelId, setModelId] = useState("gpt-4o");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isStreaming]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input, modelId, providerId);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-96 bg-background border-l flex flex-col pt-14">
            <div className="flex items-center justify-between border-b px-4 py-1">
                <h3 className="font-semibold flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Trans>AI Assistant</Trans>
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center mt-10">
                        <Trans>Ask me to edit the canvas...</Trans>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={cn(
                            "px-4 py-3 text-sm border-border/40 last:border-0 ",
                            m.role === "user" ? "bg-muted/40" : "bg-transparent",
                            !isStreaming && "border-b",
                        )}
                    >
                        <div className="space-y-1">
                            {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
                                <CollapsibleToolLogs tools={m.toolCalls} />
                            )}
                            <div className="leading-relaxed text-foreground whitespace-pre-wrap break-words selectable">
                                {m.content}
                            </div>
                        </div>
                    </div>
                ))}

                {isStreaming && (
                    <div className="px-4 py-3 text-sm flex items-center gap-2">
                        <ThinkingIndicator />
                    </div>
                )}
            </div>

            <div className="p-4 bg-muted/10">
                <div className="rounded-xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all overflow-hidden flex flex-col">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={_(msg`Enter message...`)}
                        className="min-h-15 max-h-50 w-full resize-none border-0 shadow-none focus-visible:ring-0 px-3 py-3 text-sm rounded-none"
                    />

                    <div className="flex items-center justify-between p-2 bg-muted/20 border-t border-border/50">
                        <ModelSelector
                            providerId={providerId}
                            modelId={modelId}
                            onProviderChange={setProviderId}
                            onModelChange={setModelId}
                        />
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={isStreaming || !input.trim()}
                        >
                            <Play className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
