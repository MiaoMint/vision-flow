import { useCallback, useRef } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { toast } from "sonner";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

interface UseCanvasImportExportProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setNodeIdCounter: (counter: number | ((counter: number) => number)) => void;
}

export function useCanvasImportExport({
  nodes,
  edges,
  setNodes,
  setEdges,
  setNodeIdCounter,
}: UseCanvasImportExportProps) {
  const { _ } = useLingui();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const data = {
      nodes,
      edges,
    };
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard
      .writeText(jsonString)
      .then(() => toast.success(_(msg`Project JSON copied to clipboard`)))
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error(_(msg`Failed to copy project JSON`));
      });
  }, [nodes, edges, _]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

  return {
    fileInputRef,
    handleExport,
    handleImportClick,
    handleFileChange,
  };
}
