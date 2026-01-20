import { create } from 'zustand';
import { CircuitGraph, CircuitComponent, ComponentType, SimulationResult } from '@/logic/CircuitGraph';
import { Node } from '@/logic/Node';

interface WorkspaceComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  isOn?: boolean;
}

interface WorkspaceState {
  // Components on the workspace
  components: WorkspaceComponent[];
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  
  // History for undo/redo
  history: WorkspaceComponent[][];
  historyIndex: number;
  
  // View state
  zoom: number;
  panX: number;
  panY: number;
  
  // Simulation
  circuitGraph: CircuitGraph;
  simulationResult: SimulationResult;
  litBulbs: Set<string>;
  
  // Grid settings
  gridSize: number;
  panelWidth: number;
  
  // Actions
  addComponent: (type: ComponentType, x: number, y: number, rotation?: number) => string;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<WorkspaceComponent>) => void;
  rotateComponent: (id: string) => void;
  toggleSwitch: (id: string) => void;
  
  selectComponent: (id: string | null) => void;
  setHoveredComponent: (id: string | null) => void;
  
  // View actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Simulation
  simulate: () => SimulationResult;
  
  // Clear and load
  clear: () => void;
  loadComponents: (components: WorkspaceComponent[]) => void;
  
  // Snap to grid
  snapToGrid: (x: number, y: number) => { x: number; y: number };
  
  // Check if position is occupied
  isPositionOccupied: (x: number, y: number, excludeId?: string) => boolean;
}

let componentIdCounter = 0;

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  hoveredComponentId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  circuitGraph: new CircuitGraph(),
  simulationResult: SimulationResult.OPEN_CIRCUIT,
  litBulbs: new Set(),
  gridSize: 60,
  panelWidth: 200,

  addComponent: (type, x, y, rotation = 0) => {
    const id = `component-${++componentIdCounter}`;
    const { panelWidth, snapToGrid, isPositionOccupied } = get();
    
    // Snap to grid
    const snapped = snapToGrid(x, y);
    
    // Don't place if position is occupied
    if (isPositionOccupied(snapped.x, snapped.y)) {
      return '';
    }
    
    // Don't place in panel area
    if (snapped.x < panelWidth + 20) {
      return '';
    }
    
    const newComponent: WorkspaceComponent = {
      id,
      type,
      x: snapped.x,
      y: snapped.y,
      rotation,
      isOn: type === 'switch' ? false : type === 'bulb' ? false : undefined,
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

  toggleSwitch: (id) => {
    set(state => ({
      components: state.components.map(c =>
        c.id === id && c.type === 'switch' ? { ...c, isOn: !c.isOn } : c
      ),
    }));
    // Simulate immediately for switch toggle since it's a discrete action
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
    
    // Limit history size
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
    const graph = new CircuitGraph();
    
    // Add all components to the graph
    components.forEach(comp => {
      // Calculate node positions based on component position and rotation
      const angle = (comp.rotation * Math.PI) / 180;
      const halfWidth = 40;
      
      const startX = comp.x - halfWidth * Math.cos(angle);
      const startY = comp.y - halfWidth * Math.sin(angle);
      const endX = comp.x + halfWidth * Math.cos(angle);
      const endY = comp.y + halfWidth * Math.sin(angle);
      
      const startNode = new Node(`${comp.id}-start`, startX, startY);
      const endNode = new Node(`${comp.id}-end`, endX, endY);
      startNode.connectTo(endNode);
      
      const graphComponent: CircuitComponent = {
        id: comp.id,
        type: comp.type,
        x: comp.x,
        y: comp.y,
        rotation: comp.rotation,
        start: startNode,
        end: endNode,
        isOn: comp.isOn,
      };
      
      graph.addComponent(graphComponent);
    });
    
    const result = graph.simulate();
    const litBulbs = new Set(graph.getLitBulbs().map(b => b.id));
    
    set({
      circuitGraph: graph,
      simulationResult: result,
      litBulbs,
    });
    
    return result;
  },

  clear: () => {
    set({
      components: [],
      selectedComponentId: null,
      history: [[]],
      historyIndex: 0,
      litBulbs: new Set(),
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
