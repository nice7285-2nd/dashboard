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

  const minWidth = Math.max(node.width, 180);
  const minHeight = Math.max(node.height, 100);

  if (node.nodeShape === 'ellipse') {
    // 타원 그리기
    ctx.beginPath();
    ctx.ellipse(0, 0, minWidth/2, minHeight/2, 0, 0, 2 * Math.PI);
    ctx.setLineDash([6, 4]); // 점선 설정
    ctx.strokeStyle = node.selected ? '#05f' : (node.borderColor || '#05f');
    ctx.lineWidth = node.borderColor === '#FD5500FF' ? 2 : 2;
    ctx.stroke();
  } else {
    // 기존 사각형 그리기
    ctx.fillStyle = node.backgroundColor || '#ffffff';
    drawRoundedRect(ctx, -minWidth / 2, -minHeight / 2, minWidth, minHeight, 0);
    ctx.fill();
    ctx.strokeStyle = node.selected ? '#05f' : (node.borderColor || '#05f');
    ctx.lineWidth = node.borderColor === '#FD5500FF' ? 4 : 1;
    ctx.stroke();
  }

  // 텍스트 정렬 설정
  ctx.textAlign = (node.textAlign as CanvasTextAlign) || 'center';
  ctx.textBaseline = 'middle';
  
  // 텍스트 x 좌표 계산
  const textX = node.textAlign === 'left' ? 
    -minWidth / 2 + 15 :  // 왼쪽 정렬일 때 (15px 패딩)
    0;                    // 중앙 정렬일 때

  // 위쪽 텍스트
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#f07500';
  ctx.fillText(node.text1 || '', textX, -minHeight / 2 + 18);

  // 가운데 텍스트
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(node.text2 || '', textX, 0);

  // 아래쪽 텍스트
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(node.text3 || '', textX, minHeight / 2 - 18);

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
    // 코너 핸들러
    { x: -width / 2, y: -height / 2 },  // nw
    { x: width / 2, y: -height / 2 },   // ne
    { x: -width / 2, y: height / 2 },   // sw
    { x: width / 2, y: height / 2 },    // se
    // 상하좌우 핸들러 추가
    { x: 0, y: -height / 2 },           // n
    { x: 0, y: height / 2 },            // s
    { x: -width / 2, y: 0 },            // w
    { x: width / 2, y: 0 }              // e
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

