import { Node } from './Node';

// Logic gate types
export type LogicGateType = 'and' | 'or' | 'not' | 'nand' | 'nor' | 'xor' | 'xnor' | 'wire' | 'input-0' | 'input-1' | 'output';

export interface LogicComponent {
  id: string;
  type: LogicGateType;
  x: number;
  y: number;
  rotation: number;
  inputs: Node[];
  output: Node;
  value?: number; // 0, 1, or undefined
}

// Multi-input gates (have 2 inputs)
const MULTI_INPUT_GATES: LogicGateType[] = ['and', 'or', 'nand', 'nor', 'xor', 'xnor'];

// Get port offset based on rotation
function rotatePoint(x: number, y: number, angleDeg: number): { x: number; y: number } {
  const angle = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(x * Math.cos(angle) - y * Math.sin(angle)),
    y: Math.round(x * Math.sin(angle) + y * Math.cos(angle)),
  };
}

export function getOutputOffset(rotation: number): { x: number; y: number } {
  return rotatePoint(40, 0, rotation);
}

export function getInputOffsets(type: LogicGateType, rotation: number): Array<{ x: number; y: number }> {
  if (MULTI_INPUT_GATES.includes(type)) {
    // Two inputs at top-left and bottom-left
    return [
      rotatePoint(-40, -20, rotation),
      rotatePoint(-40, 20, rotation),
    ];
  } else {
    // Single input (NOT, wire, output)
    return [rotatePoint(-40, 0, rotation)];
  }
}

export class LogicCircuitGraph {
  components: LogicComponent[];
  connections: Map<string, string>; // Map from input node ID to output node ID
  MERGE_RADIUS: number;

  constructor() {
    this.components = [];
    this.connections = new Map();
    this.MERGE_RADIUS = 25;
  }

  addComponent(component: LogicComponent): void {
    this.components.push(component);
  }

  removeComponent(componentId: string): void {
    const index = this.components.findIndex(c => c.id === componentId);
    if (index !== -1) {
      this.components.splice(index, 1);
    }
    
    // Remove any connections involving this component
    const keysToRemove: string[] = [];
    this.connections.forEach((value, key) => {
      if (key.startsWith(componentId) || value.startsWith(componentId)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.connections.delete(key));
  }

  clear(): void {
    this.components = [];
    this.connections.clear();
  }

  // Find connections between components based on proximity
  buildConnections(): void {
    this.connections.clear();

    for (const comp of this.components) {
      // For each input of this component
      for (let i = 0; i < comp.inputs.length; i++) {
        const inputNode = comp.inputs[i];
        
        // Find any output that's close enough
        for (const other of this.components) {
          if (other.id === comp.id) continue;
          
          const dx = other.output.x - inputNode.x;
          const dy = other.output.y - inputNode.y;
          const distance = Math.hypot(dx, dy);
          
          if (distance < this.MERGE_RADIUS) {
            // Found a connection
            this.connections.set(`${comp.id}-input-${i}`, other.id);
          }
        }
      }
    }
  }

  // Evaluate a single gate
  evaluateGate(type: LogicGateType, inputs: (number | undefined)[]): number | undefined {
    // Filter out undefined inputs
    const validInputs = inputs.filter(v => v !== undefined) as number[];
    
    if (validInputs.length === 0 && type !== 'input-0' && type !== 'input-1') {
      return undefined;
    }

    switch (type) {
      case 'input-0':
        return 0;
      case 'input-1':
        return 1;
      case 'wire':
        return validInputs[0];
      case 'not':
        return validInputs[0] !== undefined ? 1 - validInputs[0] : undefined;
      case 'and':
        return validInputs.length > 0 && validInputs.every(v => v === 1) ? 1 : 0;
      case 'or':
        return validInputs.some(v => v === 1) ? 1 : 0;
      case 'nand':
        return validInputs.length > 0 && validInputs.every(v => v === 1) ? 0 : 1;
      case 'nor':
        return validInputs.some(v => v === 1) ? 0 : 1;
      case 'xor':
        return validInputs.reduce((a, b) => a ^ b, 0);
      case 'xnor':
        return validInputs.reduce((a, b) => a ^ b, 0) === 0 ? 1 : 0;
      case 'output':
        return validInputs[0];
      default:
        return undefined;
    }
  }

  // Simulate the entire logic circuit
  simulate(): void {
    this.buildConnections();
    
    // Reset all values
    this.components.forEach(c => {
      if (c.type === 'input-0') c.value = 0;
      else if (c.type === 'input-1') c.value = 1;
      else c.value = undefined;
    });

    // Iteratively propagate values until stable
    let changed = true;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const comp of this.components) {
        if (comp.type === 'input-0' || comp.type === 'input-1') continue;

        // Get input values
        const inputValues: (number | undefined)[] = [];
        for (let i = 0; i < comp.inputs.length; i++) {
          const sourceId = this.connections.get(`${comp.id}-input-${i}`);
          if (sourceId) {
            const source = this.components.find(c => c.id === sourceId);
            inputValues.push(source?.value);
          } else {
            inputValues.push(undefined);
          }
        }

        // Evaluate gate
        const newValue = this.evaluateGate(comp.type, inputValues);
        if (newValue !== comp.value) {
          comp.value = newValue;
          changed = true;
        }
      }
    }
  }

  // Get output component values
  getOutputs(): Array<{ id: string; value: number | undefined }> {
    return this.components
      .filter(c => c.type === 'output')
      .map(c => ({ id: c.id, value: c.value }));
  }

  // Check if all outputs have a specific value
  allOutputsEqual(expectedValue: number): boolean {
    const outputs = this.getOutputs();
    return outputs.length > 0 && outputs.every(o => o.value === expectedValue);
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
}
