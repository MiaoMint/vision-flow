import { useCallback } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/stores/use-canvas-store";

export function useCanvasSelection() {
  const { getNodes } = useReactFlow();
  const setNodes = useCanvasStore((state) => state.setNodes);
  const selectedNodes = useCanvasStore((state) => state.selectedNodes);
  const setSelectedNodes = useCanvasStore((state) => state.setSelectedNodes);

  const onSelectionChange = useCallback(
    ({ nodes: selection }: { nodes: Node[] }) => {
      if (selection.some((node) => node.type === "group")) {
        return;
      }
      setSelectedNodes(selection.map((node) => node.id));
    },
    [setSelectedNodes]
  );

  const createGroupAction = useCanvasStore((state) => state.createGroup);

  const createGroup = useCallback(() => {
    if (selectedNodes.length === 0) return;
    createGroupAction(selectedNodes, "New Group");
    setSelectedNodes([]);
  }, [selectedNodes, createGroupAction, setSelectedNodes]);

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
