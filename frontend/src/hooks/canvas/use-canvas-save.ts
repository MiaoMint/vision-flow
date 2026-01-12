import { useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { SaveProject } from "../../../wailsjs/go/database/Service";
import { database } from "../../../wailsjs/go/models";

interface UseCanvasSaveProps {
  project: database.Project;
  nodes: Node[];
  edges: Edge[];
  name: string;
}

export function useCanvasSave({
  project,
  nodes,
  edges,
  name,
}: UseCanvasSaveProps) {
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

  return { saveProject };
}