// 최적의 연결점을 찾는 함수 추가
const getAddingLinkPoints = (fromNode: Node, toNode: Node, lineStyle: string) => {
  const fromCenter = {
    x: fromNode.x + fromNode.width / 2,
    y: fromNode.y + fromNode.height / 2
  };
  const toCenter = {
    x: toNode.x + toNode.width / 2,
    y: toNode.y + toNode.height / 2
  };

  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  let fromPnt = { x: fromNode.x + fromNode.width / 2, y: fromNode.y };  // 기본값 설정
  let toPnt = { x: toNode.x + toNode.width / 2, y: toNode.y };         // 기본값 설정

  if (lineStyle === 'Describing') {
    // Describing은 항상 상단-상단 연결
    if (dx > 0) {
      // 오른쪽으로 갈 때
      fromPnt = { x: fromNode.x + fromNode.width, y: fromNode.y };
      toPnt = { x: toNode.x, y: toNode.y };
    } else {
      // 왼쪽으로 갈 때
      fromPnt = { x: fromNode.x, y: fromNode.y };
      toPnt = { x: toNode.x + toNode.width, y: toNode.y };
    }
  } else {
    // Describing 이외 선은 항상 정확한 수평 또는 수직으로만 연결
    if (fromNode.y + fromNode.height < toNode.y) {
      fromPnt = { x: toNode.x + toNode.width / 2, y: fromNode.y + fromNode.height };
      toPnt = { x: toNode.x + toNode.width / 2, y: toNode.y };
    } else if (fromNode.x > toNode.x + toNode.width) {
      fromPnt = { x: fromNode.x, y: toNode.y + toNode.height / 2 };
      toPnt = { x: toNode.x + toNode.width, y: toNode.y + toNode.height / 2 };
    } else if (fromNode.y > toNode.y + toNode.height) {
      fromPnt = { x: toNode.x + toNode.width / 2, y: fromNode.y };
      toPnt = { x: toNode.x + toNode.width / 2, y: toNode.y + toNode.height };
    } else if (fromNode.x + fromNode.width < toNode.x) {
      fromPnt = { x: fromNode.x + fromNode.width, y: toNode.y + toNode.height / 2 };
      toPnt = { x: toNode.x, y: toNode.y + toNode.height / 2 };
    }
  }

  return { fromPnt, toPnt };
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

        if (link.lineStyle === 'Describing') {
          fromSide = 'topRight';
          toSide = 'topLeft';
        }

        // const fromPnt = getLinkPnt(node, fromSide);
        // const toPnt = getLinkPnt(toNode, toSide);

        const { fromPnt, toPnt } = getAddingLinkPoints(node, toNode, link.lineStyle);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fromPnt.x, fromPnt.y);
        
        if (link.lineStyle === 'verbing') {
          ctx.setLineDash([7, 6]);
          ctx.lineWidth = 7;
          ctx.lineTo(toPnt.x, toPnt.y);
          ctx.strokeStyle = '#000';
          ctx.stroke();
        } else if (link.lineStyle === 'Describing' || link.lineStyle === 'Engaging') {
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
        } else if (link.lineStyle === 'Adding') {
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
          ctx.lineTo(toPnt.x, toPnt.y);
          ctx.strokeStyle = '#000';
          ctx.stroke();

          // 화살표 그리기
          const angle = Math.atan2(toPnt.y - fromPnt.y, toPnt.x - fromPnt.x);
          const headlen = 10;
          ctx.beginPath();
          ctx.moveTo(toPnt.x, toPnt.y);
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle - Math.PI / 6), toPnt.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle + Math.PI / 6), toPnt.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#000';
          ctx.fill();
        } else if (link.lineStyle === 'equal') {
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
          
          // 각도 계산
          const angle = Math.atan2(toPnt.y - fromPnt.y, toPnt.x - fromPnt.x);
          const gap = 4; // 평행선 사이의 간격

          ctx.strokeStyle = '#9be';

          // 첫 번째 선
          ctx.beginPath();
          ctx.moveTo(fromPnt.x + gap * Math.sin(angle), fromPnt.y - gap * Math.cos(angle));
          ctx.lineTo(toPnt.x + gap * Math.sin(angle), toPnt.y - gap * Math.cos(angle));
          ctx.stroke();
          
          // 두 번째 선
          ctx.beginPath();
          ctx.moveTo(fromPnt.x - gap * Math.sin(angle), fromPnt.y + gap * Math.cos(angle));
          ctx.lineTo(toPnt.x - gap * Math.sin(angle), toPnt.y + gap * Math.cos(angle));
          ctx.stroke();
        } else if (link.lineStyle === 'targeting') {
          ctx.setLineDash([]);
          ctx.lineWidth = 6;
          
          // 화살표 크기
          const headlen = 20;
          const angle = Math.atan2(toPnt.y - fromPnt.y, toPnt.x - fromPnt.x);
          
          // 라인의 끝점을 화살표 크기만큼 조정 (약간 더 연장)
          const endX = toPnt.x - (headlen - 7) * Math.cos(angle);
          const endY = toPnt.y - (headlen - 7) * Math.sin(angle);
          
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = '#FF4500';
          ctx.stroke();

          // 화살표 그리기
          ctx.beginPath();
          ctx.moveTo(toPnt.x, toPnt.y);
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle - Math.PI / 6), toPnt.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPnt.x - headlen * Math.cos(angle + Math.PI / 6), toPnt.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#FF4500';
          ctx.fill();
        }

        // 연결선 텍스트 그리기
        if (link.text) {
          let textX, textY;
          
          if (link.lineStyle === 'Describing' || link.lineStyle === 'Engaging') {
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

  const headlen = 22;
  
  const midX1 = startX + (endX - startX) * 1 / 12;
  const midY1 = (startY + endY) / 2;
  const midX2 = startX + (endX - startX) * 11 / 12;
  const midY2 = (startY + endY) / 2;
  const controlX1 = midX1;
  const controlY1 = midY1 - 90;
  const controlX2 = midX2;
  const controlY2 = midY2 - 90;

  // 곡선의 마지막 접선 방향 계산
  const t = 1; // 곡선의 끝점에서의 t 값
  const angle = Math.atan2(
    (controlY2 - endY) * 3 * (1-t)^2 + (endY - controlY2) * 3 * t^2,
    (controlX2 - endX) * 3 * (1-t)^2 + (endX - controlX2) * 3 * t^2
  );

  const adjustedEndX = endX - (headlen - 6) * Math.cos(angle);
  const adjustedEndY = endY - (headlen - 6) * Math.sin(angle);

  ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, adjustedEndX, adjustedEndY);
  ctx.stroke();

  return angle;
}

