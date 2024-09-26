'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Node {
  text: string;
  x: number;
  y: number;
}

const StudySpeak = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const [nodes, setNodes] = useState<Node[]>([
    { text: 'Hello', x: 200, y: 100 },
    { text: 'World', x: 400, y: 200 },
    { text: 'Learning', x: 300, y: 300 },
    { text: 'English', x: 500, y: 400 },
    { text: 'Language', x: 100, y: 400 },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 20;
    const nodeSpacing = 100;
    let maxTextWidth = 0;
    let maxTextHeight = 0;

    // 텍스트 크기 측정 및 최대 크기 찾기
    ctx.font = '14px Arial';
    nodes.forEach((node) => {
      const metrics = ctx.measureText(node.text);
      maxTextWidth = Math.max(maxTextWidth, metrics.width);
      maxTextHeight = Math.max(maxTextHeight, 14); // 폰트 크기
    });

    // 노드 크기 계산
    const nodeWidth = maxTextWidth + padding * 2;
    const nodeHeight = maxTextHeight + padding * 2;

    // 캔버스 크기 계산
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    canvas.width = cols * (nodeWidth + nodeSpacing) + nodeSpacing;
    canvas.height = rows * (nodeHeight + nodeSpacing) + nodeSpacing;

    // 노드 위치 계산
    const updatedNodes = nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...node,
        x: col * (nodeWidth + nodeSpacing) + nodeSpacing + nodeWidth / 2,
        y: row * (nodeHeight + nodeSpacing) + nodeSpacing + nodeHeight / 2,
      };
    });
    setNodes(updatedNodes);

    const drawDiagram = () => {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = '14px Arial';

      // 노드 그리기
      updatedNodes.forEach((node) => {
        // 사각형 그리기
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          node.x - nodeWidth / 2,
          node.y - nodeHeight / 2,
          nodeWidth,
          nodeHeight
        );
        ctx.strokeRect(
          node.x - nodeWidth / 2,
          node.y - nodeHeight / 2,
          nodeWidth,
          nodeHeight
        );

        // 텍스트 그리기
        ctx.fillStyle = '#000000';
        ctx.fillText(
          node.text,
          node.x - ctx.measureText(node.text).width / 2,
          node.y + maxTextHeight / 2
        );
      });
    };

    drawDiagram();

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      updatedNodes.forEach((node) => {
        if (
          x >= node.x - nodeWidth / 2 &&
          x <= node.x + nodeWidth / 2 &&
          y >= node.y - nodeHeight / 2 &&
          y <= node.y + nodeHeight / 2
        ) {
          setSelectedNode(node.text);
        }
      });
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [nodes]);

  useEffect(() => {
    if (selectedNode) {
      const utterance = new SpeechSynthesisUtterance(selectedNode);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedNode]);

  return (
    <div>
      <h1>StudySpeak 다이어그램</h1>
      <canvas ref={canvasRef} style={{ border: '1px solid #000' }}></canvas>
      <p>선택된 노드: {selectedNode || '없음'}</p>
    </div>
  );
};

export default StudySpeak;
