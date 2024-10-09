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

export type Node = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text1: string;
  text2: string;
  text3: string;
  selected: boolean;
  connections: { id: number; fromSide: "top" | "right" | "bottom" | "left"; toSide: "top" | "right" | "bottom" | "left"; lineStyle: "solid" | "dashed" | "curved"; }[];
  zIndex: number;
  backgroundColor: string;
  rotation?: number;
};

// DraggingState 타입 정의 부분
export type DraggingState = {
  node: Node;
  offsetX: number;
  offsetY: number;
  selectedNodes?: Node[]; // selectedNodes 속성 추가
};

export interface SelectionArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// 그리기 작업을 저장할 타입 정의
export type DrawingAction = {
  type: 'draw' | 'erase';
  points: { x: number; y: number }[];
  color?: string;
  lineWidth: number;
};
