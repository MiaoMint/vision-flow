import { useCallback, useRef, useEffect } from "react";
import { type Node, type Edge, useReactFlow } from "@xyflow/react";
import { useLingui } from "@lingui/react";
import { useCanvasStore } from "@/stores/use-canvas-store";
import { ClipboardSetText } from "../../../wailsjs/runtime/runtime";
import type { NodeType, TextNodeData, WorkflowNodeData } from "@/components/nodes/types";
import { CreateAssetFromFile } from "../../../wailsjs/go/database/Service"; // Moved import to top

interface UseCanvasCopyPasteProps {
  mousePositionRef: React.RefObject<{ x: number; y: number }>;
}

// Helper to infer node type from file
const getNodeType = (file: File | Blob, name?: string): NodeType | null => {
  const type = file.type;
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";

  if (name) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "image";
    if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext || "")) return "video";
    if (["mp3", "wav", "ogg", "m4a"].includes(ext || "")) return "audio";
  }

  return null;
};

export function useCanvasCopyPaste({
  mousePositionRef,
}: UseCanvasCopyPasteProps) {
  const { _ } = useLingui();
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

  const nodeIdCounter = useCanvasStore((state) => state.nodeIdCounter);
  const setNodeIdCounter = useCanvasStore((state) => state.setNodeIdCounter);
  const recordState = useCanvasStore((state) => state.recordState);
  const project = useCanvasStore((state) => state.project); // project is not used, but kept as per original

  const copiedNodesRef = useRef<Node[]>([]);

  // Function to process and upload a single file
  const processFile = useCallback(
    async (file: File) => {
      const nodeType = getNodeType(file, file.name);
      if (!nodeType) {
        console.warn(`Unsupported file type for paste: ${file.type} (${file.name})`);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise<void>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64result = reader.result as string;
            const base64data = base64result.split(",")[1];

            // Convert base64 to byte array for Wails
            const binaryString = window.atob(base64data);
            const bytes = new Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // Upload via Wails
            const asset = await CreateAssetFromFile(file.name, bytes);

            if (asset) {
              const targetX = mousePositionRef.current?.x ?? 0;
              const targetY = mousePositionRef.current?.y ?? 0;
              const newId = `node-${crypto.randomUUID()}`;

              // Construct node data based on type
              let nodeData: WorkflowNodeData | TextNodeData;

              const commonData = {
                label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
                type: nodeType,
                isUserProvided: true,
              };

              if (nodeType === "image") {
                nodeData = { ...commonData, imageUrl: asset.url };
              } else if (nodeType === "video") {
                nodeData = { ...commonData, videoUrl: asset.url };
              } else if (nodeType === "audio") {
                nodeData = { ...commonData, audioUrl: asset.url };
              } else {
                // Should not happen due to getNodeType check, but for type safety
                nodeData = { ...commonData, content: "Unsupported Media" };
              }

              const newNode: Node = {
                id: newId,
                type: nodeType,
                position: {
                  x: targetX,
                  y: targetY,
                },
                data: nodeData as unknown as Record<string, unknown>,
              };

              setNodes((nds) => [...nds, newNode]);
              recordState();
            }
            resolve();
          } catch (e) {
            console.error("Failed to upload asset:", e);
            reject(e);
          }
        };
        reader.onerror = reject;
      });
    },
    [mousePositionRef, setNodes, recordState]
  );

  // Copy selected nodes
  const copyNodes = useCallback(() => {
    const nodes = getNodes();
    const selectedNodesList = nodes.filter((n) => n.selected);
    if (selectedNodesList.length > 0) {
      copiedNodesRef.current = selectedNodesList;
      // Clear system clipboard
      ClipboardSetText("").catch((error) => {
        console.error("Failed to clear clipboard:", error);
      });
    }
  }, [getNodes]);

  // Internal Helper for pasting nodes
  const pasteInternalNodes = useCallback(() => {
    const nodesToPaste = copiedNodesRef.current;
    if (nodesToPaste.length === 0) return;

    const copiedNodePositions = nodesToPaste.map((n) => n.position);
    const minX = Math.min(...copiedNodePositions.map((p) => p.x));
    const minY = Math.min(...copiedNodePositions.map((p) => p.y));
    const maxX = Math.max(...copiedNodePositions.map((p) => p.x));
    const maxY = Math.max(...copiedNodePositions.map((p) => p.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetX = mousePositionRef.current?.x ?? 0;
    const targetY = mousePositionRef.current?.y ?? 0;

    const newNodes: Node[] = [];
    const oldToNewIdMap = new Map<string, string>();

    nodesToPaste.forEach((copiedNode) => {
      const newId = `node-${crypto.randomUUID()}`; // Use UUID for internal paste too
      oldToNewIdMap.set(copiedNode.id, newId);

      const offsetX = copiedNode.position.x - centerX;
      const offsetY = copiedNode.position.y - centerY;

      const newNode: Node = {
        ...copiedNode,
        id: newId,
        position: { x: targetX + offsetX, y: targetY + offsetY },
        selected: false,
        data: {
          ...copiedNode.data,
          label: (copiedNode.data.label || "Node") + " (Copy)",
          // Clear runtime states
          processing: undefined,
          error: undefined,
          runTrigger: undefined,
        },
      };
      newNodes.push(newNode);
    });

    const copiedNodeIds = new Set(nodesToPaste.map((n) => n.id));
    const edges = getEdges();
    const newEdges: Edge[] = edges
      .filter((e) => copiedNodeIds.has(e.source) && copiedNodeIds.has(e.target))
      .map((e) => ({
        ...e,
        id: `e${oldToNewIdMap.get(e.source)}-${oldToNewIdMap.get(e.target)}`,
        source: oldToNewIdMap.get(e.source)!,
        target: oldToNewIdMap.get(e.target)!,
      }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    setNodeIdCounter((c) => c + newNodes.length); // Still increment counter for consistency, though UUIDs are used
    recordState();
  }, [copiedNodesRef, mousePositionRef, getEdges, setNodes, setEdges, setNodeIdCounter, recordState]);


  // Paste via Button/Programmatic (using Clipboard API)
  const pasteNodes = useCallback(async () => {
    // 1. Try files from system clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          // Find supported type
          const type = item.types.find((t) =>
            t.startsWith("image/") || t.startsWith("video/") || t.startsWith("audio/")
          );

          if (type) {
            const blob = await item.getType(type);
            // Convert blob to File object
            const ext = type.split("/")[1] || "dat";
            const filename = `pasted_file_${Date.now()}.${ext}`;
            const file = new File([blob], filename, { type });

            await processFile(file);
            return; // Stop after first file for programmatic paste (optional choice)
          }
        }
      }
    } catch (err) {
      console.warn("Clipboard read failed or permission denied:", err);
    }

    // 2. Try text from system clipboard
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        const targetX = mousePositionRef.current?.x ?? 0;
        const targetY = mousePositionRef.current?.y ?? 0;
        const newId = `node-${crypto.randomUUID()}`; // Use UUID for text nodes too

        const newNode: Node = {
          id: newId,
          type: "text",
          position: { x: targetX, y: targetY },
          data: {
            label: "Text",
            type: "text",
            content: clipboardText,
            isUserProvided: true,
          } as unknown as Record<string, unknown>,
        };
        setNodes((nds) => [...nds, newNode]);
        setNodeIdCounter((c) => c + 1);
        recordState();
        return;
      }
    } catch (error) {
      // Ignore text error if clipboard access fails
    }

    // 3. Fallback to Internal Copy/Paste (if no external content found)
    if (copiedNodesRef.current.length > 0) {
      pasteInternalNodes();
    }

  }, [processFile, mousePositionRef, setNodes, setNodeIdCounter, recordState, copiedNodesRef, pasteInternalNodes]);


  // Native Paste Event Listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();

      const files = event.clipboardData?.files;
      if (files && files.length > 0) {
        // Process all files from native paste
        for (let i = 0; i < files.length; i++) {
          await processFile(files[i]);
        }
        return;
      }

      // Handle Text
      const text = event.clipboardData?.getData("text");
      if (text && text.trim()) {
        const targetX = mousePositionRef.current?.x ?? 0;
        const targetY = mousePositionRef.current?.y ?? 0;
        const newId = `node-${crypto.randomUUID()}`; // Use UUID for text nodes too

        const newNode: Node = {
          id: newId,
          type: "text",
          position: { x: targetX, y: targetY },
          data: {
            label: "Text",
            type: "text",
            content: text,
            isUserProvided: true,
          } as unknown as Record<string, unknown>,
        };
        setNodes((nds) => [...nds, newNode]);
        setNodeIdCounter((c) => c + 1);
        recordState();
        return;
      }

      // Handle Internal Nodes
      if (copiedNodesRef.current.length > 0) {
        pasteInternalNodes();
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile, mousePositionRef, setNodes, setNodeIdCounter, recordState, copiedNodesRef, pasteInternalNodes]);

  // Keyboard Shortcuts (Copy Only)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "c") {
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copyNodes]);

  return { copyNodes, pasteNodes };
}
