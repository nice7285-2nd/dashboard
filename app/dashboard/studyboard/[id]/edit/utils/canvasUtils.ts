import { Node, SelectionArea, DrawAction, Link, EditLink } from '../types';
import { createLesson } from '../actions';
import { toast } from 'react-toastify';

export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

export const drawNode = (ctx: CanvasRenderingContext2D, node: Node) => {
  ctx.save();
  ctx.translate(node.x + node.width / 2, node.y + node.height / 2);
  ctx.rotate(((node.rotation || 0) * Math.PI) / 180);

  const minWidth = Math.max(node.width, 180);  // 최소 너비를 180으로 설정
  const minHeight = Math.max(node.height, 100);  // 최소 높이를 100으로 설정

  ctx.fillStyle = node.backgroundColor || '#ffffff';
  drawRoundedRect(ctx, -minWidth / 2, -minHeight / 2, minWidth, minHeight, 0);
  ctx.fill();

  ctx.strokeStyle = node.selected ? '#05f' : (node.borderColor || '#05f');
  ctx.lineWidth = node.borderColor === '#fd5500' ? 4 : 1;
  ctx.stroke();

  // 텍스트 그리기
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const padd = 10;  // 왼쪽 패딩
  // const leftX = -minWidth / 2 + padd;  // 왼쪽 정렬 시작 위치
  const leftX = 0;  // 왼쪽 정렬 시작 위치

  // 위쪽 텍스트
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#f07500';
  ctx.fillText(node.text1 || '', leftX, -minHeight / 2 + 18);

  // 가운데 텍스트 (더 크게)
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'black'; // 약간 더 진한 색상
  ctx.fillText(node.text2 || '', leftX, 0);

  // 아래쪽 텍스트
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(node.text3 || '', leftX, minHeight / 2 - 18);

  if (node.selected) {
    drawResizeHandles(ctx, node, minWidth, minHeight);
  }

  ctx.restore();
};

export const drawResizeHandles = (
  ctx: CanvasRenderingContext2D,
  node: Node,
  width: number,
  height: number
) => {
  const handleSize = 10;
  const positions = [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: -width / 2, y: height / 2 },
    { x: width / 2, y: height / 2 },
  ];

  positions.forEach((pos) => {
    ctx.fillStyle = '#05f';
    ctx.fillRect(
      pos.x - handleSize / 2,
      pos.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
};

export const getLinkPnt = (node: Node, side: Link['fromSide'] | Link['toSide']) => {
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height / 2 };
    case 'topRight':
      return { x: node.x + node.width, y: node.y };
    case 'topLeft':
      return { x: node.x, y: node.y };
    case 'bottomRight':
      return { x: node.x + node.width, y: node.y + node.height };
    case 'bottomLeft':
      return { x: node.x, y: node.y + node.height };
    default:
      return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }
};

export const drawLinks = (
  ctx: CanvasRenderingContext2D,
  nodes: Node[]
) => {
  nodes.forEach((node) => {
    node.links.forEach((link) => {
      const fromPnt = getLinkPnt(node, link.fromSide);
      const toNode = nodes.find(n => n.id === Number(link.id));
      if (toNode) {
        let fromSide = link.fromSide;
        let toSide = link.toSide;

        if (link.lineStyle === 'curved') {
          fromSide = 'topRight';
          toSide = 'topLeft';
        }

        const fromPnt = getLinkPnt(node, fromSide);
        const toPnt = getLinkPnt(toNode, toSide);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fromPnt.x, fromPnt.y);
        
        if (link.lineStyle === 'dashed') {
          ctx.setLineDash([7, 6]);
          ctx.lineWidth = 7;
          ctx.lineTo(toPnt.x, toPnt.y);
          ctx.strokeStyle = '#333';
          ctx.stroke();
        } else if (link.lineStyle === 'curved') {
          ctx.strokeStyle = '#05f';
          ctx.lineWidth = 6;
          const angle = drawCurvedLine(ctx, fromPnt.x, fromPnt.y, toPnt.x, toPnt.y);

          // 화살표 그리기
          const headlen = 22;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(toPnt.x, toPnt.y);
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle - Math.PI / 6), toPnt.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle + Math.PI / 6), toPnt.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = '#acf';
          ctx.fill();          
        } else {
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
          ctx.lineTo(toPnt.x, toPnt.y);
          ctx.strokeStyle = '#333';
          ctx.stroke();

          // 화살표 그리기
          const angle = Math.atan2(toPnt.y - fromPnt.y, toPnt.x - fromPnt.x);
          const headlen = 10;
          ctx.beginPath();
          ctx.moveTo(toPnt.x, toPnt.y);
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle - Math.PI / 6), toPnt.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle + Math.PI / 6), toPnt.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#333';
          ctx.fill();
        }

        // 연결선 텍스트 그리기
        if (link.text) {
          let textX, textY;
          
          if (link.lineStyle === 'curved') {
            const textOffset = 15; // 텍스트와 선 사이의 거리
            const topPnt = getCurvedLinkTopPnt(fromPnt.x, fromPnt.y, toPnt.x, toPnt.y);
            textX = topPnt.x;
            textY = topPnt.y + textOffset; // 최상위점 바로 아래에 위치
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
          } else {
            const textOffset = 10; // 텍스트와 선 사이의 거리
            const {x, y, textAlign, textBaseline} = getSolidLinkTopPnt(fromPnt.x, fromPnt.y, toPnt.x, toPnt.y, textOffset);
            textX = x || 0;
            textY = y || 0;
            ctx.textAlign = textAlign || 'center';
            ctx.textBaseline = textBaseline || 'middle';
          }

          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#000';
          ctx.fillText(link.text, textX, textY);
        }

        ctx.restore();
      }
    });
  });
};

