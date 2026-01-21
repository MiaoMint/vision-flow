import { useCallback, useRef } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/stores/use-canvas-store";
import { useCanvasSave } from "./use-canvas-save";

export function useCanvasDrag() {
    const { getIntersectingNodes, setNodes } = useReactFlow();
    const recordState = useCanvasStore((state) => state.recordState);
    const { saveProject } = useCanvasSave();

    const isDragging = useRef(false);
    const dragRef = useRef<{
        id: string;
        position: { x: number; y: number };
    } | null>(null);

    // 拖拽开始 - 暂停自动保存
    const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
        isDragging.current = true;
        if (node.type === "group") {
            dragRef.current = { id: node.id, position: { ...node.position } };
        }
    }, []);

    // 拖拽结束 - 立即保存并记录状态
    const onNodeDragStop = useCallback(
        (_: React.MouseEvent, node: Node) => {
            isDragging.current = false;
            recordState();
            saveProject();
        },
        [saveProject, recordState]
    );

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
                const intersectingNodes = getIntersectingNodes(node).filter(
                    (n) => n.type !== "group" && n.parentId !== node.id
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

    return {
        isDragging,
        onNodeDragStart,
        onNodeDragStop,
        onNodeDrag,
    };
}
