import { Node, SelectionArea, DrawingAction } from '../types';

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

  const minWidth = Math.max(node.width, 200);  // 최소 너비를 200으로 설정
  const minHeight = Math.max(node.height, 120);  // 최소 높이를 120으로 설정

  ctx.fillStyle = node.backgroundColor || '#ffffff';
  drawRoundedRect(ctx, -minWidth / 2, -minHeight / 2, minWidth, minHeight, 5);
  ctx.fill();

  ctx.strokeStyle = node.selected ? '#FF4500' : '#4a90e2';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 텍스트 그리기
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  const padding = 10;  // 왼쪽 패딩
  const leftX = -minWidth / 2 + padding;  // 왼쪽 정렬 시작 위치

  // 위쪽 텍스트
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(node.text1 || '', leftX, -minHeight / 2 + 20);

  // 가운데 텍스트 (더 크게)
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#333333';  // 약간 더 진한 색상
  ctx.fillText(node.text2 || '', leftX, 0);

  // 아래쪽 텍스트
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(node.text3 || '', leftX, minHeight / 2 - 20);

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
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(
      pos.x - handleSize / 2,
      pos.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
};

export const getConnectionPoint = (
  node: Node,
  side: 'top' | 'right' | 'bottom' | 'left'
) => {
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height / 2 };
  }
};

export const drawConnections = (
  ctx: CanvasRenderingContext2D,
  nodes: Node[]
) => {
  nodes.forEach((node) => {
    node.connections.forEach((connection) => {
      const targetNode = nodes.find((n) => n.id === connection.id);
      if (targetNode) {
        const fromPoint = getConnectionPoint(node, connection.fromSide);
        const toPoint = getConnectionPoint(targetNode, connection.toSide);

        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        if (connection.lineStyle === 'dashed') {
          ctx.setLineDash([7, 3]);
          ctx.lineWidth = 6;
        } else {
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
        }
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.setLineDash([]);

        // 화살표 그리기
        if (connection.lineStyle !== 'dashed') {
          const angle = Math.atan2(
            toPoint.y - fromPoint.y,
            toPoint.x - fromPoint.x
          );
          const headlen = 10;
          ctx.beginPath();
          ctx.moveTo(toPoint.x, toPoint.y);
          ctx.lineTo(
            toPoint.x - headlen * Math.cos(angle - Math.PI / 6),
            toPoint.y - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            toPoint.x - headlen * Math.cos(angle + Math.PI / 6),
            toPoint.y - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = '#333';
          ctx.fill();
        }
      }
    });
  });
};

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


export const drawDrawings = (
  ctx: CanvasRenderingContext2D,
  drawingActions: DrawingAction[]
) => {
  if (ctx) {
    // 그리기 작업 다시 그리기
    drawingActions.forEach(action => {
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      action.points.forEach(point => {
    ctx.lineTo(point.x, point.y);
    });
    if (action.type === 'draw') {
      ctx.strokeStyle = action.color || '#000';
      ctx.lineWidth = action.lineWidth;
      ctx.stroke();
    } else if (action.type === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = action.lineWidth;
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      }
    });    
  }
};

export const redrawCanvas = (
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  drawings: DrawingAction[],
  selectionArea: SelectionArea | null
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 연결선 먼저 그리기 (z-index가 가장 낮도록)
  drawConnections(ctx, nodes);

  // 노드 그리기
  nodes.forEach(node => {
    drawNode(ctx, node);
  });

  // 그리기 그리기
  drawDrawings(ctx, drawings);

  // 선택 영역 그리기
  if (selectionArea) {
    drawSelectionArea(ctx, selectionArea);
  }
};

export const calculateNodeSize = (ctx: CanvasRenderingContext2D, node: Node) => {
  const padding = 20;  // 좌우 패딩 합계

  ctx.font = 'bold 16px Arial';
  const text1Width = ctx.measureText(node.text1 || '').width;
  const text3Width = ctx.measureText(node.text3 || '').width;
  
  ctx.font = 'bold 24px Arial';
  const text2Width = ctx.measureText(node.text2 || '').width;

  const textWidth = Math.max(text1Width, text2Width, text3Width);
  const width = Math.max(textWidth + padding, 200);  // 패딩 포함, 최소 너비 200px
  const height = Math.max(120, 100);  // 최소 높이 120px

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
