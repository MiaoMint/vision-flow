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
    })

}));
