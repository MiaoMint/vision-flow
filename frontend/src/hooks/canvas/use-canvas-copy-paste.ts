import { useCallback, useRef, useEffect } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { useLingui } from "@lingui/react";

interface UseCanvasCopyPasteProps {
  nodes: Node[];
  edges: Edge[];
  nodeIdCounter: number;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setNodeIdCounter: (counter: number | ((counter: number) => number)) => void;
  mousePositionRef: React.RefObject<{ x: number; y: number }>;
}

export function useCanvasCopyPaste({
  nodes,
  edges,
  nodeIdCounter,
  setNodes,
  setEdges,
  setNodeIdCounter,
  mousePositionRef,
}: UseCanvasCopyPasteProps) {
  const { _ } = useLingui();
  const copiedNodesRef = useRef<Node[]>([]);

  // Copy selected nodes
  const copyNodes = useCallback(() => {
    const selectedNodesList = nodes.filter((n) => n.selected);
    if (selectedNodesList.length > 0) {
      copiedNodesRef.current = selectedNodesList;
    }
  }, [nodes]);

  // Paste copied nodes
  const pasteNodes = useCallback(() => {
    if (copiedNodesRef.current.length === 0) return;

    // Calculate the center of the copied nodes
    const copiedNodePositions = copiedNodesRef.current.map((n) => n.position);
    const minX = Math.min(...copiedNodePositions.map((p) => p.x));
    const minY = Math.min(...copiedNodePositions.map((p) => p.y));
    const maxX = Math.max(...copiedNodePositions.map((p) => p.x));
    const maxY = Math.max(...copiedNodePositions.map((p) => p.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Use mouse position as paste target
    const targetX = mousePositionRef.current.x;
    const targetY = mousePositionRef.current.y;

    const newNodes: Node[] = [];
    const oldToNewIdMap = new Map<string, string>();

    // Create new nodes with updated IDs and positions
    copiedNodesRef.current.forEach((copiedNode) => {
      const newId = `node-${nodeIdCounter + newNodes.length}`;
      oldToNewIdMap.set(copiedNode.id, newId);

      // Calculate relative position from center and apply to mouse position
      const offsetX = copiedNode.position.x - centerX;
      const offsetY = copiedNode.position.y - centerY;

      const newNode: Node = {
        ...copiedNode,
        id: newId,
        position: {
          x: targetX + offsetX,
          y: targetY + offsetY,
        },
        selected: false,
        data: {
          ...copiedNode.data,
          label: copiedNode.data.label + " (Copy)",
          processing: undefined,
          error: undefined,
          runTrigger: undefined,
        },
      };
      newNodes.push(newNode);
    });

    // Copy edges that connect the copied nodes
    const copiedNodeIds = new Set(copiedNodesRef.current.map((n) => n.id));
    const newEdges: Edge[] = edges
      .filter(
        (edge) =>
          copiedNodeIds.has(edge.source) && copiedNodeIds.has(edge.target)
      )
      .map((edge) => ({
        ...edge,
        id: `e${oldToNewIdMap.get(edge.source)}-${oldToNewIdMap.get(
          edge.target
        )}`,
        source: oldToNewIdMap.get(edge.source)!,
        target: oldToNewIdMap.get(edge.target)!,
      }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    setNodeIdCounter((c) => c + newNodes.length);
  }, [edges, nodeIdCounter, setNodes, setEdges, setNodeIdCounter, mousePositionRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Copy: Cmd+C (Mac) or Ctrl+C (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "c") {
        // Don't interfere with text input copy
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        copyNodes();
      }

      // Paste: Cmd+V (Mac) or Ctrl+V (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "v") {
        // Don't interfere with text input paste
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        pasteNodes();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copyNodes, pasteNodes]);

  return { copyNodes, pasteNodes };
}
