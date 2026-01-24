import { useRef, useEffect, useState } from "react"; // Added useState
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Bot, Play, ChevronDown, ChevronRight, Wrench, Brain } from "lucide-react";
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

interface ToolCallPart {
    type: "tool_call";
    name: string;
    args: string;
    content: string; // The inner text content
}

interface TextPart {
    type: "text";
    content: string;
}

interface ThinkingPart {
    type: "thinking";
    content: string;
}

type MessagePart = ToolCallPart | TextPart | ThinkingPart;

function parseMessage(text: string): MessagePart[] {
    const parts: MessagePart[] = [];
    const regex = /(?:<tool_call name="([^"]+)" args="([^"]+)">([\s\S]*?)<\/tool_call>)|(?:<thinking>([\s\S]*?)<\/thinking>)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add preceding text
        if (match.index > lastIndex) {
            parts.push({
                type: "text",
                content: text.slice(lastIndex, match.index),
            });
        }

        if (match[1]) {
            // Tool Call match
            parts.push({
                type: "tool_call",
                name: match[1],
                args: match[2],
                content: match[3].trim(),
            });
        } else if (match[4]) {
            // Thinking match
            parts.push({
                type: "thinking",
                content: match[4].trim(),
            });
        }

        lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({
            type: "text",
            content: text.slice(lastIndex),
        });
    }

    return parts;
}

function ThinkingBlock({ part }: { part: ThinkingPart }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="my-2 border rounded-md overflow-hidden bg-yellow-500/10 border-yellow-500/20">
            <div
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/5 cursor-pointer text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Brain className="h-3 w-3" />
                <span>Thinking Process</span>
            </div>

            {isExpanded && (
                <div className="p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed italic">
                    {part.content}
                </div>
            )}
        </div>
    );
}

function ToolCallBlock({ part }: { part: ToolCallPart }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Parse args for better display
    let argsObj: any = {};
    try {
        // Unescape HTML first
        const unescapedArgs = part.args
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'");

        argsObj = JSON.parse(unescapedArgs);
    } catch (e) {
        argsObj = { raw: part.args };
    }

    return (
        <div className="border rounded-md overflow-hidden bg-muted/20">
            <div
                className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer text-xs font-medium hover:bg-muted/40 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Wrench className="h-3 w-3 text-primary" />
                <span>Called: {part.name}</span>
            </div>

            {isExpanded && (
                <div className="p-3 bg-muted/10 text-xs font-mono overflow-x-auto">
                    <div className="mb-2 text-muted-foreground whitespace-pre-wrap">{part.content}</div>
                    <div className="text-muted-foreground font-semibold mb-1">Arguments:</div>
                    <pre className="whitespace-pre-wrap text-muted-foreground/80">
                        {JSON.stringify(argsObj, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

function ParsedMessageContent({ content }: { content: string }) {
    const parts = parseMessage(content);

    return (
        <>
            {parts.map((part, idx) => {
                if (part.type === "tool_call") {
                    return <ToolCallBlock key={idx} part={part} />;
                } else if (part.type === "thinking") {
                    return <ThinkingBlock key={idx} part={part} />;
                }
                return (
                    <div key={idx} className="text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word selectable">
                        {part.content}
                    </div>
                );
            })}
        </>
    );
}


export function CanvasChatPanel() {
    const { _ } = useLingui();
    const isOpen = useCanvasStore((state) => state.isChatOpen);
    const onClose = useCanvasStore((state) => state.toggleChat);

    // Use our new hook
    const { messages, isStreaming, sendMessage } = useAICanvasEdit();
    const [input, setInput] = useState("");
    const [providerId, setProviderId] = useState<number | undefined>();
    const [modelId, setModelId] = useState<string | undefined>();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isStreaming]);

    const handleSend = () => {
        if (!input.trim()) return;
        if (!modelId || !providerId) return;
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
                            {/* Parse and render tool calls */}
                            {m.role === "assistant" ? (
                                <ParsedMessageContent content={m.content} />
                            ) : (
                                <div className="leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word selectable">
                                    {m.content}
                                </div>
                            )}
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
                        // onKeyDown={handleKeyDown}
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
                            disabled={isStreaming || !input.trim() || !modelId || !providerId}
                        >
                            <Play className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
