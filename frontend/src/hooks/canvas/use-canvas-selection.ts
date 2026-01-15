import { useCallback } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/stores/use-canvas-store";

export function useCanvasSelection() {
  const { getNodes } = useReactFlow();

  const nodes = useCanvasStore((state) => state.nodes);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const nodeIdCounter = useCanvasStore((state) => state.nodeIdCounter);
  const setNodeIdCounter = useCanvasStore((state) => state.setNodeIdCounter);
  const selectedNodes = useCanvasStore((state) => state.selectedNodes);
  const setSelectedNodes = useCanvasStore((state) => state.setSelectedNodes);
  const recordState = useCanvasStore((state) => state.recordState);

  const onSelectionChange = useCallback(
    ({ nodes: selection }: { nodes: Node[] }) => {
      // Filter out groups from selection if needed or keep logic
      // Original logic: if (selectedNodes.some((node) => node.type === "group")) return;
      if (selection.some((node) => node.type === "group")) {
        return;
      }
      setSelectedNodes(selection.map((node) => node.id));
    },
    [setSelectedNodes]
  );

  const createGroup = useCallback(() => {
    if (selectedNodes.length === 0) return;

    // We can use store nodes or getNodes() from ReactFlow.
    // getNodes() is often better for position data if it's being updated by drag
    const currentNodes = getNodes();
    const selectedNodeObjects = currentNodes.filter(
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
        zIndex: -1,
        border: "none",
        background: "transparent",
        padding: 0,
      },
      selectable: false,
      data: { label: "New Group" },
    };

    setNodes([...currentNodes, groupNode]);
    setNodeIdCounter((c) => c + 1);
    setSelectedNodes([]);
    recordState();
  }, [
    selectedNodes,
    getNodes,
    nodeIdCounter,
    setNodes,
    setNodeIdCounter,
    setSelectedNodes,
    recordState,
  ]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "group") {
        const currentNodes = getNodes();
        setNodes(
          currentNodes.map((n) => {
            if (n.id === node.id) {
              return { ...n, selected: !n.selected };
            }
            return n;
          })
        );
      }
    },
    [setNodes, getNodes]
  );

  return {
    selectedNodes,
    onSelectionChange,
    createGroup,
    onNodeClick,
  };
}
