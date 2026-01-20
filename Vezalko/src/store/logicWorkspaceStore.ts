import { create } from 'zustand';
import { LogicCircuitGraph, LogicComponent, LogicGateType, getInputOffsets, getOutputOffset } from '@/logic/LogicCircuitGraph';
import { Node } from '@/logic/Node';

interface LogicWorkspaceComponent {
  id: string;
  type: LogicGateType;
  x: number;
  y: number;
  rotation: number;
  value?: number;
}

interface LogicWorkspaceState {
  components: LogicWorkspaceComponent[];
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  
  history: LogicWorkspaceComponent[][];
  historyIndex: number;
  
  zoom: number;
  panX: number;
  panY: number;
  
  circuitGraph: LogicCircuitGraph;
  
  gridSize: number;
  panelWidth: number;
  
  // Actions
  addComponent: (type: LogicGateType, x: number, y: number, rotation?: number) => string;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<LogicWorkspaceComponent>) => void;
  rotateComponent: (id: string) => void;
  
  selectComponent: (id: string | null) => void;
  setHoveredComponent: (id: string | null) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  simulate: () => void;
  getOutputValues: () => Array<{ id: string; value: number | undefined }>;
  
  clear: () => void;
  loadComponents: (components: LogicWorkspaceComponent[]) => void;
  
  snapToGrid: (x: number, y: number) => { x: number; y: number };
  isPositionOccupied: (x: number, y: number, excludeId?: string) => boolean;
}

let logicComponentIdCounter = 0;

export const useLogicWorkspaceStore = create<LogicWorkspaceState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  hoveredComponentId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  circuitGraph: new LogicCircuitGraph(),
  gridSize: 60,
  panelWidth: 200,

  addComponent: (type, x, y, rotation = 0) => {
    const id = `logic-${++logicComponentIdCounter}`;
    const { panelWidth, snapToGrid, isPositionOccupied } = get();
    
    const snapped = snapToGrid(x, y);
    
    if (isPositionOccupied(snapped.x, snapped.y)) {
      return '';
    }
    
    if (snapped.x < panelWidth + 20) {
      return '';
    }
    
    const newComponent: LogicWorkspaceComponent = {
      id,
      type,
      x: snapped.x,
      y: snapped.y,
      rotation,
      value: type === 'input-0' ? 0 : type === 'input-1' ? 1 : undefined,
    };
    
    set(state => ({
      components: [...state.components, newComponent],
    }));
    
    get().saveToHistory();
    get().simulate();
    
    return id;
  },

  removeComponent: (id) => {
    set(state => ({
      components: state.components.filter(c => c.id !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    }));
    get().saveToHistory();
    get().simulate();
  },

  updateComponent: (id, updates) => {
    set(state => ({
      components: state.components.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
    // Don't simulate on every update - call simulate() manually when needed
  },

  rotateComponent: (id) => {
    set(state => ({
      components: state.components.map(c =>
        c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c
      ),
    }));
    get().saveToHistory();
    get().simulate();
  },

  selectComponent: (id) => set({ selectedComponentId: id }),
  setHoveredComponent: (id) => set({ hoveredComponentId: id }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        historyIndex: newIndex,
        components: [...history[newIndex]],
      });
      get().simulate();
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        historyIndex: newIndex,
        components: [...history[newIndex]],
      });
      get().simulate();
    }
  },

  saveToHistory: () => {
    const { components, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...components]);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  simulate: () => {
    const { components } = get();
    const graph = new LogicCircuitGraph();
    
    // Convert workspace components to logic components
    components.forEach(comp => {
      const inputOffsets = getInputOffsets(comp.type, comp.rotation);
      const outputOffset = getOutputOffset(comp.rotation);
      
      const inputs = inputOffsets.map((offset, i) => 
        new Node(`${comp.id}-input-${i}`, comp.x + offset.x, comp.y + offset.y)
      );
      
      const output = new Node(`${comp.id}-output`, comp.x + outputOffset.x, comp.y + outputOffset.y);
      
      const logicComponent: LogicComponent = {
        id: comp.id,
        type: comp.type,
        x: comp.x,
        y: comp.y,
        rotation: comp.rotation,
        inputs,
        output,
        value: comp.value,
      };
      
      graph.addComponent(logicComponent);
    });
    
    graph.simulate();
    
    // Update component values from simulation
    set(state => ({
      circuitGraph: graph,
      components: state.components.map(comp => {
        const simComp = graph.components.find(c => c.id === comp.id);
        return simComp ? { ...comp, value: simComp.value } : comp;
      }),
    }));
  },

  getOutputValues: () => {
    const { circuitGraph } = get();
    return circuitGraph.getOutputs();
  },

  clear: () => {
    set({
      components: [],
      selectedComponentId: null,
      history: [[]],
      historyIndex: 0,
    });
  },

  loadComponents: (components) => {
    set({
      components,
      history: [[...components]],
      historyIndex: 0,
    });
    get().simulate();
  },

  snapToGrid: (x, y) => {
    const { gridSize, panelWidth } = get();
    const startX = panelWidth;
    
    const snappedX = Math.round((x - startX) / gridSize) * gridSize + startX;
    const snappedY = Math.round(y / gridSize) * gridSize;
    
    return { x: snappedX, y: snappedY };
  },

  isPositionOccupied: (x, y, excludeId) => {
    const { components, gridSize } = get();
    return components.some(
      c => c.id !== excludeId && 
           Math.abs(c.x - x) < gridSize / 2 && 
           Math.abs(c.y - y) < gridSize / 2
    );
  },
}));
