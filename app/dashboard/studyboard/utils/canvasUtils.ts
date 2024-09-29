import { Node } from '../types';

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

  ctx.font = 'bold 18px Arial';
  const words = node.text.split(' ');
  const lines = [];
  let line = '';
  const maxWidth = node.width - 20;
  const lineHeight = 20;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const minWidth = Math.max(node.width, ctx.measureText(node.text).width + 40);
  const minHeight = Math.max(node.height, lines.length * lineHeight + 20);

  ctx.fillStyle = node.backgroundColor || '#ffffff';
  drawRoundedRect(ctx, -minWidth / 2, -minHeight / 2, minWidth, minHeight, 5);
  ctx.fill();

  ctx.strokeStyle = node.selected ? '#FF4500' : '#4a90e2';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let startY = (-lines.length * lineHeight) / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 0, startY);
    startY += lineHeight;
  }

  if (node.selected) {
    drawResizeHandles(ctx, node, minWidth, minHeight);
    drawRotationHandle(ctx, node, minHeight);
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

export const drawRotationHandle = (
  ctx: CanvasRenderingContext2D,
  node: Node,
  height: number
) => {
  ctx.beginPath();
  ctx.arc(0, -height / 2 - 20, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#FF4500';
  ctx.fill();
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

export const redrawCanvas = (
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  selectionArea: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const sortedNodes = [...nodes].sort((a, b) => a.zIndex - b.zIndex);

  sortedNodes.forEach(drawNode.bind(null, ctx));
  drawConnections(ctx, sortedNodes);

  if (selectionArea) {
    const { startX, startY, endX, endY } = selectionArea;
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.abs(endX - startX),
      Math.abs(endY - startY)
    );
    ctx.setLineDash([]);
  }
};
