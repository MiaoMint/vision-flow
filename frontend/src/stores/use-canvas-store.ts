import { create } from "zustand";
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type Connection,
    type XYPosition,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
} from "@xyflow/react";
import { database } from "../../wailsjs/go/models";

// History state interface
interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface CanvasState {
    // Project State
    project: database.Project | null;

    // Graph State
    nodes: Node[];
    edges: Edge[];
    nodeIdCounter: number;

    // Selection State
    selectedNodes: string[];

    // UI State
    isChatOpen: boolean;
    chatMessage: string;

    // History State
    history: HistoryState[];
    historyIndex: number;

    // Actions
    initProject: (project: database.Project) => void;
    setNodes: (nodes: Node[]) => void;
    onNodesChange: OnNodesChange;
    setEdges: (edges: Edge[]) => void;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    addNode: (node: Node) => void;
    createNode: (options: { type: string; position: XYPosition; data: Record<string, unknown> }) => void;

    setNodeIdCounter: (counter: number | ((c: number) => number)) => void;

    setSelectedNodes: (nodeIds: string[]) => void;

    toggleChat: () => void;
    setChatMessage: (message: string) => void;

    // History Actions
    undo: () => void;
    redo: () => void;
    recordState: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Helpers
    updateProjectName: (name: string) => void;

    // AI / Advanced Actions
    deleteNode: (id: string) => void;
    createGroup: (nodeIds: string[], label?: string) => void;
    connectNodes: (source: string, target: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    project: null,
    nodes: [],
    edges: [],
    nodeIdCounter: 1,
    selectedNodes: [],
    isChatOpen: false,
    chatMessage: "",
    history: [],
    historyIndex: -1,

    initProject: (project) => {
        let initialNodes: Node[] = [];
        let initialEdges: Edge[] = [];
        let initialIdCounter = 1;

        if (project.workflow) {
            try {
                const flow = JSON.parse(project.workflow);
                if (flow.nodes) {
                    initialNodes = flow.nodes.map((n: any) => ({
                        ...n,
                        data: {
                            ...n.data,
                            processing: false,
                            error: undefined,
                            runTrigger: undefined,
                            projectId: project.id,
                        },
                    }));
                }
                if (flow.edges) initialEdges = flow.edges;

                // Calculate max ID
                let maxId = 0;
                if (Array.isArray(initialNodes)) {
                    initialNodes.forEach((n) => {
                        const idNum = parseInt(n.id.replace(/[^0-9]/g, ""));
                        if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
                    });
                }
                initialIdCounter = maxId + 1;
            } catch (err) {
                console.error("Failed to parse project workflow:", err);
            }
        }

        set({
            project,
            nodes: initialNodes,
            edges: initialEdges,
            nodeIdCounter: initialIdCounter,
            history: [],
            historyIndex: -1
        });

        // Record initial state
        get().recordState();
    },

    setNodes: (nodes) => set({ nodes }),

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });

        // Record state if nodes are removed
        if (changes.some((c) => c.type === "remove")) {
            get().recordState();
        }
    },

    setEdges: (edges) => set({ edges }),

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });

        // Record state if edges are removed
        if (changes.some((c) => c.type === "remove")) {
            get().recordState();
        }
    },

    onConnect: (connection) => {
        set({
            edges: addEdge({ ...connection, animated: false }, get().edges),
        });
        get().recordState();
    },

    addNode: (node) => {
        set((state) => ({
            nodes: [...state.nodes, node],
            nodeIdCounter: state.nodeIdCounter + 1,
        }));
        get().recordState();
    },

    createNode: (options) => {
        const state = get();
        const newId = `node-${state.nodeIdCounter}`;
        const newNode: Node = {
            id: newId,
            type: options.type,
            position: options.position,
            data: options.data,
        };
        set({
            nodes: [...state.nodes, newNode],
            nodeIdCounter: state.nodeIdCounter + 1,
        });
        get().recordState();
    },

    setNodeIdCounter: (input) => set((state) => ({
        nodeIdCounter: typeof input === "function" ? input(state.nodeIdCounter) : input
    })),

    setSelectedNodes: (selectedNodes) => set({ selectedNodes }),

    toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

    setChatMessage: (chatMessage) => set({ chatMessage }),

    recordState: () => {
        const { nodes, edges, history, historyIndex } = get();
        const currentState = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };

        // Check if distinct from last state
        const lastState = history[historyIndex];
        if (lastState && JSON.stringify(lastState) === JSON.stringify(currentState)) {
            return;
        }

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentState);

        // Limit history size if needed (e.g. 50)
        if (newHistory.length > 50) {
            newHistory.shift();
        }

        set({
            history: newHistory,
            historyIndex: newHistory.length - 1
        });
    },

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        const prevState = history[newIndex];

        set({
            nodes: prevState.nodes,
            edges: prevState.edges,
            historyIndex: newIndex
        });
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        const nextState = history[newIndex];

        set({
            nodes: nextState.nodes,
            edges: nextState.edges,
            historyIndex: newIndex
        });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    updateProjectName: (name) => set((state) => {
        if (!state.project) return {};
        // Clone project to avoid mutation issues if it were deeply nested
        const newProject = new database.Project({ ...state.project, name: name });
        return { project: newProject };
    }),

    deleteNode: (id) => {
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== id),
            edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        }));
        get().recordState();
    },

    createGroup: (nodeIds, label) => {
        if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) return;
        const state = get();
        const targetNodes = state.nodes.filter((n) => nodeIds.includes(n.id));
        if (targetNodes.length === 0) return;

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        targetNodes.forEach((n) => {
            const nWidth = n.width || n.measured?.width || 200;
            const nHeight = n.height || n.measured?.height || 200;
            if (n.position.x < minX) minX = n.position.x;
            if (n.position.y < minY) minY = n.position.y;
            if (n.position.x + nWidth > maxX) maxX = n.position.x + nWidth;
            if (n.position.y + nHeight > maxY) maxY = n.position.y + nHeight;
        });

        const PADDING = 50;
        const groupX = minX - PADDING;
        const groupY = minY - PADDING;
        const groupWidth = (maxX - minX) + (PADDING * 2);
        const groupHeight = (maxY - minY) + (PADDING * 2);

        const groupNode: Node = {
            id: `group-${get().nodeIdCounter}`,
            type: "group",
            position: { x: groupX, y: groupY },
            width: groupWidth,
            height: groupHeight,
            style: {
                width: groupWidth,
                height: groupHeight,
                zIndex: -1,
                border: "none",
                background: "transparent",
                padding: 0,
            },
            selectable: false,
            data: { label: label || "Group" },
        };

        set((state) => ({
            nodes: [...state.nodes, groupNode],
        }));
        get().recordState();
    },

    connectNodes: (source, target) => {
        const state = get();
        // Check if edge already exists
        const exists = state.edges.some((e) => e.source === source && e.target === target);
        if (!exists) {
            const newEdge = { id: `e-${source}-${target}`, source, target };
            // Use addEdge from xyflow to ensure proper handling if needed, or just append
            // But we can just use the store's setEdges or onConnect logic if we want consistency
            // Here simpler is better for programmatic access
            set((state) => ({
                edges: [...state.edges, { ...newEdge, animated: false } as Edge],
            }));
            get().recordState();
        }
    },

}));