// 곡선 그리기 함수 추가
function drawCurvedLine(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  const midX1 = startX + (endX - startX) * 1 / 12;
  const midY1 = (startY + endY) / 2;
  const midX2 = startX + (endX - startX) * 11 / 12;
  const midY2 = (startY + endY) / 2;
  const controlX1 = midX1;
  const controlY1 = midY1 - 90;
  const controlX2 = midX2;
  const controlY2 = midY2 - 90;

  ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
  ctx.stroke();

// 베지어 곡선의 끝점에서의 접선 각도 계산
  const t = 1; // 곡선의 점
  const dx = 3 * (1 - t) * (1 - t) * (controlX1 - startX) + 6 * (1 - t) * t * (controlX2 - controlX1) + 3 * t * t * (endX - controlX2);
  const dy = 3 * (1 - t) * (1 - t) * (controlY1 - startY) + 6 * (1 - t) * t * (controlY2 - controlY1) + 3 * t * t * (endY - controlY2);
  const angle = Math.atan2(dy, dx);

  return angle;
}

export const drawSelectionArea = (ctx: CanvasRenderingContext2D, area: SelectionArea) => {
  const { startX, startY, endX, endY } = area;
  const width = endX - startX;
  const height = endY - startY;

  ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, startY, width, height);
  ctx.setLineDash([]);

  // ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
  // ctx.fillRect(startX, startY, width, height);
};


export const drawDraws = (
  ctx: CanvasRenderingContext2D,
  drawActions: DrawAction[]
) => {
  if (ctx) {
    // 그리기 작업 다시 그리기
    ctx.save();
    drawActions.forEach(action => {
      action.pnts.forEach(pnt => {
        if (action.type === 'draw') {
          if (action.pnts.length < 2) return;

          ctx.strokeStyle = action.color || '#000';
          ctx.lineWidth = action.lineWidth;
          ctx.lineCap = 'square';
          ctx.lineJoin = 'miter';

          ctx.beginPath();
          ctx.moveTo(action.pnts[0].x, action.pnts[0].y);
      
          for (let i = 1; i < action.pnts.length; i++) {
            const currentPnt = action.pnts[i];
            const previousPnt = action.pnts[i - 1];
            const midPnt = {x: (previousPnt.x + currentPnt.x) / 2, y: (previousPnt.y + currentPnt.y) / 2};
      
            ctx.quadraticCurveTo(previousPnt.x, previousPnt.y, midPnt.x, midPnt.y);
          }    
          // const lastPnt = action.pnts[action.pnts.length - 1];
          // ctx.lineTo(lastPnt.x, lastPnt.y);    
          ctx.stroke();          

        } else if (action.type === 'erase') {
          ctx.beginPath();
          ctx.moveTo(action.pnts[0].x, action.pnts[0].y);
          ctx.lineTo(pnt.x, pnt.y);
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = action.lineWidth;
          ctx.lineCap = 'square';
          ctx.lineJoin = 'miter';
          ctx.stroke();
        }
      });
    });
    ctx.restore();
  }
};

