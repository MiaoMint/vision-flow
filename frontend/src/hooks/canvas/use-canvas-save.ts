import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { SaveProject } from "../../../wailsjs/go/database/Service";
import { database } from "../../../wailsjs/go/models";
import { useCanvasStore } from "@/stores/use-canvas-store";

export function useCanvasSave() {
    const { getNodes, getEdges } = useReactFlow();
    const project = useCanvasStore((state) => state.project);

    const saveProject = useCallback(async () => {
        if (!project?.id) return;

        const nodes = getNodes();
        const edges = getEdges();
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
            // Use the project from store which should have the updated name
            await SaveProject(
                new database.Project({
                    ...project,
                    workflow,
                })
            );
        } catch (err) {
            console.error("Auto-save failed:", err);
        }
    }, [getNodes, getEdges, project]);

    return { saveProject };
}
