// Node types and data structures
export type NodeType = "text" | "image" | "video" | "audio" | "group";

export interface BaseNodeData {
  label: string;
  type: NodeType;
  modelId?: string;
  providerId?: number;
  input?: any;
  output?: any;
  processing?: boolean;
  error?: string;
  prompt?: string;
  runTrigger?: string;
}

export interface TextNodeData extends BaseNodeData {
  type: "text";
  content?: string;
}

export interface ImageNodeData extends BaseNodeData {
  type: "image";
  imageUrl?: string;
}

export interface VideoNodeData extends BaseNodeData {
  type: "video";
  videoUrl?: string;
}

export interface AudioNodeData extends BaseNodeData {
  type: "audio";
  audioUrl?: string;
}

export interface GroupNodeData extends BaseNodeData {
  type: "group";
}

export type WorkflowNodeData = TextNodeData | ImageNodeData | VideoNodeData | AudioNodeData | GroupNodeData;