export const redrawCanvas = (
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  draws: DrawAction[],
  selectionArea: SelectionArea | null
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 그리기 그리기
  // 지우개 영역 교안 복구를 위해서 맨위에 와야함
  drawDraws(ctx, draws);

  // 노드 그리기
  nodes.forEach(node => {
    drawNode(ctx, node);
  });

  // 연결선 먼저 그리기 (z-index가 가장 낮도록)
  drawLinks(ctx, nodes);

  // 선택 영역 그리기
  if (selectionArea) {
    drawSelectionArea(ctx, selectionArea);
  }
};

export const calculateNodeSize = (ctx: CanvasRenderingContext2D, node: Node) => {
  const padding = 20;  // 좌우 패딩 합계

  ctx.font = 'bold 14px Arial';
  const text1Width = ctx.measureText(node.text1 || '').width;
  
  ctx.font = 'bold 24px Arial';
  const text2Width = ctx.measureText(node.text2 || '').width;

  ctx.font = 'bold 14px Arial';
  const text3Width = ctx.measureText(node.text3 || '').width;

  const textWidth = Math.max(text1Width, text2Width, text3Width);
  const width = Math.max(textWidth + padding, 180);  // 패딩 포함, 최소 너비 180px
  const height = 100;  // 최소 높이 100px

  return { width, height };
};

export const isNodeInSelectionArea = (node: Node, area: SelectionArea) => {
  if (!area) return false;
  const { startX, startY, endX, endY } = area;
  const left = Math.min(startX, endX);
  const right = Math.max(startX, endX);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  return node.x < right && node.x + node.width > left && node.y < bottom && node.y + node.height > top;
};

export const getCurvedLinkTopPnt = (startX: number, startY: number, endX: number, endY: number) => {
  const midX1 = startX + (endX - startX) * 1 / 12;
  const midX2 = startX + (endX - startX) * 11 / 12;
  const midY = (startY + endY) / 2;
  const controlY = midY - 90;

  // 베지어 곡선의 최상위점 계산 (t = 0.5에서의 점)
  const t = 0.5;
  const x = Math.pow(1-t, 3) * startX + 3 * Math.pow(1-t, 2) * t * midX1 + 3 * (1-t) * Math.pow(t, 2) * midX2 + Math.pow(t, 3) * endX;
  const y = Math.pow(1-t, 3) * startY + 3 * Math.pow(1-t, 2) * t * controlY + 3 * (1-t) * Math.pow(t, 2) * controlY + Math.pow(t, 3) * endY;

  return { x, y };
};

export const getSolidLinkTopPnt = (startX: number, startY: number, endX: number, endY: number, offset: number) => {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const angle = Math.atan2(endY - startY, endX - startX);
  const isVertical = Math.abs(angle) > Math.PI / 4 && Math.abs(angle) < (3 * Math.PI) / 4;
              
  let x, y, textAlign: CanvasTextAlign, textBaseline: CanvasTextBaseline;

  if (isVertical) {
    x = midX + (angle > 0 ? offset : -offset);
    y = midY;
    textAlign = angle > 0 ? 'left' : 'right';
    textBaseline = 'middle';
  } else {
    x = midX;
    y = midY + (Math.abs(angle) < Math.PI / 2 ? -offset : offset);
    textAlign = 'center';
    textBaseline = Math.abs(angle) < Math.PI / 2 ? 'bottom' : 'top';
  }

  return {x, y, textAlign, textBaseline};
};  

