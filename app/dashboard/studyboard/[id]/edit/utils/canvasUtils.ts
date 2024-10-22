import { Node, SelectionArea, DrawingAction, Link } from '../types';

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
  
  const padding = 10;  // 왼쪽 패딩
  // const leftX = -minWidth / 2 + padding;  // 왼쪽 정렬 시작 위치
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

export const getLinkPoint = (node: Node, side: Link['fromSide'] | Link['toSide']) => {
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
      const fromPoint = getLinkPoint(node, link.fromSide);
      const toNode = nodes.find(n => n.id === Number(link.id));
      if (toNode) {
        let fromSide = link.fromSide;
        let toSide = link.toSide;

        if (link.lineStyle === 'curved') {
          fromSide = 'topRight';
          toSide = 'topLeft';
        }

        const fromPoint = getLinkPoint(node, fromSide);
        const toPoint = getLinkPoint(toNode, toSide);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        
        if (link.lineStyle === 'dashed') {
          ctx.setLineDash([7, 6]);
          ctx.lineWidth = 7;
          ctx.lineTo(toPoint.x, toPoint.y);
          ctx.strokeStyle = '#333';
          ctx.stroke();
        } else if (link.lineStyle === 'curved') {
          ctx.strokeStyle = '#05f';
          ctx.lineWidth = 6;
          const angle = drawCurvedLine(ctx, fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);

          // 화살표 그리기
          const headlen = 22;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(toPoint.x, toPoint.y);
          ctx.lineTo(toPoint.x - headlen * Math.cos(angle - Math.PI / 6), toPoint.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPoint.x - headlen * Math.cos(angle + Math.PI / 6), toPoint.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = '#acf';
          ctx.fill();          
        } else {
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
          ctx.lineTo(toPoint.x, toPoint.y);
          ctx.strokeStyle = '#333';
          ctx.stroke();

          // 화살표 그리기
          const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
          const headlen = 10;
          ctx.beginPath();
          ctx.moveTo(toPoint.x, toPoint.y);
          ctx.lineTo(toPoint.x - headlen * Math.cos(angle - Math.PI / 6), toPoint.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPoint.x - headlen * Math.cos(angle + Math.PI / 6), toPoint.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#333';
          ctx.fill();
        }

        // 연결선 텍스트 그리기
        if (link.text) {
          let textX, textY;
          
          if (link.lineStyle === 'curved') {
            const textOffset = 15; // 텍스트와 선 사이의 거리
            const topPoint = getCurvedLinkTopPoint(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);
            textX = topPoint.x;
            textY = topPoint.y + textOffset; // 최상위점 바로 아래에 위치
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
          } else {
            const textOffset = 10; // 텍스트와 선 사이의 거리
            const {x, y, textAlign, textBaseline} = getSolidLinkTopPoint(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y, textOffset);
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
  const t = 1; // 곡선의 끝점
  const dx = 3 * (1 - t) * (1 - t) * (controlX1 - startX) + 
             6 * (1 - t) * t * (controlX2 - controlX1) + 
             3 * t * t * (endX - controlX2);
  const dy = 3 * (1 - t) * (1 - t) * (controlY1 - startY) + 
             6 * (1 - t) * t * (controlY2 - controlY1) + 
             3 * t * t * (endY - controlY2);
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


export const drawDrawings = (
  ctx: CanvasRenderingContext2D,
  drawingActions: DrawingAction[]
) => {
  if (ctx) {
    // 그리기 작업 다시 그리기
    ctx.save();
    drawingActions.forEach(action => {
      action.points.forEach(point => {
        if (action.type === 'draw') {
          if (action.points.length < 2) return;

          ctx.strokeStyle = action.color || '#000';
          ctx.lineWidth = action.lineWidth;
          ctx.lineCap = 'square';
          ctx.lineJoin = 'miter';

          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
      
          for (let i = 1; i < action.points.length; i++) {
            const currentPoint = action.points[i];
            const previousPoint = action.points[i - 1];
            const midPoint = {x: (previousPoint.x + currentPoint.x) / 2, y: (previousPoint.y + currentPoint.y) / 2};
      
            ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, midPoint.x, midPoint.y);
          }    
          // const lastPoint = action.points[action.points.length - 1];
          // ctx.lineTo(lastPoint.x, lastPoint.y);    
          ctx.stroke();          

        } else if (action.type === 'erase') {
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          ctx.lineTo(point.x, point.y);
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
  drawings: DrawingAction[],
  selectionArea: SelectionArea | null
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 그리기 그리기
  // 지우개 영역 교안 복구를 위해서 맨위에 와야함
  drawDrawings(ctx, drawings);

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

export const getCurvedLinkTopPoint = (startX: number, startY: number, endX: number, endY: number) => {
  const midX1 = startX + (endX - startX) * 1 / 12;
  const midX2 = startX + (endX - startX) * 11 / 12;
  const midY = (startY + endY) / 2;
  const controlY = midY - 90;

  // 베지어 곡선의 최상위점 계산 (t = 0.5에서의 점)
  const t = 0.5;
  const x = Math.pow(1-t, 3) * startX + 
            3 * Math.pow(1-t, 2) * t * midX1 + 
            3 * (1-t) * Math.pow(t, 2) * midX2 + 
            Math.pow(t, 3) * endX;
  const y = Math.pow(1-t, 3) * startY + 
            3 * Math.pow(1-t, 2) * t * controlY + 
            3 * (1-t) * Math.pow(t, 2) * controlY + 
            Math.pow(t, 3) * endY;

  return { x, y };
};

export const getSolidLinkTopPoint = (startX: number, startY: number, endX: number, endY: number, offset: number) => {
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
