import { useState, useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Plus, Square, Circle, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CanvasViewProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    data: { label: "开始节点" },
    position: { x: 250, y: 100 },
  },
  {
    id: "2",
    type: "default",
    data: { label: "处理节点" },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
];

export function CanvasView({
  projectId,
  projectName,
  onBack,
}: CanvasViewProps) {
  const [name, setName] = useState(projectName);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div className="flex h-full flex-col relative">
      {/* 顶部工具栏 */}
      <div
        className="flex items-center gap-4 border-b p-2 bg-background pl-24"
        style={{ "--wails-draggable": "drag" } as React.CSSProperties}
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-md"
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

      {/* 主要内容区域 */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 左侧悬浮工具栏 */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          <Card className="p-2 shadow-lg">
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="icon" title="添加节点">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="矩形">
                <Square className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="圆形">
                <Circle className="h-4 w-4" />
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
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* 右侧 Chat 面板 */}
        {isChatOpen && (
          <div className="w-96 bg-background border-l flex flex-col">
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
