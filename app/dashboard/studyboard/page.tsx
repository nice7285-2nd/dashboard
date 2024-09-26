'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
}

// dragging 상태의 타입을 정의합니다
interface DraggingState {
  node: Node;
  offsetX: number;
  offsetY: number;
}

interface ToolButtonProps {
  tool: string; // 또는 tool의 실제 타입에 맞게 지정하세요
  icon: React.ReactNode;
  onClick: () => void;
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
    },
    { id: 2, x: 400, y: 250, text: 'are', width: 50, height: 50 },
    {
      id: 3,
      x: 700,
      y: 100,
      text: 'getting more worried',
      width: 200,
      height: 50,
    },
  ]);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('draw');
  const [penColor, setPenColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState<string>('2');
  const [eraserPosition, setEraserPosition] = useState({
    x: 0,
    y: 0,
    visible: false,
  });
  const [chalkTexture, setChalkTexture] = useState<HTMLImageElement | null>(
    null
  );

  useEffect(() => {
    // 분필 텍스처 이미지 로드
    const textureImage = new Image();
    textureImage.src = '/chalk-texture.jpg'; // 분필 텍스처 이미지 경로
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
    if (!canvas) return; // 캔버스가 null인 경우 함수 종료
    const ctx = canvas.getContext('2d');

    const updateNodeSizes = () => {
      const updatedNodes = nodes.map((node) => {
        if (ctx) {
          // ctx가 null이 아닌지 확인
          ctx.font = 'bold 18px Arial';
          const textWidth = ctx.measureText(node.text).width;
          const width = Math.max(textWidth + 40, 120); // 최소 너비 120px
          const height = 80; // 높이를 80px로 유지
          return { ...node, width, height };
        }
        return node; // ctx가 null인 경우 원래 노드를 반환
      });
      setNodes(updatedNodes);
    };

    updateNodeSizes();
  }, []);

  const redrawCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

      // 흰색 바탕
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(
        node.x ?? 0,
        node.y ?? 0,
        node.width ?? 0,
        node.height ?? 0,
        5
      );
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

    const drawRightAngleArrow = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number
    ) => {
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
      // ctx.lineWidth = Number(lineWidth);
      ctx.lineWidth = 2;
      ctx.stroke();

      // 화살표 머리 그리기
      const headlen = 10;
      let angle;

      if (fromX < toX) {
        // 오른쪽으로 향하는 화살표
        angle = 0;
      } else {
        // 왼쪽으로 향하는 화살표
        angle = Math.PI;
      }

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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return; // 캔버스가 null인 경우 함수 종료
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
        if (tool === 'draw' && chalkTexture) {
          // 분필 효과 적용
          ctx.save();
          ctx.strokeStyle =
            ctx.createPattern(chalkTexture, 'repeat') || penColor;
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = Number(lineWidth) * 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // 분필 가루 효과
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
              x + (Math.random() - 0.5) * 10,
              y + (Math.random() - 0.5) * 10,
              Math.random() * 2,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = penColor;
            ctx.globalAlpha = Math.random() * 0.3;
            ctx.fill();
          }

          ctx.restore();
        } else {
          // 기존 그리기 또는 지우개 로직
          ctx.strokeStyle = tool === 'draw' ? penColor : '#ffffff';
          ctx.lineWidth = Number(lineWidth);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
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

  const ToolButton: React.FC<ToolButtonProps> = ({
    tool: buttonTool,
    icon,
    onClick,
  }) => (
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
          // maxHeight: 'calc(100vh - 150px)',
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
          // margin: '2px',
          padding: '20px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // backgroundColor: 'white',
          zIndex: 10,
          // border: '1px solid #ccc',
          // boxShadow: '2px 2px 2px rgba(0,0,0,0.1)',
          gap: '10px',
        }}
      >
        <ToolButton
          tool="move"
          icon={
            <>
              <path
                d="M17 11V9.27308C17 8.75533 17.2588 8.27183 17.6896 7.98463L17.7388 7.95181C18.2041 7.64162 18.806 7.62565 19.287 7.91073V7.91073C19.729 8.17263 20 8.64824 20 9.16196L20 13C20 14.6997 19.4699 16.2756 18.5661 17.5714C17.1204 19.6439 14.7186 21 12 21C9.28145 21 6.8796 19.6439 5.43394 17.5714C4.53009 16.2756 4.00001 14.6997 4.00001 13L4.00001 12.2117C4 11.438 4.44632 10.7336 5.14599 10.4032V10.4032C5.6867 10.1479 6.3133 10.1479 6.85401 10.4032V10.4032C7.55368 10.7336 8 11.438 8.00001 12.2117L8.00001 13"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M8 12V5.80278C8 5.30125 8.25065 4.8329 8.66795 4.5547V4.5547C9.1718 4.2188 9.8282 4.2188 10.3321 4.5547V4.5547C10.7493 4.8329 11 5.30125 11 5.80278V11"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14 11V5.80278C14 5.30125 14.2507 4.8329 14.6679 4.5547V4.5547C15.1718 4.2188 15.8282 4.2188 16.3321 4.5547V4.5547C16.7493 4.8329 17 5.30125 17 5.80278V9"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11 6V4.80278C11 4.30125 11.2507 3.8329 11.6679 3.5547V3.5547C12.1718 3.2188 12.8282 3.2188 13.3321 3.5547V3.5547C13.7493 3.8329 14 4.30125 14 4.80278V6"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </>
          }
          onClick={() => setTool('move')}
        />
        <ToolButton
          tool="draw"
          icon={
            <>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18.4324 4C18.2266 4 18.0227 4.04055 17.8325 4.11933C17.6423 4.19811 17.4695 4.31358 17.3239 4.45914L5.25659 16.5265L4.42524 19.5748L7.47353 18.7434L19.5409 6.67608C19.6864 6.53051 19.8019 6.3577 19.8807 6.16751C19.9595 5.97732 20 5.77348 20 5.56761C20 5.36175 19.9595 5.1579 19.8807 4.96771C19.8019 4.77752 19.6864 4.60471 19.5409 4.45914C19.3953 4.31358 19.2225 4.19811 19.0323 4.11933C18.8421 4.04055 18.6383 4 18.4324 4ZM17.0671 2.27157C17.5 2.09228 17.9639 2 18.4324 2C18.9009 2 19.3648 2.09228 19.7977 2.27157C20.2305 2.45086 20.6238 2.71365 20.9551 3.04493C21.2864 3.37621 21.5492 3.7695 21.7285 4.20235C21.9077 4.63519 22 5.09911 22 5.56761C22 6.03611 21.9077 6.50003 21.7285 6.93288C21.5492 7.36572 21.2864 7.75901 20.9551 8.09029L8.69996 20.3454C8.57691 20.4685 8.42387 20.5573 8.25597 20.6031L3.26314 21.9648C2.91693 22.0592 2.54667 21.9609 2.29292 21.7071C2.03917 21.4534 1.94084 21.0831 2.03526 20.7369L3.39694 15.7441C3.44273 15.5762 3.53154 15.4231 3.6546 15.3001L15.9097 3.04493C16.241 2.71365 16.6343 2.45086 17.0671 2.27157Z"
                fill="#000000"
                stroke-width="0.2"
              />
            </>
          }
          onClick={() => setTool('draw')}
        />
        <ToolButton
          tool="erase"
          icon={
            <>
              <path
                d="M5.50506 11.4096L6.03539 11.9399L5.50506 11.4096ZM3 14.9522H2.25H3ZM9.04776 21V21.75V21ZM11.4096 5.50506L10.8792 4.97473L11.4096 5.50506ZM13.241 17.8444C13.5339 18.1373 14.0088 18.1373 14.3017 17.8444C14.5946 17.5515 14.5946 17.0766 14.3017 16.7837L13.241 17.8444ZM7.21629 9.69832C6.9234 9.40543 6.44852 9.40543 6.15563 9.69832C5.86274 9.99122 5.86274 10.4661 6.15563 10.759L7.21629 9.69832ZM17.9646 12.0601L12.0601 17.9646L13.1208 19.0253L19.0253 13.1208L17.9646 12.0601ZM6.03539 11.9399L11.9399 6.03539L10.8792 4.97473L4.97473 10.8792L6.03539 11.9399ZM6.03539 17.9646C5.18538 17.1146 4.60235 16.5293 4.22253 16.0315C3.85592 15.551 3.75 15.2411 3.75 14.9522H2.25C2.25 15.701 2.56159 16.3274 3.03 16.9414C3.48521 17.538 4.1547 18.2052 4.97473 19.0253L6.03539 17.9646ZM4.97473 10.8792C4.1547 11.6993 3.48521 12.3665 3.03 12.9631C2.56159 13.577 2.25 14.2035 2.25 14.9522H3.75C3.75 14.6633 3.85592 14.3535 4.22253 13.873C4.60235 13.3752 5.18538 12.7899 6.03539 11.9399L4.97473 10.8792ZM12.0601 17.9646C11.2101 18.8146 10.6248 19.3977 10.127 19.7775C9.64651 20.1441 9.33665 20.25 9.04776 20.25V21.75C9.79649 21.75 10.423 21.4384 11.0369 20.97C11.6335 20.5148 12.3008 19.8453 13.1208 19.0253L12.0601 17.9646ZM4.97473 19.0253C5.79476 19.8453 6.46201 20.5148 7.05863 20.97C7.67256 21.4384 8.29902 21.75 9.04776 21.75V20.25C8.75886 20.25 8.449 20.1441 7.9685 19.7775C7.47069 19.3977 6.88541 18.8146 6.03539 17.9646L4.97473 19.0253ZM17.9646 6.03539C18.8146 6.88541 19.3977 7.47069 19.7775 7.9685C20.1441 8.449 20.25 8.75886 20.25 9.04776H21.75C21.75 8.29902 21.4384 7.67256 20.97 7.05863C20.5148 6.46201 19.8453 5.79476 19.0253 4.97473L17.9646 6.03539ZM19.0253 13.1208C19.8453 12.3008 20.5148 11.6335 20.97 11.0369C21.4384 10.423 21.75 9.79649 21.75 9.04776H20.25C20.25 9.33665 20.1441 9.64651 19.7775 10.127C19.3977 10.6248 18.8146 11.2101 17.9646 12.0601L19.0253 13.1208ZM19.0253 4.97473C18.2052 4.1547 17.538 3.48521 16.9414 3.03C16.3274 2.56159 15.701 2.25 14.9522 2.25V3.75C15.2411 3.75 15.551 3.85592 16.0315 4.22253C16.5293 4.60235 17.1146 5.18538 17.9646 6.03539L19.0253 4.97473ZM11.9399 6.03539C12.7899 5.18538 13.3752 4.60235 13.873 4.22253C14.3535 3.85592 14.6633 3.75 14.9522 3.75V2.25C14.2035 2.25 13.577 2.56159 12.9631 3.03C12.3665 3.48521 11.6993 4.1547 10.8792 4.97473L11.9399 6.03539ZM14.3017 16.7837L7.21629 9.69832L6.15563 10.759L13.241 17.8444L14.3017 16.7837Z"
                fill="#1C274C"
                stroke-width="1"
              />
              <path
                d="M9 21H21"
                stroke="#1C274C"
                stroke-width="2"
                stroke-linecap="round"
              />
            </>
          }
          onClick={() => setTool('erase')}
        />
        <ToolButton
          tool="clear"
          icon={
            <path
              d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17"
              stroke="#000000"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          }
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
