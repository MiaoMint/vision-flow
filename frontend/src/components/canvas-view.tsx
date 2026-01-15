import {
    ReactFlow,
    MiniMap,
    Background,
    BackgroundVariant,
    SelectionMode,
    ReactFlowProvider,
    useReactFlow,
    getNodesBounds,
    getViewportForBounds,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { useCallback, useMemo, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { useLingui } from "@lingui/react";

import {
    TextNode,
    ImageNode,
    VideoNode,
    AudioNode,
    GroupNode,
} from "./nodes";
import { database } from "../../wailsjs/go/models";
import { useIsDarkTheme } from "@/hooks/use-is-dark-theme";
import { CanvasToolbar } from "./canvas/canvas-toolbar";
import { CanvasLeftPanel } from "./canvas/canvas-left-panel";
import { CanvasChatPanel } from "./canvas/canvas-chat-panel";
import {
    useCanvasMouse,
    useCanvasCopyPaste,
    useCanvasDrag,
    useCanvasSelection,
    useCanvasUndoRedo,
    useCanvasSave,
} from "@/hooks/canvas";
import { useCanvasStore } from "@/stores/use-canvas-store";

interface CanvasViewProps {
    project: database.Project;
    onBack: () => void;
}

// Internal component
function CanvasContent({ onBack }: { onBack: () => void }) {
    const isDarkMode = useIsDarkTheme();

    // Store
    const nodes = useCanvasStore((state) => state.nodes);
    const edges = useCanvasStore((state) => state.edges);
    const onNodesChange = useCanvasStore((state) => state.onNodesChange);
    const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
    const onConnect = useCanvasStore((state) => state.onConnect);

    // Hooks
    const { mousePositionRef, onMouseMove } = useCanvasMouse();
    useCanvasUndoRedo(); // Register shortcuts
    const { saveProject } = useCanvasSave();
    const { onNodeDragStart, onNodeDragStop, onNodeDrag } = useCanvasDrag();
    const { selectedNodes, onSelectionChange, createGroup, onNodeClick } = useCanvasSelection();

    useCanvasCopyPaste({
        mousePositionRef, // CopyPaste needs mouse position for pasting
    });

    // Define custom node types
    const nodeTypes = useMemo(
        () => ({
            text: TextNode,
            image: ImageNode,
            video: VideoNode,
            audio: AudioNode,
            group: GroupNode,
        }),
        []
    );

    const { getNodes } = useReactFlow();

    const handleBack = async () => {
        // 1. Capture screenshot
        try {
            const nodesBounds = getNodesBounds(getNodes());
            // Only capture if we have nodes
            if (nodesBounds.width > 0 && nodesBounds.height > 0) {
                const imageWidth = 800; // Efficient size for cover
                const imageHeight = 450;
                const viewport = getViewportForBounds(
                    nodesBounds,
                    imageWidth,
                    imageHeight,
                    0.5,
                    2,
                    0
                );

                const viewportElement = document.querySelector(
                    ".react-flow__viewport"
                ) as HTMLElement;
                if (viewportElement) {
                    const dataUrl = await toPng(viewportElement, {
                        backgroundColor: "transparent",
                        width: imageWidth,
                        height: imageHeight,
                        filter: (node) => {
                            // Exclude video elements to prevent SecurityError
                            if (node.tagName === "VIDEO") return false;
                            return true;
                        },
                        style: {
                            width: imageWidth.toString(),
                            height: imageHeight.toString(),
                            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                        },
                    });

                    // 2. Update project cover in store/backend
                    const project = useCanvasStore.getState().project;
                    if (project) {
                        project.coverImage = dataUrl;
                    }
                }
            }
        } catch (err) {
            console.error("Failed to capture cover image:", err);
        }

        // 3. Save Project
        await saveProject();

        // 4. Navigate back
        onBack();
    };

    return (
        <div className="flex h-full relative">
            <div className="flex flex-1 relative overflow-hidden w-full h-full">
                {/* Toolbar */}
                <CanvasToolbar onBack={handleBack} />

                {/* Left Panel */}
                <CanvasLeftPanel />

                {/* Create Group Button - Show when nodes are selected */}
                {selectedNodes.length > 1 && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
                        <Button
                            onClick={createGroup}
                            className="shadow-lg animate-in fade-in zoom-in duration-200"
                        >
                            Create Group ({selectedNodes.length})
                        </Button>
                    </div>
                )}

                {/* ReactFlow */}
                <div className="flex-1 h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        onSelectionChange={onSelectionChange}
                        fitView
                        panOnDrag={[1, 2]}
                        selectionOnDrag
                        selectionMode={SelectionMode.Full}
                        panOnScroll
                        onNodeDragStart={onNodeDragStart}
                        onNodeDragStop={onNodeDragStop}
                        onNodeDrag={onNodeDrag}
                        onNodeClick={onNodeClick}
                        onMouseMove={onMouseMove}
                        minZoom={0.1}
                        maxZoom={2}
                        proOptions={{ hideAttribution: true }}
                    >
                        <MiniMap
                            pannable
                            zoomable
                            bgColor={isDarkMode ? "#18181b" : "#ffffff"}
                            maskColor={
                                isDarkMode ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.1)"
                            }
                            nodeColor={isDarkMode ? "#52525b" : "#e4e4e7"}
                        />
                        <Background
                            className="dark:opacity-30"
                            variant={BackgroundVariant.Dots}
                            gap={12}
                            size={1}
                        />
                    </ReactFlow>
                </div>

                {/* Chat Panel */}
                <CanvasChatPanel />
            </div>
        </div>
    );
}

// Wrapper component to handle initialization
function CanvasEditor({ project, onBack }: CanvasViewProps) {
    const initProject = useCanvasStore((state) => state.initProject);

    useEffect(() => {
        initProject(project);
    }, [project, initProject]);

    return (
        <CanvasContent onBack={onBack} />
    );
}

export function CanvasView(props: CanvasViewProps) {
    return (
        <ReactFlowProvider>
            <CanvasEditor {...props} />
        </ReactFlowProvider>
    );
}
