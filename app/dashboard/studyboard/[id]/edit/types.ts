export type Tool =
  | 'move'
  | 'draw'
  | 'addNode'
  | 'link'
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
  links: Link[]; // connections => links로 변경
  zIndex: number;
  backgroundColor: string;
  borderColor: string;
  rotation?: number;
};

// DraggingState 타입 정의 부분
export type DraggingState = {
  node: Node;
  offsetX: number;
  offsetY: number;
  selectedNodes?: Node[]; // selectedNodes 속성 추가
};

export type SelectionArea = {
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

// Connection => Link로 변경
export type Link = {
  id: string;
  fromSide: "top" | "right" | "bottom" | "left" | "topRight" | "topLeft" | "bottomRight" | "bottomLeft";  
  toSide: "top" | "right" | "bottom" | "left" | "topRight" | "topLeft" | "bottomRight" | "bottomLeft";
  lineStyle: 'solid' | 'dashed' | 'curved';
  text?: string;
}

export type TemporaryLink = {
  startNode: Node;
  startSide: 'top' | 'right' | 'bottom' | 'left' | 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
  endX: number;
  endY: number;
}

