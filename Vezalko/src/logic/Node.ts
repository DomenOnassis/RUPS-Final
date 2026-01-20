// Node class for circuit graph connections
export class Node {
  id: string;
  x: number;
  y: number;
  connected: Set<Node>;
  bitValue: number; // For logic circuits

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.connected = new Set();
    this.bitValue = 0;
  }

  connectTo(node: Node): void {
    this.connected.add(node);
    node.connected.add(this);
  }

  disconnectFrom(node: Node): void {
    this.connected.delete(node);
    node.connected.delete(this);
  }

  isConnectedTo(node: Node): boolean {
    return this.connected.has(node);
  }

  // Get all connected nodes recursively (for finding paths)
  getAllConnected(visited: Set<Node> = new Set()): Set<Node> {
    visited.add(this);
    
    for (const connected of this.connected) {
      if (!visited.has(connected)) {
        connected.getAllConnected(visited);
      }
    }
    
    return visited;
  }
}
