import {
  ReactFlow,
  MiniMap,
  Controls,
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
  ControlButton,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { SaveProject } from "../../wailsjs/go/database/Service";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Image,
  Video,
  Music,
  X,
  Download,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import {
  TextNode,
  ImageNode,
  VideoNode,
  AudioNode,
  GroupNode,
  type NodeType,
} from "./nodes";
import { database } from "../../wailsjs/go/models";

interface CanvasViewProps {
  project: database.Project;
  onBack: () => void;
}

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];
function CanvasEditor({ project, onBack }: CanvasViewProps) {
  const [name, setName] = useState(project.name);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

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
    setIsInitialized(true);
  }, []);

  const isDragging = useRef(false);

  const saveProject = useCallback(async () => {
    if (!project.id) return;

    const nodesToSave = nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        processing: false,
        error: undefined,
        runTrigger: undefined,
      },
    }));

    const workflow = JSON.stringify({
      nodes: nodesToSave,
      edges,
    });

    try {
      await SaveProject(
        new database.Project({
          ...project,
          name: name,
          workflow,
        })
      );
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [nodes, edges, name, project]);

  // 拖拽开始 - 暂停自动保存
  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    isDragging.current = true;
    if (node.type === "group") {
      dragRef.current = { id: node.id, position: { ...node.position } };
    }
  }, []);

  // 拖拽结束 - 立即保存
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      isDragging.current = false;
      saveProject();
    },
    [saveProject]
  );

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

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

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.some((node) => node.type === "group")) {
        return;
      }
      setSelectedNodes(selectedNodes.map((node) => node.id));
    },
    []
  );

  const createGroup = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const selectedNodeObjects = nodes.filter(
      (n) => selectedNodes.includes(n.id) && n.type !== "group"
    );
    if (selectedNodeObjects.length === 0) return;

    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodeObjects.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      // Rough sizing if width/height missing (which happens if not measured yet)
      const width = node.measured?.width ?? 200;
      const height = node.measured?.height ?? 200;
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const padding = 50;
    const groupNode: Node = {
      id: `group-${nodeIdCounter}`,
      type: "group",
      position: {
        x: minX - padding,
        y: minY - padding,
      },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        zIndex: -1, // Ensure group is behind
        border: "none",
        background: "transparent",
        padding: 0,
      },
      selectable: false, // Prevent box selection
      data: { label: "New Group" },
    };

    setNodes((nds) => [...nds, groupNode]);
    setNodeIdCounter((c) => c + 1);
    setSelectedNodes([]); // Clear selection/hide button
  }, [selectedNodes, nodes, nodeIdCounter, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Create animated edge with data flow
      const newEdge = {
        ...connection,
        animated: false,
        style: { stroke: "#3b82f6" },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: NodeType) => {
      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type: type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: `${type === "text"
            ? "文本"
            : type === "image"
              ? "图片"
              : type === "video"
                ? "视频"
                : "音频"
            }节点 ${nodeIdCounter}`,
          type: type,
          projectId: project.id,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((c) => c + 1);
    },
    [nodeIdCounter, setNodes]
  );

  const { getIntersectingNodes } = useReactFlow();
  const dragRef = useRef<{
    id: string;
    position: { x: number; y: number };
  } | null>(null);

  // group 子节点跟随拖动
  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (
        node.type === "group" &&
        dragRef.current &&
        dragRef.current.id === node.id
      ) {
        const dx = node.position.x - dragRef.current.position.x;
        const dy = node.position.y - dragRef.current.position.y;

        // Update last position for next frame
        dragRef.current.position = { ...node.position };

        if (dx === 0 && dy === 0) return;

        // Find intersecting nodes
        // Note: We use the group node's current dimension (which React Flow tracks)
        const intersectingNodes = getIntersectingNodes(node).filter(
          (n) => n.parentId !== node.id
        );

        if (intersectingNodes.length > 0) {
          setNodes((nds) =>
            nds.map((n: Node) => {
              if (
                intersectingNodes.some((inNode: Node) => inNode.id === n.id)
              ) {
                return {
                  ...n,
                  position: {
                    x: n.position.x + dx,
                    y: n.position.y + dy,
                  },
                  // We must also update 'selected' to avoid weird selection artifacts?
                  // No, usually just position is fine.
                };
              }
              return n;
            })
          );
        }
      }
    },
    [getIntersectingNodes, setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "group") {
        // Manual selection toggle for group nodes since they are not selectable by box
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return { ...n, selected: !n.selected };
            }
            return n;
          })
        );
      }
    },
    [setNodes]
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

  const handleExport = useCallback(() => {
    const data = {
      nodes,
      edges,
    };
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard
      .writeText(jsonString)
      .then(() => toast.success("Project JSON copied to clipboard"))
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy project JSON");
      });
  }, [nodes, edges]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
            // Update ID counter based on highest ID found to avoid collisions
            let maxId = 0;
            data.nodes.forEach((n: Node) => {
              const idNum = parseInt(n.id.replace(/[^0-9]/g, ""));
              if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
            });
            setNodeIdCounter(maxId + 1);
          } else {
            alert("Invalid project file format");
          }
        } catch (err) {
          console.error("Import failed:", err);
          alert("Failed to parse project file");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be selected again
      event.target.value = "";
    },
    [setNodes, setEdges, setNodeIdCounter]
  );

  return (
    <div className="flex h-full relative">
      {/* 主要内容区域 - 全屏 */}
      <div className="flex flex-1 relative overflow-hidden w-full h-full">
        {/* 顶部工具栏 - 悬浮毛玻璃效果 */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center gap-4 p-2 pl-24 backdrop-blur-md bg-background/80 border-b border-border/50"
          style={{ "--wails-draggable": "drag" } as React.CSSProperties}
        >
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-sm border-none bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold"
            placeholder="项目名称"
          />
          <div className="ml-auto flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 左侧悬浮工具栏 */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          <Card className="p-2 shadow-lg rounded-full">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                title="文本节点"
                onClick={() => addNode("text")}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="图片节点"
                onClick={() => addNode("image")}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="视频节点"
                onClick={() => addNode("video")}
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="音频节点"
                onClick={() => addNode("audio")}
              >
                <Music className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

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
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap pannable zoomable />
            <Background
              className="dark:opacity-30"
              variant={BackgroundVariant.Dots}
              gap={12}
              size={1}
            />
          </ReactFlow>
        </div>

        {/* 右侧 Chat 面板 */}
        {isChatOpen && (
          <div className="w-96 bg-background border-l flex flex-col pt-14 shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">AI 助手</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-sm text-muted-foreground">
                这里是 AI 聊天界面...
              </div>
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="输入消息..."
                  className="min-h-15"
                />
                <Button size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
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
