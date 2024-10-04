'use client';

import React, { useRef, useEffect, useState, KeyboardEvent, useCallback } from 'react';
import ToolButton from './components/ToolButton';
import { drawRoundedRect, drawNode, drawResizeHandles, drawRotationHandle, getConnectionPoint, drawConnections, redrawCanvas, calculateNodeSize, isNodeInSelectionArea } from './utils/canvasUtils';
import { Tool, Node, DraggingState, SelectionArea } from './types';
import SaveLessonPopup from '@/ui/component/SaveLessonPopup';
import { createLesson } from './actions';
import SaveRecordingPopup from '@/ui/component/SaveRecordingPopup';
import { createStudyRec } from './actions';

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
  const [eraserSize, setEraserSize] = useState(100);
  const [resizing, setResizing] = useState<{ node: Node; direction: string } | null>(null);
  const [rotating, setRotating] = useState<{ node: Node; startAngle: number } | null>(null);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(null);
  const [connecting, setConnecting] = useState<{ id: number; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('dashed');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editText, setEditText] = useState({ text1: '', text2: '', text3: '' });

  // Undo/Redo 기능을 위한 상태 추가
  const [history, setHistory] = useState<Node[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 그리기 객체를 저장하기 위한 상태 추가
  const [drawings, setDrawings] = useState<string[]>([]);

  // 마지막으로 생성된 노드의 위치를 저장하는 상태 추가
  const [lastNodePosition, setLastNodePosition] = useState({ x: 100, y: 100 });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const originalSpeakRef = useRef<typeof window.speechSynthesis.speak | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSaveRecordingPopup, setShowSaveRecordingPopup] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

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
    // 브라우저 환경에서만 실행되도록 합니다.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      originalSpeakRef.current = window.speechSynthesis.speak.bind(window.speechSynthesis);
    }
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
        setEditText(prevState => ({
          ...prevState,
          text1: e.key // 또는 적절한 텍스트 필드
        }));
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
    setEditText({ text1: node.text1, text2: node.text2, text3: node.text3 });
  };

  const finishEditing = () => {
    if (editingNode) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { width, height } = calculateNodeSize(ctx, { ...editingNode, ...editText });

          setNodes(prevNodes =>
            prevNodes.map(node =>
              node.id === editingNode.id
                ? { ...node, ...editText, width, height }
                : node
            )
          );
        }
      }
      setEditingNode(null);
      setEditText({ text1: '', text2: '', text3: '' });
      addToHistory();
    }
  };

  const cancelEditing = () => {
    setEditingNode(null);
    setEditText({ text1: '', text2: '', text3: '' });
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
    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      const clickedNode = getClickedNode(offsetX, offsetY);
      
      if (clickedNode) {
        if (!clickedNode.selected) {
          // 선택되지 않은 노드를 클릭한 경우, 해당 노드만 선택
          setNodes(prevNodes => prevNodes.map(node => ({
            ...node,
            selected: node.id === clickedNode.id
          })));
        }
        // 그룹 드래그 시작
        setIsDraggingGroup(true);
      } else {
        // 빈 공간 클릭 시 선택 영역 드래그 시작
        setSelectionArea({ startX: offsetX, startY: offsetY, endX: offsetX, endY: offsetY });
        setIsSelecting(true);
      }
      
      setDragStartPosition({ x: offsetX, y: offsetY });
    }

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
              node: { id: -1, x: x, y: y, width: 0, height: 0, text1: '', text2: '', text3: '', connections: [], zIndex: 0, backgroundColor: '', selected: false },
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
          setNodes((prevNodes: Node[]) =>
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
                      lineStyle: lineStyle
                    }
                  ]
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
    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      
      if (isDraggingGroup && dragStartPosition) {
        // 선택된 노드들을 그룹으로 이동
        const dx = offsetX - dragStartPosition.x;
        const dy = offsetY - dragStartPosition.y;
        setNodes(prevNodes => prevNodes.map(node => 
          node.selected
            ? { ...node, x: node.x + dx, y: node.y + dy }
            : node
        ));
        setDragStartPosition({ x: offsetX, y: offsetY });
      } else if (isSelecting && !resizing) {
        // 다중 선택을 위한 드래그 (리사이징 중이 아닐 때만)
        setSelectionArea(prev => prev ? { ...prev, endX: offsetX, endY: offsetY } : null);
      }
    }

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
            const minWidth = Math.max(120, ctx.measureText(node.text2).width + 40);
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

    if (tool === 'erase') {
      setEraserPosition({ x, y, visible: true });
    } else {
      setEraserPosition({ x: 0, y: 0, visible: false });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    setDragging(null);
    setResizing(null);
    setRotating(null);

    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      
      if (isDraggingGroup) {
        // 그룹 드래그 종료
        setIsDraggingGroup(false);
      } else if (isSelecting) {
        // 다중 선택 종료
        setIsSelecting(false);
        if (isDragSignificant(dragStartPosition!, { x: offsetX, y: offsetY })) {
          const selectedNodes = nodes.filter(node => isNodeInSelectionArea(node, selectionArea!));
          if (selectedNodes.length > 0) {
            setNodes(prevNodes => prevNodes.map(node => ({
              ...node,
              selected: selectedNodes.some(selectedNode => selectedNode.id === node.id)
            })));
          }
        } else {
          // 클릭으로 간주되는 경우, 모든 노드 선택 해제
          setNodes(prevNodes => prevNodes.map(node => ({ ...node, selected: false })));
        }
      }
    }
    setSelectionArea(null);
    setDragStartPosition(null);

    if (selectionArea) {
      const selectedNodes = nodes.map((node) => ({
        ...node,
        selected: isNodeInSelectionArea(node, selectionArea),
      }));
      setNodes(selectedNodes);

      // 선택된 노드들의 텍스트를 읽어주는 기능 추가
      if (isVoiceEnabled) {
        const selectedTexts = selectedNodes.filter((node) => node.selected).map((node) => node.text2);
        readSelectedTexts(selectedTexts);
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

    const newNode: Node = { id: newId, x: newX, y: newY, text1: '', text2: '', text3: '', width: 200, height: 120, selected: false, connections: [], zIndex: newZIndex, backgroundColor: '#FFFFFF' };

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

  // 음성 읽기 함수 수정
  const readSelectedTexts = (selectedTexts: string[]) => {
    if (selectedTexts.length > 0 && typeof window !== 'undefined' && window.speechSynthesis) {
      // const textToRead = selectedTexts.join(', ');
      const textToRead = selectedTexts.join(' ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-US'; // Set to English
      utterance.rate = 1.0; // 말하기 속도 설정 (1.0이 기본값)
      utterance.pitch = 1.0; // 음높이 설정 (1.0이 기본값)
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      mediaRecorderRef.current = new MediaRecorder(combinedStream);

      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        displayStream.getTracks().forEach(track => track.stop());
        audioStream.getTracks().forEach(track => track.stop());
        setIsRecording(false); // 녹화 종료 시 상태 변경

        setRecordingBlob(blob);
        setShowSaveRecordingPopup(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('화면 및 오디오 녹화를 시작하는 데 실패했습니다:', error);
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
  const saveCanvas = async (title: string) => {
    const filename = `${Date.now()}.json`;
    const filePath = `/lessons/${filename}`;

    const data = {
      title: title,
      nodes: nodes,
      drawings: drawings,
    };

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
        formData.append('name', title);
        formData.append('path', filePath);
        const result = await createLesson(formData);

        if (result.message === 'Created Lesson.') {
          alert(`교안 "${title}"이(가) 성공적으로 저장되었습니다.`);
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('교안 파일 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('교안 저장 중 오류 발생:', error);
      alert('교안 저장에 실패했습니다. 다시 시도해 주세요.');
    }
    setShowSavePopup(false);
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

  const isDragSignificant = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy) > 5; // 5픽셀 이상 이동했을 때 드래그로 간주
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawCanvas(ctx, nodes, draggingNode ? null : selectionArea);
      }
    }
  }, [nodes, selectionArea, draggingNode]);

  const saveRecording = async (title: string) => {
    if (!recordingBlob) {
      alert('저장할 녹화 파일이 없습니다.');
      return;
    }

    const filename = `${Date.now()}.webm`;
    const filePath = `/studyRec/${filename}`;

    try {
      // 파일 저장
      const formData = new FormData();
      formData.append('file', recordingBlob, filename);
      formData.append('path', filePath);

      const response = await fetch('/api/save-recording', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // 데이터베이스에 저장
        const dbFormData = new FormData();
        dbFormData.append('name', title);
        dbFormData.append('path', filePath);
        const result = await createStudyRec(dbFormData);

        if (result.message === 'Created StudyRec.') {
          alert(`녹화 파일 "${title}"이(가) 성공적으로 저장되었습니다.`);
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('녹화 파일 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('녹화 파일 저장 중 오류 발생:', error);
      alert('녹화 파일 저장에 실패했습니다. 다시 시도해 주세요.');
    }
    setShowSaveRecordingPopup(false);
    setRecordingBlob(null);
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
          <div
            style={{
              position: 'absolute',
              left: editingNode.x,
              top: editingNode.y,
              width: editingNode.width,
              height: editingNode.height,
              zIndex: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '1px solid black',
              borderRadius: '5px',
              padding: '5px',
            }}
          >
            <input
              value={editText.text1}
              onChange={(e) => setEditText({ ...editText, text1: e.target.value })}
              style={{ width: '90%', marginBottom: '5px', textAlign: 'center' }}
              placeholder="텍스트 1"
              autoFocus
            />
            <input
              value={editText.text2}
              onChange={(e) => setEditText({ ...editText, text2: e.target.value })}
              style={{ width: '90%', marginBottom: '5px', textAlign: 'center' }}
              placeholder="텍스트 2"
            />
            <input
              value={editText.text3}
              onChange={(e) => setEditText({ ...editText, text3: e.target.value })}
              style={{ width: '90%', textAlign: 'center' }}
              placeholder="텍스트 3"
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  finishEditing();
                }
              }}
            />
          </div>
        )}
      </div>
      <div style={{ padding: '20px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 10, gap: '10px' }}>
        <ToolButton tool="save" icon="/icon-save.svg" onClick={() => setShowSavePopup(true)} currentTool={tool} />
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
      {showSavePopup && (
        <SaveLessonPopup
          onSave={saveCanvas}
          onCancel={() => setShowSavePopup(false)}
        />
      )}
      {showSaveRecordingPopup && (
        <SaveRecordingPopup
          onSave={saveRecording}
          onCancel={() => setShowSaveRecordingPopup(false)}
        />
      )}
    </div>
  );
};
export default StudyBoard;