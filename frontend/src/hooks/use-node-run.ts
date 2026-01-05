import { useReactFlow } from "@xyflow/react";
import { type BaseNodeData } from "../components/nodes/types";
import { useEffect, useRef } from "react";

interface UseNodeRunProps {
    id: string;
    nodeData: BaseNodeData;
    apiFunction: (params: { prompt: string; model: string; providerId: number }) => Promise<any>;
    onSuccess: (response: any) => void;
    onStart?: () => void;
}

export function useNodeRun({ id, nodeData, apiFunction, onSuccess, onStart }: UseNodeRunProps) {
    const { updateNodeData, getEdges, setEdges, getNode } = useReactFlow();

    // Keep track of the last handled trigger to avoid loops/double runs
    const lastTriggerRef = useRef(nodeData.runTrigger);

    const setIncomingEdgesAnimation = (animated: boolean) => {
        setEdges((edges) =>
            edges.map((edge) => {
                if (edge.target === id) {
                    return { ...edge, animated };
                }
                return edge;
            })
        );
    };

    const handleRun = async () => {
        if (!nodeData.providerId || !nodeData.modelId) {
            updateNodeData(id, { error: "Please select a provider and model" });
            return;
        }
        if (!nodeData.prompt) {
            updateNodeData(id, { error: "Please enter a prompt" });
            return;
        }

        updateNodeData(id, { processing: true, error: undefined });
        setIncomingEdgesAnimation(true);
        onStart?.();

        const edges = getEdges();
        const incomingEdges = edges.filter((edge) => edge.target === id);
        const sourceContents = incomingEdges
            .map((edge) => {
                const sourceNode = getNode(edge.source);
                if (!sourceNode) return null;
                const data = sourceNode.data as any;
                // Prioritize content (TextNode), then output, then specific media urls
                const content = data.content || data.output || data.imageUrl || data.videoUrl || data.audioUrl;

                if (content !== null && content !== undefined) {
                    // const label = data.label || sourceNode.id;
                    return `node: ${content}`;
                }
                return null;
            })
            .filter((content) => content !== null && content !== undefined);

        const mergedPrompt = `${sourceContents.join("\n\n")}\n\n${nodeData.prompt ?? ""}`;

        console.log("--- Executing Node", id, "---");

        try {
            const response = await apiFunction({
                prompt: mergedPrompt,
                model: nodeData.modelId,
                providerId: nodeData.providerId,
            });
            console.log("Node execution response:", response);
            updateNodeData(id, { processing: false });
            onSuccess(response);
        } catch (err: any) {
            console.error("Node execution error:", err);
            updateNodeData(id, { processing: false, error: err.toString() });
        } finally {
            setIncomingEdgesAnimation(false);
        }
    };

    useEffect(() => {
        if (nodeData.runTrigger && nodeData.runTrigger !== lastTriggerRef.current) {
            lastTriggerRef.current = nodeData.runTrigger;
            handleRun();
        }
    }, [nodeData.runTrigger]);

    return { handleRun };
}
