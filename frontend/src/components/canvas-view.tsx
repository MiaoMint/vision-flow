import { useState, useCallback, useMemo } from "react";
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
  useOnSelectionChange,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  FileText,
  Image,
  Video,
  Music,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";

import {
  TextNode,
  ImageNode,
  VideoNode,
  AudioNode,
  type NodeType,
} from "./nodes";

interface CanvasViewProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
}

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];
function CanvasEditor({ projectId, projectName, onBack }: CanvasViewProps) {
  const [name, setName] = useState(projectName);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      text: TextNode,
      image: ImageNode,
      video: VideoNode,
      audio: AudioNode,
    }),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // Create animated edge with data flow
      const newEdge = {
        ...connection,
        animated: true,
        style: { stroke: "#3b82f6" },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // TODO: Trigger data processing from source to target node
      // This would involve calling your AI model API
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
          label: `${
            type === "text"
              ? "文本"
              : type === "image"
              ? "图片"
              : type === "video"
              ? "视频"
              : "音频"
          }节点 ${nodeIdCounter}`,
          type: type,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((c) => c + 1);
    },
    [nodeIdCounter, setNodes]
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
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-sm border-none bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold"
            placeholder="项目名称"
          />
          <div className="ml-auto">
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
        <div className="absolute left-4 top-20 z-10 flex flex-col gap-2">
          <Card className="p-2 shadow-lg">
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

        {/* ReactFlow 画布 */}
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            panOnDrag={[1, 2]}
            selectionOnDrag
            selectionMode={SelectionMode.Partial}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Cross} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* 右侧 Chat 面板 */}
        {isChatOpen && (
          <div className="w-96 bg-background border-l flex flex-col pt-14 z-20 shadow-xl">
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
