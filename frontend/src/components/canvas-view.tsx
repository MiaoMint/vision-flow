import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  SelectionMode,
  ReactFlowProvider,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { useState, useCallback, useMemo, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import {
  TextNode,
  ImageNode,
  VideoNode,
  AudioNode,
  GroupNode,
  type NodeType,
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
  useCanvasImportExport,
  useCanvasSave,
} from "@/hooks/canvas";

interface CanvasViewProps {
  project: database.Project;
  onBack: () => void;
}

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

function CanvasEditor({ project, onBack }: CanvasViewProps) {
  const { _ } = useLingui();
  const isDarkMode = useIsDarkTheme();
  const [name, setName] = useState(project.name);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);

  // Custom hooks
  const { mousePositionRef, onMouseMove } = useCanvasMouse();
  const { saveProject } = useCanvasSave({ project, nodes, edges, name });
  const { onNodeDragStart, onNodeDragStop, onNodeDrag } = useCanvasDrag({
    setNodes,
    saveProject,
  });
  const { selectedNodes, onSelectionChange, createGroup, onNodeClick } =
    useCanvasSelection({
      nodes,
      nodeIdCounter,
      setNodes,
      setNodeIdCounter,
    });
  const { fileInputRef, handleExport, handleImportClick, handleFileChange } =
    useCanvasImportExport({
      nodes,
      edges,
      setNodes,
      setEdges,
      setNodeIdCounter,
    });

  useCanvasCopyPaste({
    nodes,
    edges,
    nodeIdCounter,
    setNodes,
    setEdges,
    setNodeIdCounter,
    mousePositionRef,
  });

  // Initialize from project
  useEffect(() => {
    if (project.workflow) {
      try {
        const flow = JSON.parse(project.workflow);
        if (flow.nodes)
          setNodes(
            flow.nodes.map((n: any) => ({
              ...n,
              data: {
                ...n.data,
                processing: false,
                error: undefined,
                runTrigger: undefined,
                projectId: project.id,
              },
            }))
          );
        if (flow.edges) setEdges(flow.edges);

        // Update ID counter based on highest ID found
        let maxId = 0;
        if (Array.isArray(flow.nodes)) {
          flow.nodes.forEach((n: Node) => {
            const idNum = parseInt(n.id.replace(/[^0-9]/g, ""));
            if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
          });
        }
        setNodeIdCounter(maxId + 1);
      } catch (err) {
        console.error("Failed to parse project workflow:", err);
      }
    }
  }, []);

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

  const onConnect = useCallback(
    (connection: Connection) => {
      // Create animated edge with data flow
      const newEdge = {
        ...connection,
        animated: false,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: NodeType) => {
      const typeLabels: Record<NodeType, string> = {
        text: _(msg`Text`),
        image: _(msg`Image`),
        video: _(msg`Video`),
        audio: _(msg`Audio`),
        group: _(msg`Group`),
      };
      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type: type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: `${typeLabels[type]} ${_(msg`Node`)} ${nodeIdCounter}`,
          type: type,
          projectId: project.id,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((c) => c + 1);
    },
    [nodeIdCounter, setNodes, _]
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
              // Exclude video elements to prevent SecurityError: The operation is insecure.
              if (node.tagName === "VIDEO") return false;
              return true;
            },
            style: {
              width: imageWidth.toString(),
              height: imageHeight.toString(),
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            },
          });

          // 2. Update project
          project.coverImage = dataUrl;
        }
      }
    } catch (err) {
      console.error("Failed to capture cover image:", err);
    }

    // 3. Save Project (explicit save to ensure cover image is persisted)
    saveProject();

    // 4. Navigate back
    onBack();
  };

  return (
    <div className="flex h-full relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />

      {/* 主要内容区域 - 全屏 */}
      <div className="flex flex-1 relative overflow-hidden w-full h-full">
        {/* 顶部工具栏 */}
        <CanvasToolbar
          name={name}
          onNameChange={setName}
          onBack={handleBack}
          onImport={handleImportClick}
          onExport={handleExport}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
        />

        {/* 左侧悬浮工具栏 */}
        <CanvasLeftPanel onAddNode={addNode} />

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

        {/* ReactFlow 画布 */}
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

        {/* 右侧 Chat 面板 */}
        <CanvasChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          message={chatMessage}
          onMessageChange={setChatMessage}
        />
      </div>
    </div>
  );
}

export function CanvasView(props: CanvasViewProps) {
  return (
    <ReactFlowProvider>
      <CanvasEditor {...props} />
    </ReactFlowProvider>
  );
}