export const addNode = (
  nodes: Node[],
  canvasWidth: number,
  canvasHeight: number,
  lastNodePos: { x: number; y: number },
  maxZIndex: number
): { newNode: Node; newMaxZIndex: number; newLastNodePos: { x: number; y: number } } => {
  const nodeWidth = 180;
  const nodeHeight = 100;
  const gridSize = 20;
  const MIN_GAP = 100; // 노드 간 최소 간격

  const newId = Date.now();
  const newZIndex = maxZIndex + 1;

  const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;

  // 기존 노드들의 x, y 좌표 수집
  const existXPoss = nodes.map(node => node.x);
  const existYPoss = nodes.map(node => node.y);

  // 가장 가까운 정렬된 위치 찾기 (최소 간격 고려)
  const findAlignedPos = (positions: number[], value: number, size: number) => {
    const sortedPoss = Array.from(new Set(positions)).sort((a, b) => a - b);

    // 먼저 같은 위치에 정렬을 시도
    const samePos = sortedPoss.find(pos => Math.abs(pos - value) < gridSize);
    if (samePos !== undefined) return samePos;

    // 같은 위치가 없으면 최소 간격을 고려하여 새 위치 찾기
    for (let i = 0; i < sortedPoss.length - 1; i++) {
      const currentPos = sortedPoss[i];
      const nextPos = sortedPoss[i + 1] || canvasWidth;
      
      if (value > currentPos + size + MIN_GAP && value < nextPos - MIN_GAP) {
        return nextPos;
      }
      
      if (value < currentPos - MIN_GAP) {
        return currentPos;
      }
    }

    // 적절한 위치를 찾지 못한 경우, 마지막 노드 뒤에 배치
    return snapToGrid(Math.max(...sortedPoss, 0) + size + MIN_GAP);
  };

  let newX = snapToGrid(lastNodePos.x + nodeWidth + MIN_GAP);
  let newY = snapToGrid(lastNodePos.y);

  // 가장 가까운 정렬된 x, y 위치 찾기
  newX = findAlignedPos(existXPoss, newX, nodeWidth);
  newY = findAlignedPos(existYPoss, newY, nodeHeight);

  // 캔버스 경계 체크 및 조정
  if (newX + nodeWidth > canvasWidth) {
    newX = findAlignedPos(existXPoss, 0, nodeWidth);
    newY = snapToGrid(Math.max(...existYPoss) + nodeHeight + MIN_GAP);
  }

  if (newY + nodeHeight > canvasHeight) {
    newY = snapToGrid(0);
    newX = snapToGrid(Math.max(...existXPoss) + nodeWidth + MIN_GAP);
  }

  // 겹침 방지
  const isOverlapp = (x: number, y: number) => {
    return nodes.some(node => 
      x < node.x + node.width + MIN_GAP && x + nodeWidth + MIN_GAP > node.x && 
      y < node.y + node.height + MIN_GAP && y + nodeHeight + MIN_GAP > node.y
    );
  };

  while (isOverlapp(newX, newY)) {
    newX = findAlignedPos(existXPoss, newX + nodeWidth + MIN_GAP, nodeWidth);
    if (newX + nodeWidth > canvasWidth) {
      newX = findAlignedPos(existXPoss, 0, nodeWidth);
      newY = findAlignedPos(existYPoss, newY + nodeHeight + MIN_GAP, nodeHeight);
      if (newY + nodeHeight > canvasHeight) {
        newY = snapToGrid(0);
      }
    }
  }

  const newNode: Node = {
    id: newId,
    x: newX,
    y: newY,
    text1: '',
    text2: '',
    text3: '',
    width: nodeWidth,
    height: nodeHeight,
    selected: false,
    links: [],
    zIndex: newZIndex,
    backgroundColor: '#FFF',
    borderColor: '#05f'
  };

  return { newNode, newMaxZIndex: newZIndex, newLastNodePos: { x: newX, y: newY } };
};

export const getClickedNodeAndHandle = (nodes: Node[], x: number, y: number) => {
  const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

  for (const node of sortedNodes) {
    if (node.selected) {
      const rotateHandleX = node.x + node.width / 2;
      const rotateHandleY = node.y - 20;
      if (Math.sqrt((x - rotateHandleX) ** 2 + (y - rotateHandleY) ** 2) <= 5) {
        return { node, handle: 'rotate' };
      }

      const handleSize = 10;
      const handles = [
        { x: node.x, y: node.y, dir: 'nw' },
        { x: node.x + node.width, y: node.y, dir: 'ne' },
        { x: node.x, y: node.y + node.height, dir: 'sw' },
        { x: node.x + node.width, y: node.y + node.height, dir: 'se' },
      ];

      for (const handle of handles) {
        if (x >= handle.x - handleSize / 2 && x <= handle.x + handleSize / 2 && y >= handle.y - handleSize / 2 && y <= handle.y + handleSize / 2) {
          return { node, handle: handle.dir };
        }
      }
    }

    if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
      return { node, handle: null };
    }
  }
  return { node: null, handle: null };
};

export const getClickedNode = (nodes: Node[], x: number, y: number) => {
  const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);
  return sortedNodes.find((node) => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) || null;
};

export const getNodeSide = (node: Node, x: number, y: number): 'top' | 'right' | 'bottom' | 'left' => {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const dx = x - centerX;
  const dy = y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
};

export const getTouchPos = (
  canvas: HTMLCanvasElement, 
  touch: React.Touch
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const x = (touch.clientX - rect.left) * scaleX;
  const y = (touch.clientY - rect.top) * scaleY;

  return { x, y };
};