export const drawSelectionArea = (ctx: CanvasRenderingContext2D, area: SelectionArea) => {
  const { startX, startY, endX, endY } = area;
  
  // 시작점과 끝점을 비교하여 올바른 좌표 계산
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  // 반투명한 파란색 경
  ctx.fillStyle = 'rgba(66, 153, 225, 0.2)';  // 밝은 파란색, 투명도 0.2
  ctx.fillRect(left, top, width, height);

  // 실선 테두리
  ctx.strokeStyle = 'rgb(66, 153, 225)';  // 테두리는 불투명
  ctx.lineWidth = 1;
  ctx.setLineDash([]);  // 실선으로 설정
  ctx.strokeRect(left, top, width, height);
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
          // destination-out 사용하여 비트맵 완전히 지우기
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(pnt.x, pnt.y, action.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();

          // 지우기 작업 후 다시 기본 모드로 복귀
          ctx.globalCompositeOperation = 'source-over';          
        }
      });
    });
    ctx.restore();
  }
};

// 분리된 그리기 함수들
export const redrawNodesAndLinks = (ctx: CanvasRenderingContext2D, nodes: Node[], selectionArea: SelectionArea | null) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 노드 그리기
  [...nodes]
  .sort((a, b) => a.zIndex - b.zIndex)
  .forEach(node => {
    drawNode(ctx, node);
  });

  // 연결선 먼저 그리기 (z-index가 가장 낮도록)
  drawLinks(ctx, nodes);

  // 선택 영역 그리기
  if (selectionArea) {
    drawSelectionArea(ctx, selectionArea);
  }
};

export const redrawDrawActions = (ctx: CanvasRenderingContext2D, actions: DrawAction[]) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 그리기 그리기
  // 지우개 영역 교안 복구를 위해서 맨위에 와야함
  drawDraws(ctx, actions);
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
  
  // 선택 영역의 좌상단과 우하단 좌표 계산
  const left = Math.min(startX, endX);
  const right = Math.max(startX, endX);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  // 노드가 선택 영역 안에 완전히 포함되어 있는지 확인
  return (
    node.x >= left &&
    node.x + node.width <= right &&
    node.y >= top &&
    node.y + node.height <= bottom
  );
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
  maxZIndex: number,
  nodeShape: string,
  nodeBorderColor: string
): { newNode: Node | null; newMaxZIndex: number } => {
  let nodeWidth = 180;
  let nodeHeight = 100;
  
  if (nodeShape === 'ellipse') {
    nodeWidth = 180;
    nodeHeight = 100;
  } else if (nodeShape === 'group') {
    nodeWidth = 360;
    nodeHeight = 200;
  }

  const gridSize = 1;
  const MIN_GAP = 40; // 노드 간 최소 간격

  const newId = Date.now();
  const newZIndex = maxZIndex + 1;
  // const newZIndex = nodeShape === 'single' ? maxZIndex + 1 : 0;

  const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;

  // 기존 노드들의 x, y 좌표 수집
  const existXPoss = nodes.filter(node => node.nodeShape === 'single' || node.nodeShape === 'group').map(node => node.x);
  const existYPoss = nodes.filter(node => node.nodeShape === 'single' || node.nodeShape === 'group').map(node => node.y);

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
      
      if (value > currentPos && value < nextPos) {
        return nextPos;
      }
      
      if (value < currentPos - MIN_GAP) {
        return currentPos;
      }
    }

    // 적절한 위치를 찾지 못한 경우, 마지막 노드 뒤에 배치
    return snapToGrid(Math.max(...sortedPoss, 0) + size + MIN_GAP);
  };

  let newNode: Node = {
    id: newId,
    x: 0,
    y: 0,
    text1: '',
    text2: '',
    text3: '',
    textAlign: '',
    width: nodeWidth,
    height: nodeHeight,
    selected: false,
    links: [],
    zIndex: newZIndex,
    backgroundColor: nodeShape === 'single' ? '#FFF' : '#90EE90',
    borderColor: nodeBorderColor,
    nodeShape: nodeShape
  };

  const lastNode: Node | null = nodes.length > 0 ? nodes[nodes.length - 1] : newNode;

  let newX = snapToGrid(lastNode.x + lastNode.width + MIN_GAP);
  let newY = snapToGrid(lastNode.y);

  // 가장 가까운 정렬된 x, y 위치 찾기
  newX = findAlignedPos(existXPoss, newX, lastNode.width);
  newY = findAlignedPos(existYPoss, newY, lastNode.height);

  // 캔버스 경계 체크 및 조정
  if (newX + nodeWidth > canvasWidth) {
    newX = findAlignedPos(existXPoss, 0, lastNode.width);
    newY = findAlignedPos(existYPoss, newY + nodeHeight + MIN_GAP, nodeHeight);
  }

  // if (newY + nodeHeight > canvasHeight) {
  //   newY = snapToGrid(1);
  // }

  // 겹침 방지
  const isOverlapp = (x: number, y: number) => {
    return nodes.some(node => 
      x < node.x + node.width + MIN_GAP && x + nodeWidth + MIN_GAP > node.x && 
      y < node.y + node.height + MIN_GAP && y + nodeHeight + MIN_GAP > node.y
    );
  };

  let repeat = false;
  while (isOverlapp(newX, newY) && !repeat) {
    newX = newX + nodeWidth + MIN_GAP;
    console.log('newX', newX);
    console.log('newY', newY);
    if (newX + nodeWidth > canvasWidth) {
      newX = findAlignedPos(existXPoss, 0, nodeWidth);
      newY = newY + nodeHeight + MIN_GAP;
      // if (newY + nodeHeight > canvasHeight) {
      //   if (!repeat) {
      //     newY = snapToGrid(1);
      //     repeat = true;
      //   } else {
      //     newX = -1;
      //     break;
      //   }
      // }
    }
  }

  if (newX === -1) {
    return { newNode: null, newMaxZIndex: newZIndex };
  }

  newNode.x = newX
  newNode.y = newY

  return { newNode, newMaxZIndex: newZIndex };
};

