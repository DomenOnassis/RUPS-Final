import { Node } from './Node';

// Component types
export type ComponentType = 
  | 'battery' | 'bulb' | 'resistor' | 'switch' | 'wire'
  | 'and' | 'or' | 'not' | 'nand' | 'nor' | 'xor' | 'xnor'
  | 'input-0' | 'input-1' | 'output';

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  start: Node;
  end: Node;
  
  // Electric circuit properties
  voltage?: number;      // For battery
  resistance?: number;   // For resistor
  isOn?: boolean;        // For switch and bulb state
  
  // Logic circuit properties
  inputValue?: number;   // For input components
  outputValue?: number;  // For output/gate results
}

// Simulation result codes
export enum SimulationResult {
  NO_BATTERY = -1,
  SWITCH_OFF = -2,
  OPEN_CIRCUIT = 0,
  CLOSED_CIRCUIT = 1,
}

export class CircuitGraph {
  nodes: Map<string, Node>;
  components: CircuitComponent[];
  MERGE_RADIUS: number;

  constructor() {
    this.nodes = new Map();
    this.components = [];
    this.MERGE_RADIUS = 25;
  }

  // Add or merge a node
  addNode(node: Node): Node {
    if (!node) return node;

    // Check if there's an existing node close enough to merge
    for (const existingNode of this.nodes.values()) {
      const dx = existingNode.x - node.x;
      const dy = existingNode.y - node.y;
      const distance = Math.hypot(dx, dy);

      if (distance < this.MERGE_RADIUS) {
        // Merge: connect both nodes
        existingNode.connectTo(node);
        return existingNode;
      }
    }

    // No merge - add as new node
    this.nodes.set(node.id, node);
    return node;
  }

  // Add a component and register its nodes
  addComponent(component: CircuitComponent): void {
    this.components.push(component);
    this.addNode(component.start);
    this.addNode(component.end);
  }

  // Remove a component
  removeComponent(componentId: string): void {
    const index = this.components.findIndex(c => c.id === componentId);
    if (index !== -1) {
      const component = this.components[index];
      
      // Disconnect nodes
      component.start.disconnectFrom(component.end);
      
      this.components.splice(index, 1);
    }
  }

  // Clear all components and nodes
  clear(): void {
    this.nodes.clear();
    this.components = [];
  }

  // Get all components connected to a node
  getConnections(node: Node): CircuitComponent[] {
    return this.components.filter(
      comp => this.sameNode(comp.start, node) || this.sameNode(comp.end, node)
    );
  }

  // Check if two nodes are at the same position
  sameNode(a: Node, b: Node): boolean {
    return a && b && a.x === b.x && a.y === b.y;
  }

  // Check if a component conducts electricity
  componentConducts(comp: CircuitComponent): boolean {
    const conductiveTypes: ComponentType[] = ['wire', 'bulb', 'resistor', 'battery'];
    
    if (comp.type === 'switch') {
      return comp.isOn === true;
    }
    
    return conductiveTypes.includes(comp.type);
  }

  // Check if there's a closed loop from current to target
  hasClosedLoop(
    current: Node, 
    target: Node, 
    visitedComps: Set<string> = new Set()
  ): boolean {
    if (this.sameNode(current, target) && visitedComps.size > 0) {
      return true;
    }

    const connections = this.getConnections(current);

    for (const comp of connections) {
      if (visitedComps.has(comp.id)) continue;
      if (!this.componentConducts(comp)) continue;

      visitedComps.add(comp.id);

      // Determine next node
      const nextNode = this.sameNode(comp.start, current) ? comp.end : comp.start;

      if (this.hasClosedLoop(nextNode, target, visitedComps)) {
        return true;
      }

      visitedComps.delete(comp.id);
    }

    return false;
  }

  // Main simulation - check if circuit is complete
  simulate(): SimulationResult {
    const battery = this.components.find(c => c.type === 'battery');
    if (!battery) return SimulationResult.NO_BATTERY;

    // Check for open switch in the circuit
    const hasOpenSwitch = this.components.some(
      c => c.type === 'switch' && !c.isOn
    );

    const start = battery.start;
    const end = battery.end;

    const closed = this.hasClosedLoop(start, end);

    if (closed) {
      // Turn on all bulbs in the circuit
      this.components.forEach(c => {
        if (c.type === 'bulb') {
          c.isOn = true;
        }
      });
      return SimulationResult.CLOSED_CIRCUIT;
    } else {
      // Turn off all bulbs
      this.components.forEach(c => {
        if (c.type === 'bulb') {
          c.isOn = false;
        }
      });
      
      if (hasOpenSwitch) {
        return SimulationResult.SWITCH_OFF;
      }
      return SimulationResult.OPEN_CIRCUIT;
    }
  }

  // Get bulbs that should be lit
  getLitBulbs(): CircuitComponent[] {
    return this.components.filter(c => c.type === 'bulb' && c.isOn);
  }

  // Serialize for saving
  serialize(): { components: Array<{ type: string; x: number; y: number; rotation: number }> } {
    return {
      components: this.components.map(c => ({
        type: c.type,
        x: c.x,
        y: c.y,
        rotation: c.rotation,
      })),
    };
  }

  // Load from serialized data
  static deserialize(data: { components: Array<{ type: string; x: number; y: number; rotation: number }> }): CircuitGraph {
    const graph = new CircuitGraph();
    
    data.components.forEach((compData, index) => {
      const startNode = new Node(`${index}-start`, compData.x - 40, compData.y);
      const endNode = new Node(`${index}-end`, compData.x + 40, compData.y);
      
      const component: CircuitComponent = {
        id: `component-${index}`,
        type: compData.type as ComponentType,
        x: compData.x,
        y: compData.y,
        rotation: compData.rotation,
        start: startNode,
        end: endNode,
        isOn: compData.type === 'switch' ? false : undefined,
      };
      
      graph.addComponent(component);
    });
    
    return graph;
  }
}
