import { useState, useCallback } from "react";
import { type Node } from "@xyflow/react";

interface UseCanvasSelectionProps {
  nodes: Node[];
  nodeIdCounter: number;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setNodeIdCounter: (counter: number | ((counter: number) => number)) => void;
}

export function useCanvasSelection({
  nodes,
  nodeIdCounter,
  setNodes,
  setNodeIdCounter,
}: UseCanvasSelectionProps) {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

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
  }, [selectedNodes, nodes, nodeIdCounter, setNodes, setNodeIdCounter]);

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

  return {
    selectedNodes,
    onSelectionChange,
    createGroup,
    onNodeClick,
  };
}
