'use client';

import React, { useRef, useEffect, useState } from 'react';

const StudyBoard = () => {
  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([
    { id: 1, x: 100, y: 100, text: 'Environmentalists' },
    { id: 2, x: 400, y: 250, text: 'are' },
    { id: 3, x: 700, y: 100, text: 'getting more worried' },
  ]);
  const [dragging, setDragging] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('draw');
  const [penColor, setPenColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState<string>('2');
  const [eraserPosition, setEraserPosition] = useState({
    x: 0,
    y: 0,
    visible: false,
  });

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
        redrawCanvas(ctx);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const updateNodeSizes = () => {
      const updatedNodes = nodes.map((node) => {
        ctx.font = 'bold 18px Arial';
        const textWidth = ctx.measureText(node.text).width;
        const width = Math.max(textWidth + 40, 120); // 최소 너비 120px
        const height = 80; // 높이를 80px로 유지
        return { ...node, width, height };
      });
      setNodes(updatedNodes);
    };

    updateNodeSizes();
  }, []);

  const redrawCanvas = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const drawRoundedRect = (x, y, width, height, radius) => {
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

    const drawNode = (node) => {
      ctx.save();

      // 흰색 바탕
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(node.x, node.y, node.width, node.height, 5);
      ctx.fill();

      // 밝은 파란색 테두리
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        node.text,
        node.x + node.width / 2,
        node.y + node.height / 2
      );

      ctx.restore();
    };

    const drawRightAngleArrow = (fromX, fromY, toX, toY) => {
      const midX = (fromX + toX) / 2;
      const cornerRadius = 5;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      if (fromX < toX) {
        // 오른쪽으로 향하는 화살표
        ctx.lineTo(midX - cornerRadius, fromY);
        ctx.quadraticCurveTo(
          midX,
          fromY,
          midX,
          fromY + Math.sign(toY - fromY) * cornerRadius
        );
        ctx.lineTo(midX, toY - Math.sign(toY - fromY) * cornerRadius);
        ctx.quadraticCurveTo(midX, toY, midX + cornerRadius, toY);
      } else {
        // 왼쪽으로 향하는 화살표
        ctx.lineTo(midX + cornerRadius, fromY);
        ctx.quadraticCurveTo(
          midX,
          fromY,
          midX,
          fromY + Math.sign(toY - fromY) * cornerRadius
        );
        ctx.lineTo(midX, toY - Math.sign(toY - fromY) * cornerRadius);
        ctx.quadraticCurveTo(midX, toY, midX - cornerRadius, toY);
      }

      ctx.lineTo(toX, toY);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = Number(lineWidth);
      ctx.stroke();

      // 화살표 머리 그리기
      const headlen = 10;
      let angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headlen * Math.cos(angle - Math.PI / 6),
        toY - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - headlen * Math.cos(angle + Math.PI / 6),
        toY - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = '#666';
      ctx.fill();
    };

    nodes.forEach(drawNode);

    // 화살표 그리기 로직
    if (nodes.length >= 2) {
      drawRightAngleArrow(
        nodes[0].x + nodes[0].width,
        nodes[0].y + nodes[0].height / 2,
        nodes[1].x,
        nodes[1].y + nodes[1].height / 2
      );
    }
    if (nodes.length >= 3) {
      drawRightAngleArrow(
        nodes[1].x + nodes[1].width,
        nodes[1].y + nodes[1].height / 2,
        nodes[2].x,
        nodes[2].y + nodes[2].height / 2
      );
    }
  };

  const handleMouseDown = (e) => {
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'draw' || tool === 'erase') {
      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'move') {
      const draggedNode = nodes.find(
        (node) =>
          x >= node.x &&
          x <= node.x + node.width &&
          y >= node.y &&
          y <= node.y + node.height
      );
      if (draggedNode) {
        setDragging({
          node: draggedNode,
          offsetX: x - draggedNode.x,
          offsetY: y - draggedNode.y,
        });
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      const ctx = canvas.getContext('2d');
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'draw' ? penColor : '#ffffff';
      ctx.lineWidth = Number(lineWidth);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else if (dragging) {
      const newNodes = nodes.map((node) =>
        node.id === dragging.node.id
          ? { ...node, x: x - dragging.offsetX, y: y - dragging.offsetY }
          : node
      );
      setNodes(newNodes);
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
  };

  const ToolButton = ({ tool: buttonTool, icon, onClick }) => (
    <button
      onClick={onClick}
      style={{
        marginBottom: '0px',
        width: '60px',
        height: '60px',
        backgroundColor: tool === buttonTool ? '#e0e0e0' : 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseDown={(e) =>
        (e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)')
      }
      onMouseUp={(e) =>
        (e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)')
      }
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
    </button>
  );

  const handleLineWidthChange = (value: string) => {
    setLineWidth(value);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        // backgroundColor: '#f0f0f0',
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
          // border: '1px solid #ccc',
          boxShadow: '2px 2px 2px rgba(0,0,0,0.1)',
          maxHeight: 'calc(100vh - 150px)',
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
              left: eraserPosition.x - Number(lineWidth) / 2,
              top: eraserPosition.y - Number(lineWidth) / 2,
              width: Number(lineWidth),
              height: Number(lineWidth),
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
          margin: '2px',
          padding: '20px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          zIndex: 10,
          // border: '1px solid #ccc',
          boxShadow: '2px 2px 2px rgba(0,0,0,0.1)',
        }}
      >
        <ToolButton
          tool="move"
          icon={<path d="M5 9l3 3-3 3m6-3h9M3 5v14M21 5v14" />}
          onClick={() => setTool('move')}
        />
        <ToolButton
          tool="draw"
          icon={
            <path d="M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586" />
          }
          onClick={() => setTool('draw')}
        />
        <ToolButton
          tool="erase"
          icon={<path d="M20 20H7L3 16l6-6 8 8M6 14l4 4" />}
          onClick={() => setTool('erase')}
        />
        <ToolButton
          tool="clear"
          icon={
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6" />
          }
          onClick={() => {
            const canvas = drawingCanvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              redrawCanvas(canvasRef.current.getContext('2d'));
            }
          }}
        />
        <div
          style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}
        >
          <label style={{ marginRight: '10px' }}>색상</label>
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            style={{
              width: '30px',
              height: '30px',
              border: 'none',
              cursor: 'pointer',
            }}
          />
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
      </div>
    </div>
  );
};

export default StudyBoard;
