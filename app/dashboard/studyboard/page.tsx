'use client';

import React, { useRef, useEffect, useState } from 'react';
import ToolButton from './components/ToolButton';

// Tool 타입 정의 추가
type Tool =
  | 'move'
  | 'draw'
  | 'addNode'
  | 'connect'
  | 'erase'
  | 'clear'
  | 'alignVertical'
  | 'alignHorizontal'
  | 'select';

interface Node {
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

interface DraggingState {
  node: Node;
  offsetX: number;
  offsetY: number;
}

const StudyBoard = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 1,
      x: 100,
      y: 100,
      text: 'Environmentalists',
      width: 150,
      height: 50,
      connections: [],
      zIndex: 1,
    },
    {
      id: 2,
      x: 400,
      y: 250,
      text: 'are',
      width: 50,
      height: 50,
      connections: [],
      zIndex: 2,
    },
    {
      id: 3,
      x: 700,
      y: 100,
      text: 'getting more worried',
      width: 200,
      height: 50,
      connections: [],
      zIndex: 3,
    },
  ]);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('move');
  const [penColor, setPenColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState<string>('4');
  const [eraserPosition, setEraserPosition] = useState({
    x: 0,
    y: 0,
    visible: false,
  });
  const [chalkTexture, setChalkTexture] = useState<HTMLImageElement | null>(
    null
  );
  const [eraserSize, setEraserSize] = useState(100);
  const [resizing, setResizing] = useState<{
    node: Node;
    direction: string;
  } | null>(null);
  const [rotating, setRotating] = useState<{
    node: Node;
    startAngle: number;
  } | null>(null);
  const [selectionArea, setSelectionArea] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [connecting, setConnecting] = useState<{
    id: number;
    side: 'top' | 'right' | 'bottom' | 'left';
  } | null>(null);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('solid');

  useEffect(() => {
    const textureImage = new Image();
    textureImage.src = '/chalk-texture.jpg';
    textureImage.onload = () => setChalkTexture(textureImage);
  }, []);

  useEffect(() => {
    const resizeCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;

      if (container && canvas && drawingCanvas) {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        drawingCanvas.width = width;
        drawingCanvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          redrawCanvas(ctx);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const animate = () => {
          redrawCanvas(ctx);
          requestAnimationFrame(animate);
        };
        animate();
      }
    }
  }, [nodes, selectionArea]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateNodeSizes = () => {
      const updatedNodes = nodes.map((node) => {
        if (ctx) {
          ctx.font = 'bold 18px Arial';
          const textWidth = ctx.measureText(node.text).width;
          const width = Math.max(textWidth + 40, 120);
          const height = 80;
          return { ...node, width, height };
        }
        return node;
      });
      setNodes(updatedNodes);
    };

    updateNodeSizes();
  }, []);

  const redrawCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const sortedNodes = [...nodes].sort((a, b) => a.zIndex - b.zIndex);

    const drawRoundedRect = (
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
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const drawNode = (node: Node) => {
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

      const minWidth = Math.max(
        node.width,
        ctx.measureText(node.text).width + 40
      );
      const minHeight = Math.max(node.height, lines.length * lineHeight + 20);

      ctx.fillStyle = node.backgroundColor || '#ffffff';
      drawRoundedRect(-minWidth / 2, -minHeight / 2, minWidth, minHeight, 5);
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

    const getConnectionPoint = (
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

    const drawConnections = (ctx: CanvasRenderingContext2D) => {
      sortedNodes.forEach((node) => {
        node.connections.forEach((connection) => {
          const targetNode = sortedNodes.find((n) => n.id === connection.id);
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

    sortedNodes.forEach(drawNode);
    drawConnections(ctx);

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

  const drawResizeHandles = (
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

  const drawRotationHandle = (
    ctx: CanvasRenderingContext2D,
    node: Node,
    height: number
  ) => {
    ctx.beginPath();
    ctx.arc(0, -height / 2 - 20, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF4500';
    ctx.fill();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'draw' || tool === 'erase') {
      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    } else if (tool === 'move') {
      const { node, handle } = getClickedNodeAndHandle(x, y);
      if (node) {
        if (handle === 'rotate') {
          setRotating({
            node,
            startAngle: Math.atan2(
              y - (node.y + node.height / 2),
              x - (node.x + node.width / 2)
            ),
          });
        } else if (handle) {
          setResizing({ node, direction: handle });
        } else {
          setDragging({
            node,
            offsetX: x - node.x,
            offsetY: y - node.y,
          });
        }
        setNodes(nodes.map((n) => ({ ...n, selected: n.id === node.id })));
      } else {
        setSelectionArea({ startX: x, startY: y, endX: x, endY: y });
        setNodes(nodes.map((n) => ({ ...n, selected: false })));
      }
    } else if (tool === 'connect') {
      const clickedNode = getClickedNode(x, y);
      if (clickedNode) {
        const side = getNodeSide(clickedNode, x, y);
        if (connecting === null) {
          setConnecting({ id: clickedNode.id, side });
        } else {
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id === connecting.id) {
                return {
                  ...node,
                  connections: [
                    ...node.connections,
                    {
                      id: clickedNode.id,
                      fromSide: connecting.side,
                      toSide: side,
                      lineStyle: lineStyle,
                    },
                  ],
                };
              }
              return node;
            })
          );
          setConnecting(null);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        if (tool === 'draw') {
          ctx.strokeStyle = penColor;
          ctx.lineWidth = Number(lineWidth);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        } else if (tool === 'erase') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(255,255,255,1)';
          ctx.lineWidth = eraserSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    } else if (dragging) {
      const newNodes = nodes.map((node) => {
        if (node.id === dragging.node.id) {
          return {
            ...node,
            x: x - dragging.offsetX,
            y: y - dragging.offsetY,
          };
        }
        return node;
      });
      setNodes(newNodes);
    } else if (resizing) {
      const newNodes = nodes.map((node) => {
        if (node.id === resizing.node.id) {
          let newWidth = node.width;
          let newHeight = node.height;
          let newX = node.x;
          let newY = node.y;

          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.font = 'bold 18px Arial';
            const minWidth = Math.max(
              120,
              ctx.measureText(node.text).width + 40
            );
            const minHeight = 80;

            if (resizing.direction.includes('e'))
              newWidth = Math.max(minWidth, x - node.x);
            if (resizing.direction.includes('w')) {
              newWidth = Math.max(minWidth, node.x + node.width - x);
              newX = Math.min(x, node.x + node.width - minWidth);
            }
            if (resizing.direction.includes('s'))
              newHeight = Math.max(minHeight, y - node.y);
            if (resizing.direction.includes('n')) {
              newHeight = Math.max(minHeight, node.y + node.height - y);
              newY = Math.min(y, node.y + node.height - minHeight);
            }
          }

          return {
            ...node,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
        }
        return node;
      });
      setNodes(newNodes);
    } else if (rotating) {
      const centerX = rotating.node.x + rotating.node.width / 2;
      const centerY = rotating.node.y + rotating.node.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX) - rotating.startAngle;
      const newRotation = ((angle * 180) / Math.PI + 360) % 360;

      setNodes(
        nodes.map((node) =>
          node.id === rotating.node.id
            ? { ...node, rotation: newRotation }
            : node
        )
      );
    }

    if (selectionArea) {
      setSelectionArea({
        ...selectionArea,
        endX: x,
        endY: y,
      });
    }

    if (tool === 'erase') {
      setEraserPosition({ x, y, visible: true });
    } else {
      setEraserPosition({ x: 0, y: 0, visible: false });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDragging(null);
    setResizing(null);
    setRotating(null);

    if (selectionArea) {
      const selectedNodes = nodes.map((node) => ({
        ...node,
        selected: isNodeInSelectionArea(node, selectionArea),
      }));
      setNodes(selectedNodes);

      // 선택된 노드들의 텍스트를 읽어주는 기능 추가
      const selectedTexts = selectedNodes
        .filter((node) => node.selected)
        .map((node) => node.text);
      if (selectedTexts.length > 0) {
        const textToRead = selectedTexts.join(', ');
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'ko-KR'; // 한국어로 설정
        window.speechSynthesis.speak(utterance);
      }

      setSelectionArea(null);
    }
  };

  const getClickedNodeAndHandle = (x: number, y: number) => {
    const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

    for (const node of sortedNodes) {
      if (node.selected) {
        const rotateHandleX = node.x + node.width / 2;
        const rotateHandleY = node.y - 20;
        if (
          Math.sqrt((x - rotateHandleX) ** 2 + (y - rotateHandleY) ** 2) <= 5
        ) {
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

      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        return { node, handle: null };
      }
    }
    return { node: null, handle: null };
  };

  const isNodeInSelectionArea = (
    node: Node,
    area: { startX: number; startY: number; endX: number; endY: number }
  ) => {
    const { startX, startY, endX, endY } = area;
    const left = Math.min(startX, endX);
    const right = Math.max(startX, endX);
    const top = Math.min(startY, endY);
    const bottom = Math.max(startY, endY);

    return (
      node.x < right &&
      node.x + node.width > left &&
      node.y < bottom &&
      node.y + node.height > top
    );
  };

  const getClickedNode = (x: number, y: number) => {
    const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

    return (
      sortedNodes.find(
        (node) =>
          x >= node.x &&
          x <= node.x + node.width &&
          y >= node.y &&
          y <= node.y + node.height
      ) || null
    );
  };

  const getNodeSide = (
    node: Node,
    x: number,
    y: number
  ): 'top' | 'right' | 'bottom' | 'left' => {
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

  const addNode = () => {
    const newId = Date.now();
    const newZIndex = maxZIndex + 1;
    const newNode: Node = {
      id: newId,
      x: 100,
      y: 100,
      text: '새 노드',
      width: 120,
      height: 80,
      selected: false,
      connections: [],
      zIndex: newZIndex,
      backgroundColor: '#FFFFFF',
    };

    setNodes((prevNodes) => [
      ...prevNodes.map((node) => ({ ...node, selected: false })),
      newNode,
    ]);
    setNextNodeId(newId + 1);
    setMaxZIndex(newZIndex);
  };

  const handleToolChange = (newTool: Tool) => {
    console.log(`도구 변경: ${newTool}`);
    if (tool === 'move' && newTool !== 'move') {
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({ ...node, selected: false }))
      );
    }
    setTool(newTool);
    if (newTool === 'addNode') {
      setPenColor('#FFFFFF');
      addNode();
      setTool('move');
    } else if (newTool === 'draw') {
      setPenColor('#000000');
    }
  };

  const alignNodesVertically = () => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length < 2) return;

    const leftmostNode = selectedNodes.reduce((left, node) =>
      node.x < left.x ? node : left
    );

    const baseY = leftmostNode.y;

    const newNodes = nodes.map((node) => {
      if (node.selected) {
        return {
          ...node,
          y: baseY,
        };
      }
      return node;
    });

    setNodes(newNodes);
  };

  const alignNodesHorizontally = () => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length < 2) return;

    const topmostNode = selectedNodes.reduce((top, node) =>
      node.y < top.y ? node : top
    );

    const baseX = topmostNode.x;

    const newNodes = nodes.map((node) => {
      if (node.selected) {
        return {
          ...node,
          x: baseX,
        };
      }
      return node;
    });

    setNodes(newNodes);
  };

  const handleColorChange = (color: string) => {
    setPenColor(color);
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.selected ? { ...node, backgroundColor: color } : node
      )
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'hidden',
          margin: '2px',
          borderRadius: '10px',
          backgroundColor: 'white',
          boxShadow: '2px 2px 2px rgba(0,0,0,0.1)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        <canvas
          ref={drawingCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {eraserPosition.visible && (
          <div
            style={{
              position: 'absolute',
              left: eraserPosition.x - eraserSize / 2,
              top: eraserPosition.y - eraserSize / 2,
              width: eraserSize,
              height: eraserSize,
              border: '1px solid black',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        )}
      </div>
      <div
        style={{
          padding: '20px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          gap: '10px',
        }}
      >
        <ToolButton
          tool="move"
          icon="/icon-move.svg"
          onClick={() => handleToolChange('move')}
          currentTool={tool}
        />
        <ToolButton
          tool="draw"
          icon="/icon-draw.svg"
          onClick={() => handleToolChange('draw')}
          currentTool={tool}
        />
        <ToolButton
          tool="addNode"
          icon="/icon-addnode.svg"
          onClick={() => handleToolChange('addNode')}
          currentTool={tool}
        />
        <ToolButton
          tool="connect"
          icon="/icon-connect.svg"
          onClick={() => handleToolChange('connect')}
          currentTool={tool}
        />
        <ToolButton
          tool="erase"
          icon="/icon-erase.svg"
          onClick={() => handleToolChange('erase')}
          currentTool={tool}
        />
        <ToolButton
          tool="clear"
          icon="/icon-clear.svg"
          onClick={() => {
            const canvas = drawingCanvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                redrawCanvas(ctx);
              }
            }
          }}
          currentTool={tool}
        />
        <ToolButton
          tool="alignVertical"
          icon="/icon-alignv.svg"
          onClick={alignNodesVertically}
          currentTool={tool}
        />
        <ToolButton
          tool="alignHorizontal"
          icon="/icon-alignh.svg"
          onClick={alignNodesHorizontally}
          currentTool={tool}
        />
        <div
          style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}
        >
          <label style={{ marginRight: '10px' }}>색상</label>
          <select
            value={penColor}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              fontSize: '14px',
            }}
          >
            <option value="#FFFF00">노랑</option>
            <option value="#FFD700">오렌지</option>
            <option value="#DD1100">빨강</option>
            <option value="#0000FF">파랑</option>
            <option value="#000000">검정</option>
            <option value="#FFFFFF">흰색</option>
          </select>
        </div>
        <div
          style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}
        >
          <label style={{ marginRight: '10px' }}>굵기</label>
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(e.target.value)}
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              fontSize: '14px',
            }}
          >
            <option value="1">얇게</option>
            <option value="2">보통</option>
            <option value="4">굵게</option>
            <option value="8">매우 굵게</option>
          </select>
        </div>
        <div
          style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}
        >
          <label style={{ marginRight: '10px' }}>지우개 크기</label>
          <select
            value={eraserSize.toString()}
            onChange={(e) => setEraserSize(Number(e.target.value))}
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              fontSize: '14px',
            }}
          >
            <option value="50">작게</option>
            <option value="100">보통</option>
            <option value="200">크게</option>
          </select>
        </div>
        <div
          style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}
        >
          <label style={{ marginRight: '10px' }}>연결선 스타일</label>
          <select
            value={lineStyle}
            onChange={(e) => setLineStyle(e.target.value as 'solid' | 'dashed')}
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              fontSize: '14px',
            }}
          >
            <option value="solid">실선</option>
            <option value="dashed">점선</option>
          </select>
        </div>
      </div>
    </div>
  );
};
export default StudyBoard;