export const getClickedNodeAndHandle = (nodes: Node[], x: number, y: number) => {
  const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

  for (const node of sortedNodes) {
    if (node.selected) {
      // 회전 핸들러 체크
      const rotateHandleX = node.x + node.width / 2;
      const rotateHandleY = node.y - 20;
      if (Math.sqrt((x - rotateHandleX) ** 2 + (y - rotateHandleY) ** 2) <= 5) {
        return { node, handle: 'rotate' };
      }

      const handleSize = 10;
      const handles = [
        // 코너 핸들러
        { x: node.x, y: node.y, dir: 'nw' },
        { x: node.x + node.width, y: node.y, dir: 'ne' },
        { x: node.x, y: node.y + node.height, dir: 'sw' },
        { x: node.x + node.width, y: node.y + node.height, dir: 'se' },
        // 상하좌우 핸들러 추가
        { x: node.x + node.width / 2, y: node.y, dir: 'n' },
        { x: node.x + node.width / 2, y: node.y + node.height, dir: 's' },
        { x: node.x, y: node.y + node.height / 2, dir: 'w' },
        { x: node.x + node.width, y: node.y + node.height / 2, dir: 'e' }
      ];

      for (const handle of handles) {
        if (
          x >= handle.x - handleSize / 2 && 
          x <= handle.x + handleSize / 2 && 
          y >= handle.y - handleSize / 2 && 
          y <= handle.y + handleSize / 2
        ) {
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
  setShowSavePopup: (show: boolean) => void,
  width: number,
  height: number
) => {
  setShowSavePopup(false);
  
  if (!author || !email) {
    toast.error('사자 정보가 습니다.');
    return;
  }

  // 저장 중임을 알리는 toast
  const toastId = toast.loading('교안을 저장하는 중입니다...', {
    position: "bottom-right",
  });

  try {
    const lessonData = {
      nodes,
      draws: drawActions,
      width,
      height
    };

    const filename = `${new Date().toLocaleString('ko-KR', { 
      timeZone: 'Asia/Seoul', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',fractionalSecondDigits: 3, hour12: false
    }).replace(/[^\d]/g, '')}.json`;
    const filedir = `lessons`;
    const filePath = `/${filedir}/${filename}`;
    
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(lessonData)], { type: 'application/json' }), filename);
    formData.append('path', filedir);

    const response = await fetch('/api/save-lesson', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const dbFormData = new FormData();
      dbFormData.append('author', author);
      dbFormData.append('email', email);
      dbFormData.append('title', title);
      dbFormData.append('path', filePath);
      const result = await createLesson(dbFormData);

      if (result.message === 'Created Lesson.') {
        // 성공 시 toast 업데이트
        toast.update(toastId, {
          render: `교안 "${title}"이(가) 성공적으로 저장되었습니다.`,
          type: "success",
          isLoading: false,
          autoClose: 1000,
        });
      } else {
        throw new Error(result.message);
      }
    } else {
      throw new Error('교안 저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('교안 저장 중 오류 발생:', error);
    // 실패 시 toast 업데이트
    toast.update(toastId, {
      render: '교안 저장에 실패했습니다. 다시 시도해 주세요.',
      type: "error",
      isLoading: false,
      autoClose: 1000,
    });
  }
};

 
