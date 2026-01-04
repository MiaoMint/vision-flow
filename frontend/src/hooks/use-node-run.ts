import { useReactFlow } from "@xyflow/react";
import { type BaseNodeData } from "../components/nodes/types";

interface UseNodeRunProps {
    id: string;
    nodeData: BaseNodeData;
    apiFunction: (params: { prompt: string; model: string; providerId: number }) => Promise<any>;
    onSuccess: (response: any) => void;
    onStart?: () => void;
}

export function useNodeRun({ id, nodeData, apiFunction, onSuccess, onStart }: UseNodeRunProps) {
    const { updateNodeData } = useReactFlow();

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
        onStart?.();

        try {
            const response = await apiFunction({
                prompt: nodeData.prompt,
                model: nodeData.modelId,
                providerId: nodeData.providerId,
            });
            console.log("Node execution response:", response);
            updateNodeData(id, { processing: false });
            onSuccess(response);
        } catch (err: any) {
            console.error("Node execution error:", err);
            updateNodeData(id, { processing: false, error: err.toString() });
        }
    };

    return { handleRun };
}