export const isDragSignificant = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy) > 5; // 5픽셀 이상 이동했을 때 드래그로 간주
};

export const deleteSelectedNodes = (nodes: Node[]): Node[] => {
  const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id);
  return nodes.filter(node => !node.selected).map(node => ({
    ...node,
    links: node.links.filter(link => !selectedNodeIds.includes(Number(link.id)))
  }));
};

export const startEdit = (
  node: Node,
  setEditNode: React.Dispatch<React.SetStateAction<Node | null>>,
  setEditText: React.Dispatch<React.SetStateAction<{ text1: string; text2: string; text3: string; }>>
) => {
  setEditNode(node);
  setEditText({ text1: node.text1, text2: node.text2, text3: node.text3 });
};

export const finishEdit = (
  editNode: Node | null,
  editText: { text1: string; text2: string; text3: string; },
  canvas: HTMLCanvasElement | null,
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEditNode: React.Dispatch<React.SetStateAction<Node | null>>,
  setEditText: React.Dispatch<React.SetStateAction<{ text1: string; text2: string; text3: string; }>>
) => {
  if (editNode && canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { width, height } = calculateNodeSize(ctx, { ...editNode, ...editText });
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === editNode.id) {
          return { ...node, ...editText, width, height };
        }
        return node;
      }));
    }
  }
  setEditNode(null);
  setEditText({ text1: '', text2: '', text3: '' });
};

export const cancelEdit = (
  setEditNode: React.Dispatch<React.SetStateAction<Node | null>>,
  setEditText: React.Dispatch<React.SetStateAction<{ text1: string; text2: string; text3: string; }>>
) => {
  setEditNode(null);
  setEditText({ text1: '', text2: '', text3: '' });
};

export const finishEditLink = (
  editLink: EditLink | null,
  linkText: string,
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEditLink: React.Dispatch<React.SetStateAction<EditLink | null>>,
  setLinkText: React.Dispatch<React.SetStateAction<string>>
): void => {
  if (editLink) {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === editLink.startNode.id) {
        const updatedLinks = node.links.map(link => {
          if (link.id === editLink.endNode.id.toString()) {
            return { ...link, text: linkText };
          }
          return link;
        });
        return { ...node, links: updatedLinks };
      }
      return node;
    }));
    setEditLink(null);
    setLinkText('');
  }
};
export const alignNodesV = (nodes: Node[]): Node[] => {
  const selectedNodes = nodes.filter((node) => node.selected);
  if (selectedNodes.length < 2) return nodes;
  const leftmostNode = selectedNodes.reduce((left, node) => (node.x < left.x ? node : left));
  const baseY = leftmostNode.y;
  return nodes.map((node) => {
    if (node.selected) {
      return { ...node, y: baseY };
    }
    return node;
  });
};

export const alignNodesH = (nodes: Node[]): Node[] => {
  const selectedNodes = nodes.filter((node) => node.selected);
  if (selectedNodes.length < 2) return nodes;
  const topmostNode = selectedNodes.reduce((top, node) => (node.y < top.y ? node : top));
  const baseX = topmostNode.x;
  return nodes.map((node) => {
    if (node.selected) {
      return { ...node, x: baseX };
    }
    return node;
  });
};

export const saveCanvas = async (
  title: string,
  nodes: Node[],
  drawActions: DrawAction[],
  author: string | null,
  email: string | null,
  setShowSavePopup: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  setShowSavePopup(false);
  const filename = `${new Date().toLocaleString('ko-KR', { 
    timeZone: 'Asia/Seoul', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',fractionalSecondDigits: 3, hour12: false
  }).replace(/[^\d]/g, '')}.json`;
  const filedir = `lessons`;
  const filePath = `/${filedir}/${filename}`;
  const data = { filedir, filename, title, nodes, draws: drawActions };

  try {
    // 파일 저장
    const response = await fetch('/api/save-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // 데이터베이스에 저장
      const formData = new FormData();
      formData.append('author', author || '');
      formData.append('email', email || '');
      formData.append('title', title);
      formData.append('path', filePath);
      const result = await createLesson(formData);

      if (result.message === 'Created Lesson.') {
        toast.success(`교안 "${title}"이(가) 성공적으로 저장되었습니다.`);
      } else {
        throw new Error(result.message);
      }
    } else {
      throw new Error('교안 파일 저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('교안 저장 중 오류 발생:', error);
    toast.error('교안 저장에 실패했습니다. 다시 시도해 주세요.');
  }
};

 