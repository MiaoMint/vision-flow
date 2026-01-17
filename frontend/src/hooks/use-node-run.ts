import { useReactFlow } from "@xyflow/react";
import { type BaseNodeData } from "../components/nodes/types";
import { useEffect, useRef } from "react";

interface UseNodeRunProps {
    id: string;
    nodeData: BaseNodeData;
    apiFunction: (params: {
        prompt: string;
        model: string;
        providerId: number;
        images?: string[];
        videos?: string[];
        audios?: string[];
        documents?: string[];
        projectId?: number;
    }) => Promise<any>;
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
        if (nodeData.isUserProvided) {
            return;
        }

        if (!nodeData.providerId || !nodeData.modelId) {
            updateNodeData(id, { error: "Please select a provider and model" });
            return;
        }

        updateNodeData(id, { processing: true, error: undefined });
        setIncomingEdgesAnimation(true);
        onStart?.();

        const edges = getEdges();
        const incomingEdges = edges.filter((edge) => edge.target === id);

        const sourcePrompts: string[] = [];
        const images: string[] = [];
        const videos: string[] = [];
        const audios: string[] = [];
        const documents: string[] = [];

        incomingEdges.forEach((edge) => {
            const sourceNode = getNode(edge.source);
            if (!sourceNode) return;
            const data = sourceNode.data as any;

            // Collect explicit media types
            if (data.imageUrl) images.push(data.imageUrl);
            if (data.videoUrl) videos.push(data.videoUrl);
            if (data.audioUrl) audios.push(data.audioUrl);
            if (data.documentUrl) documents.push(data.documentUrl);

            // Collect text content
            if (data.content) {
                sourcePrompts.push(data.content);
            }

        });

        const mergedPrompt = `${sourcePrompts.join("\n\n")}\n\n${nodeData.prompt ?? ""}`.trim();

        console.log("--- Executing Node", id, "---");
        console.log("Inputs:", { images, videos, audios, documents, mergedPrompt });

        try {
            const response = await apiFunction({
                prompt: mergedPrompt,
                model: nodeData.modelId,
                providerId: nodeData.providerId,
                images: images.length > 0 ? images : undefined,
                videos: videos.length > 0 ? videos : undefined,
                audios: audios.length > 0 ? audios : undefined,
                documents: documents.length > 0 ? documents : undefined,
                projectId: nodeData.projectId,
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
