// Node types and data structures
export type NodeType = "text" | "image" | "video" | "audio";

export interface BaseNodeData {
  label: string;
  type: NodeType;
  input?: any;
  output?: any;
  processing?: boolean;
  error?: string;
}

export interface TextNodeData extends BaseNodeData {
  type: "text";
  content?: string;
  prompt?: string;
}

export interface ImageNodeData extends BaseNodeData {
  type: "image";
  imageUrl?: string;
  prompt?: string;
}

export interface VideoNodeData extends BaseNodeData {
  type: "video";
  videoUrl?: string;
  prompt?: string;
}

export interface AudioNodeData extends BaseNodeData {
  type: "audio";
  audioUrl?: string;
  prompt?: string;
}

export type WorkflowNodeData = TextNodeData | ImageNodeData | VideoNodeData | AudioNodeData;
