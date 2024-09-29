export type Tool =
  | 'move'
  | 'draw'
  | 'addNode'
  | 'connect'
  | 'erase'
  | 'clear'
  | 'alignVertical'
  | 'alignHorizontal'
  | 'select';

export interface Node {
  id: number;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  selected?: boolean;
  rotation?: number;
  group?: string;
  connections: {
    id: number;
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    toSide: 'top' | 'right' | 'bottom' | 'left';
    lineStyle: 'solid' | 'dashed';
  }[];
  zIndex: number;
  backgroundColor?: string;
}

export interface DraggingState {
  node: Node;
  offsetX: number;
  offsetY: number;
}
