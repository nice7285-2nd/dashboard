'use client';

import React, { useRef, useEffect, useState, KeyboardEvent, useCallback } from 'react';
import ToolButton from './components/ToolButton';
import { drawRoundedRect, drawNode, drawResizeHandles, drawRotationHandle, getConnectionPoint, drawConnections, redrawCanvas } from './utils/canvasUtils';
import { Tool, Node, DraggingState } from './types';

const StudyBoard = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('move');
  const [penColor, setPenColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState<string>('4');
  const [eraserPosition, setEraserPosition] = useState({ x: 0, y: 0, visible: false });
  const [chalkTexture, setChalkTexture] = useState<HTMLImageElement | null>(null);
  const [eraserSize, setEraserSize] = useState(100);
  const [resizing, setResizing] = useState<{ node: Node; direction: string } | null>(null);
  const [rotating, setRotating] = useState<{ node: Node; startAngle: number } | null>(null);
  const [selectionArea, setSelectionArea] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ id: number; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('solid');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editText, setEditText] = useState('');

  // Undo/Redo 기능을 위한 상태 추가
  const [history, setHistory] = useState<Node[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 그리기 객체를 저장하기 위한 상태 추가
  const [drawings, setDrawings] = useState<string[]>([]);

  // 마지막으로 생성된 노드의 위치를 저장하는 상태 추가
  const [lastNodePosition, setLastNodePosition] = useState({ x: 100, y: 100 });

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
          redrawCanvas(ctx, nodes, selectionArea);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes, selectionArea]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const animate = () => {
          redrawCanvas(ctx, nodes, selectionArea);
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete') {
      deleteSelectedNodes();
    } else if (editingNode) {
      if (e.key === 'Enter') {
        finishEditing();
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
    } else {
      const selectedNode = nodes.find(node => node.selected);
      if (selectedNode && e.key.length === 1) {
        startEditing(selectedNode);
        setEditText(e.key);
      }
    }
  }, [nodes, editingNode]);

  useEffect(() => {
    const handleKeyDownEvent = (e: globalThis.KeyboardEvent) => handleKeyDown(e as unknown as KeyboardEvent);
    window.addEventListener('keydown', handleKeyDownEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [handleKeyDown]);

  const startEditing = (node: Node) => {
    setEditingNode(node);
    setEditText('');  // 초기값을 빈 문자열로 설정
  };

  const finishEditing = () => {
    if (editingNode) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = 'bold 18px Arial';
          const lines = editText.split('\n');
          const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
          const width = Math.max(textWidth + 40, 120);
          const height = Math.max(80, lines.length * 20 + 40);  // 줄바꿈을 고려한 높이 계산

          setNodes(prevNodes =>
            prevNodes.map(node =>
              node.id === editingNode.id ? { ...node, text: editText, width, height } : node
            )
          );
        }
      }
      setEditingNode(null);
      setEditText('');
      addToHistory();
    }
  };

  const cancelEditing = () => {
    setEditingNode(null);
    setEditText('');
  };

  const deleteSelectedNodes = () => {
    const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id);
    const updatedNodes = nodes.filter(node => !node.selected).map(node => ({
      ...node,
      connections: node.connections.filter(conn => !selectedNodeIds.includes(conn.id))
    }));
    setNodes(updatedNodes);
    addToHistory();
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
          setRotating({ node, startAngle: Math.atan2(y - (node.y + node.height / 2), x - (node.x + node.width / 2)) });
        } else if (handle) {
          setResizing({ node, direction: handle });
        } else {
          const selectedNodes = nodes.filter((n) => n.selected);
          if (selectedNodes.length > 1 && node.selected) {
            // 여러 노드가 선택된 경우
            setDragging({
              node: { id: -1, x: x, y: y, width: 0, height: 0, text: '', connections: [], zIndex: 0 },
              offsetX: x,
              offsetY: y,
              selectedNodes: selectedNodes // 이제 이 속성이 허용됩니다
            });
          } else {
            setDragging({ node, offsetX: x - node.x, offsetY: y - node.y });
            setNodes(nodes.map((n) => ({ ...n, selected: n.id === node.id })));
          }
        }
        // 노드 이동 시작 시 현재 상태를 히스토리에 추가
        addToHistory();
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
                    { id: clickedNode.id, fromSide: connecting.side, toSide: side, lineStyle: lineStyle },
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
      if (dragging.node.id === -1) {
        // 여러 노드가 선택된 경우
        const dx = x - dragging.offsetX;
        const dy = y - dragging.offsetY;
        const newNodes = nodes.map((node) => {
          if (node.selected) {
            return { ...node, x: node.x + dx, y: node.y + dy };
          }
          return node;
        });
        setNodes(newNodes);
        setDragging({ ...dragging, offsetX: x, offsetY: y });
      } else {
        // 단일 노드 이동
        const newNodes = nodes.map((node) => {
          if (node.id === dragging.node.id) {
            return { ...node, x: x - dragging.offsetX, y: y - dragging.offsetY };
          }
          return node;
        });
        setNodes(newNodes);
        // 마지막으로 이동한 노드의 위치 업데이트
        setLastNodePosition({ x: x - dragging.offsetX, y: y - dragging.offsetY });
      }
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
            const minWidth = Math.max(120, ctx.measureText(node.text).width + 40);
            const minHeight = 80;

            if (resizing.direction.includes('e')) newWidth = Math.max(minWidth, x - node.x);
            if (resizing.direction.includes('w')) {
              newWidth = Math.max(minWidth, node.x + node.width - x);
              newX = Math.min(x, node.x + node.width - minWidth);
            }
            if (resizing.direction.includes('s')) newHeight = Math.max(minHeight, y - node.y);
            if (resizing.direction.includes('n')) {
              newHeight = Math.max(minHeight, node.y + node.height - y);
              newY = Math.min(y, node.y + node.height - minHeight);
            }
          }

          return { ...node, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        return node;
      });
      setNodes(newNodes);
    } else if (rotating) {
      const centerX = rotating.node.x + rotating.node.width / 2;
      const centerY = rotating.node.y + rotating.node.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX) - rotating.startAngle;
      const newRotation = ((angle * 180) / Math.PI + 360) % 360;

      setNodes(nodes.map((node) => (node.id === rotating.node.id ? { ...node, rotation: newRotation } : node)));
    }

    if (selectionArea) {
      setSelectionArea({ ...selectionArea, endX: x, endY: y });
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
      if (isVoiceEnabled) {
        const selectedTexts = selectedNodes.filter((node) => node.selected).map((node) => node.text);
        if (selectedTexts.length > 0) {
          const textToRead = selectedTexts.join(', ');
          const utterance = new SpeechSynthesisUtterance(textToRead);
          utterance.lang = 'ko-KR'; // 한국어로 설정
          window.speechSynthesis.speak(utterance);
        }
      }

      setSelectionArea(null);
    }

    // 상태 변경 후 히스토리에 추가
    addToHistory();

    // 그리기 객체 저장
    const drawingCanvas = drawingCanvasRef.current;
    if (drawingCanvas) {
      const ctx = drawingCanvas.getContext('2d');
      if (ctx) {
        const imageData = drawingCanvas.toDataURL();
        setDrawings((prevDrawings) => [...prevDrawings, imageData]);
      }
    }
  };

  const getClickedNodeAndHandle = (x: number, y: number) => {
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

  const isNodeInSelectionArea = (node: Node, area: { startX: number; startY: number; endX: number; endY: number }) => {
    const { startX, startY, endX, endY } = area;
    const left = Math.min(startX, endX);
    const right = Math.max(startX, endX);
    const top = Math.min(startY, endY);
    const bottom = Math.max(startY, endY);

    return node.x < right && node.x + node.width > left && node.y < bottom && node.y + node.height > top;
  };

  const getClickedNode = (x: number, y: number) => {
    const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

    return sortedNodes.find((node) => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) || null;
  };

  const getNodeSide = (node: Node, x: number, y: number): 'top' | 'right' | 'bottom' | 'left' => {
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
    
    // 최근에 이동한 노드의 위치를 기반으로 새 노드의 위치 설정
    const newX = lastNodePosition.x + 20;
    const newY = lastNodePosition.y + 20;

    const newNode: Node = { id: newId, x: newX, y: newY, text: '', width: 120, height: 80, selected: false, connections: [], zIndex: newZIndex, backgroundColor: '#FFFFFF' };

    setNodes((prevNodes) => [...prevNodes.map((node) => ({ ...node, selected: false })), newNode]);
    setNextNodeId(newId + 1);
    setMaxZIndex(newZIndex);
    setLastNodePosition({ x: newX, y: newY });
    startEditing(newNode);
    addToHistory();
  };

  const handleToolChange = (newTool: Tool) => {
    console.log(`도구 변경: ${newTool}`);
    if (tool === 'move' && newTool !== 'move') {
      setNodes((prevNodes) => prevNodes.map((node) => ({ ...node, selected: false })));
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
    const leftmostNode = selectedNodes.reduce((left, node) => (node.x < left.x ? node : left));
    const baseY = leftmostNode.y;
    const newNodes = nodes.map((node) => {
      if (node.selected) {
        return { ...node, y: baseY };
      }
      return node;
    });

    setNodes(newNodes);
    addToHistory();
  };

  const alignNodesHorizontally = () => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length < 2) return;
    const topmostNode = selectedNodes.reduce((top, node) => (node.y < top.y ? node : top));
    const baseX = topmostNode.x;
    const newNodes = nodes.map((node) => {
      if (node.selected) {
        return { ...node, x: baseX };
      }
      return node;
    });

    setNodes(newNodes);
    addToHistory();
  };

  const handleColorChange = (color: string) => {
    setPenColor(color);
    setNodes((prevNodes) => prevNodes.map((node) => (node.selected ? { ...node, backgroundColor: color } : node)));
    addToHistory();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'studyboard-recording.webm';
        a.click();
        setIsRecording(false);  // 녹화가 완료되면 isRecording 상태를 false로 변경
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error: ", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // Undo 기능
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history[historyIndex - 1]);
    }
  };

  // Redo 기능
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history[historyIndex + 1]);
    }
  };

  // 히스토리에 현재 상태 추가
  const addToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...nodes]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 저장 기능
  const saveCanvas = () => {
    const data = {
      nodes: nodes,
      drawings: drawings,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studyboard-data.json';
    a.click();
  };

  // 불러오기 기능
  const loadCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        setNodes(data.nodes);
        setDrawings(data.drawings);

        // 그리기 객체 복원
        const drawingCanvas = drawingCanvasRef.current;
        if (drawingCanvas) {
          const ctx = drawingCanvas.getContext('2d');
          if (ctx) {
            data.drawings.forEach((imageData: string) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
              };
              img.src = imageData;
            });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', margin: '2px', borderRadius: '10px', backgroundColor: 'white', boxShadow: '2px 2px 2px rgba(0,0,0,0.1)' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
        <canvas ref={drawingCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        {eraserPosition.visible && (
          <div style={{ position: 'absolute', left: eraserPosition.x - eraserSize / 2, top: eraserPosition.y - eraserSize / 2, width: eraserSize, height: eraserSize, border: '1px solid black', borderRadius: '50%', pointerEvents: 'none', zIndex: 3 }} />
        )}
        {editingNode && (
          <textarea
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.font = 'bold 18px Arial';
                  const lines = e.target.value.split('\n');
                  const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
                  const width = Math.max(textWidth + 40, 120);
                  const height = Math.max(80, lines.length * 20 + 40);
                  setNodes(prevNodes =>
                    prevNodes.map(node =>
                      node.id === editingNode.id ? { ...node, width, height } : node
                    )
                  );
                  setEditingNode(prevNode => prevNode ? { ...prevNode, width, height } : null);
                }
              }
            }}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
              } else if (e.key === 'Escape') {
                cancelEditing();
              }
            }}
            style={{ position: 'absolute', left: editingNode.x, top: editingNode.y, width: editingNode.width, height: editingNode.height, zIndex: 4, fontSize: '18px', fontWeight: 'bold', textAlign: 'center', border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', boxSizing: 'border-box', lineHeight: '1.2' }}
            autoFocus
          />
        )}
      </div>
      <div style={{ padding: '20px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 10, gap: '10px' }}>
        <ToolButton tool="save" icon="/icon-save.svg" onClick={saveCanvas} currentTool={tool} />
        <ToolButton tool="load" icon="/icon-load.svg" onClick={() => document.getElementById('fileInput')?.click()} currentTool={tool} />
        <ToolButton tool="move" icon="/icon-move.svg" onClick={() => handleToolChange('move')} currentTool={tool} />
        <ToolButton tool="draw" icon="/icon-draw.svg" onClick={() => handleToolChange('draw')} currentTool={tool} />
        <ToolButton tool="addNode" icon="/icon-addnode.svg" onClick={() => handleToolChange('addNode')} currentTool={tool} />
        <ToolButton tool="connect" icon="/icon-connect.svg" onClick={() => handleToolChange('connect')} currentTool={tool} />
        <ToolButton tool="erase" icon="/icon-erase.svg" onClick={() => handleToolChange('erase')} currentTool={tool} />
        <ToolButton tool="clear" icon="/icon-clear.svg" onClick={() => {
            const canvas = drawingCanvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
            setNodes([]);  // 모든 노드 삭제
            setDrawings([]);  // 모든 그리기 객체 삭제
            addToHistory();
          }}
          currentTool={tool}
        />
        <ToolButton tool="alignVertical" icon="/icon-alignv.svg" onClick={alignNodesVertically} currentTool={tool} />
        <ToolButton tool="alignHorizontal" icon="/icon-alignh.svg" onClick={alignNodesHorizontally} currentTool={tool} />
        <ToolButton tool="record" icon={isRecording ? "/icon-stop-rec.svg" : "/icon-start-rec.svg"}
          onClick={isRecording ? stopRecording : startRecording}
          currentTool={tool}
        />
        <ToolButton tool="undo" icon="/icon-undo.svg" onClick={undo} currentTool={tool} />
        <ToolButton tool="redo" icon="/icon-redo.svg" onClick={redo} currentTool={tool} />
        <ToolButton tool="voice" icon={isVoiceEnabled ? "/icon-voice-on.svg" : "/icon-voice-off.svg"}
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          currentTool={isVoiceEnabled ? 'voice' : ''}
        />
        <input type="file" id="fileInput" style={{ display: 'none' }} onChange={loadCanvas} accept=".json" />
        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>색상</label>
          <select value={penColor} onChange={(e) => handleColorChange(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
            <option value="#FFFF00">노랑</option>
            <option value="#FFD700">오렌지</option>
            <option value="#FF4500">빨강</option>
            <option value="#0000FF">파랑</option>
            <option value="#000000">검정</option>
            <option value="#FFFFFF">흰색</option>
          </select>
        </div>
        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>굵기</label>
          <select value={lineWidth} onChange={(e) => setLineWidth(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
            <option value="1">얇게</option>
            <option value="2">보통</option>
            <option value="4">굵게</option>
            <option value="8">매우 굵게</option>
          </select>
        </div>
        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>지우개 크기</label>
          <select value={eraserSize.toString()} onChange={(e) => setEraserSize(Number(e.target.value))} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
            <option value="50">작게</option>
            <option value="100">보통</option>
            <option value="200">크게</option>
          </select>
        </div>
        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>연결선 스타일</label>
          <select value={lineStyle} onChange={(e) => setLineStyle(e.target.value as 'solid' | 'dashed')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
            <option value="solid">실선</option>
            <option value="dashed">점선</option>
          </select>
        </div>
      </div>
    </div>
  );
};
export default StudyBoard;