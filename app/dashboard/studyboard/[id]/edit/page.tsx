'use client';

import React, { useRef, useEffect, useState, KeyboardEvent, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import ToolButton from './components/ToolButton';
import { redrawCanvas, calculateNodeSize, isNodeInSelectionArea } from './utils/canvasUtils';
import { Tool, Node, DraggingState, SelectionArea, DrawingAction } from './types';
import SaveLessonPopup from '@/ui/component/SaveLessonPopup';
import { createLesson } from './actions';
import SaveRecordingPopup from '@/ui/component/SaveRecordingPopup';
import { createStudyRec } from './actions';
import { CircularProgress, Box, Typography } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClearConfirmPopup from '@/ui/component/ClearConfirmPopup';

const EditStudyBoard = ({ params }: { params: { id: string } }) => {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'edit';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('move');
  const [nodeColor, setNodeColor] = useState('#FFF');
  const [penColor, setPenColor] = useState('#000');
  const [lineWidth, setLineWidth] = useState<string>('4');
  const [eraserPosition, setEraserPosition] = useState({ x: 0, y: 0, visible: false });
  const [eraserSize, setEraserSize] = useState(100);
  const [resizing, setResizing] = useState<{ node: Node; direction: string } | null>(null);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(null);
  const [connecting, setConnecting] = useState<{ id: number; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('dashed');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editText, setEditText] = useState({ text1: '', text2: '', text3: '' });

  // 히스토리 상태를 수정하여 drawings도 포함하도록 합니다
  const [history, setHistory] = useState<{ nodes: Node[][], drawings: DrawingAction[][] }>({ nodes: [], drawings: [] });
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 마지막으로 생성된 노드의 위치를 저장하는 상태 추가
  const [lastNodePosition, setLastNodePosition] = useState({ x: 100, y: 100 });
  const originalSpeakRef = useRef<typeof window.speechSynthesis.speak | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSaveRecordingPopup, setShowSaveRecordingPopup] = useState(false);
  const [showClearConfirmPopup, setShowClearConfirmPopup] = useState(false);
  const [drawingActions, setDrawingActions] = useState<DrawingAction[]>([]);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  
  const hiddenToolsInPlayMode = ['save', 'addNode', 'connect', 'clear', 'alignVertical', 'alignHorizontal'];
  const hiddenToolsInEditMode = ['draw', 'erase', 'record'];

  // 터치 이벤트를 위한 상태 추가
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);

  // nav 영역의 너비를 저장할 상태 추가
  const [navWidth, setNavWidth] = useState(0);
  const [debugInfo, setDebugInfo] = useState<{ original: { x: number, y: number }, calculated: { x: number, y: number } } | null>(null);

  // 터치 좌표를 캔버스 상대 좌표로 변환하는 함수
  const getTouchPos = (canvas: HTMLCanvasElement, touch: React.Touch) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // navWidth를 제외하지 않고 계산
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    setDebugInfo({
      original: { x: touch.clientX, y: touch.clientY },
      calculated: { x, y }
    });

    return { x, y };
  };

  // 툴 버튼을 렌더링할지 결정하는 함수
  const shouldRenderTool = (toolName: string) => {
    if (mode === 'play' && hiddenToolsInPlayMode.includes(toolName)) {
      return false;
    }
    if (mode === 'edit' && hiddenToolsInEditMode.includes(toolName)) {
      return false;
    }
    return true;
  };

  const addNode = () => {
    const newId = Date.now();
    const newZIndex = maxZIndex + 1;
    
    // 최근에 이동한 노드의 오른쪽에 새 노드 생성
    const newX = lastNodePosition.x + 220; // 기존 노드의 너비(200) + 간격(20)
    const newY = lastNodePosition.y;

    const newNode: Node = { id: newId, x: newX, y: newY, text1: '', text2: '', text3: '', width: 200, height: 120, selected: false, connections: [], zIndex: newZIndex, backgroundColor: '#FFFFFF' };

    setNodes((prevNodes) => [...prevNodes.map((node) => ({ ...node, selected: false })), newNode]);
    setMaxZIndex(newZIndex);
    setLastNodePosition({ x: newX, y: newY });
    startEditing(newNode);
    addToHistory();
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
              node.id === editingNode.id ? { ...node, ...editText, width, height } : node
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
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete') {
      deleteSelectedNodes();
    } else if (editingNode) {
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLInputElement) {
          const inputs = document.querySelectorAll('input');
          const currentIndex = Array.from(inputs).indexOf(e.target as HTMLInputElement);
          if (currentIndex < inputs.length - 1) {
            (inputs[currentIndex + 1] as HTMLInputElement).focus();
          } else {
            finishEditing();
          }
        } else {
          finishEditing();
        }
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
    } else {
      const selectedNode = nodes.find(node => node.selected);
      if (selectedNode && e.key.length === 1) {
        startEditing(selectedNode);
      }
    }
  }, [nodes, editingNode]);

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
        // 그리기 시작 점 설정
        setCurrentDrawingPoints([{ x, y }]);
      }
    } else if (tool === 'move') {
      const { node, handle } = getClickedNodeAndHandle(x, y);
      if (node) {
        if (handle) {
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
                return { ...node, connections: [...node.connections, { id: clickedNode.id, fromSide: connecting.side, toSide: side, lineStyle: lineStyle }] };
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
          // 현재 그리기 점 추가
          setCurrentDrawingPoints(prevPoints => [...prevPoints, { x, y }]);
        } else if (tool === 'erase') {
          // ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(255,255,255,1)';
          ctx.lineWidth = eraserSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          // ctx.globalCompositeOperation = 'source-over';
          // 현재 그리기 점 추가
          setCurrentDrawingPoints(prevPoints => [...prevPoints, { x, y }]);
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

    // 그리기 작업 저장
    if (isDrawing && (tool === 'draw' || tool === 'erase')) {
      setDrawingActions(prevActions => [
        ...prevActions,
        {
          type: tool,
          points: currentDrawingPoints,
          color: tool === 'draw' ? penColor : '#FFF',
          lineWidth: tool === 'draw' ? Number(lineWidth) : eraserSize
        }
      ]);
      setCurrentDrawingPoints([]);
    }

    // 상태 변경 후 히스토리에 한 번만 추가
    addToHistory();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = getTouchPos(canvas, touch);
    setTouchStartPos({ x, y });
    console.log('Touch start:', { x, y, clientX: touch.clientX, clientY: touch.clientY, navWidth });
    
    handleMouseDown({ nativeEvent: { offsetX: x, offsetY: y } } as unknown as React.MouseEvent<HTMLCanvasElement>);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!touchStartPos) return;
    const canvas = e.currentTarget;
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = getTouchPos(canvas, touch);
    handleMouseMove({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setTouchStartPos(null);
    handleMouseUp({} as React.MouseEvent<HTMLCanvasElement>);
  };

  const handleToolChange = (newTool: Tool) => {
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

  const handleNodeColorChange = (color: string) => {
    setNodes((prevNodes) => prevNodes.map((node) => 
      node.selected ? { ...node, backgroundColor: color } : node
    ));
    // 히스토리에 추가
    addToHistory();
  };

  const handlePenColorChange = (color: string) => {
    setPenColor(color);
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


  // 히스토리에 현재 상태 추가 함수 수정
  const addToHistory = (newDrawings?: DrawingAction[]) => {
    const newHistory = {
      nodes: history.nodes.slice(0, historyIndex + 1),
      drawings: history.drawings.slice(0, historyIndex + 1)
    };
    newHistory.nodes.push([...nodes]);
    newHistory.drawings.push(newDrawings || [...drawingActions]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.nodes.length - 1);
  };

  // Undo 기능 수정
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history.nodes[historyIndex - 1]);
      setDrawingActions(history.drawings[historyIndex - 1]);
    }
  };

  // Redo 기능 수정
  const redo = () => {
    if (historyIndex < history.nodes.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history.nodes[historyIndex + 1]);
      setDrawingActions(history.drawings[historyIndex + 1]);
    }
  };

  // 저장 기능
  const saveCanvas = async (title: string) => {
    setShowSavePopup(false);
    const filename = `${new Date().toLocaleString('ko-KR', { 
      timeZone: 'Asia/Seoul', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',fractionalSecondDigits: 3, hour12: false
    }).replace(/[^\d]/g, '')}.json`;
    const filedir = `lessons`;
    const filePath = `/${filedir}/${filename}`;

    const data = {
      filedir: filedir,
      filename: filename,
      title: title,
      nodes: nodes,
      drawings: drawingActions,
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
          toast.success(`교안 "${title}"이(가) 성공적으로 저장되었습니다.`);
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('교안 파일 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('교안 저장 중 오류 발생:', error);
      toast.error('교안 저장에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const isDragSignificant = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy) > 5; // 5픽셀 이상 이동했을 때 드래그로 간주
  };

  // 음성 읽기 함수 수정
  const readSelectedTexts = (selectedTexts: string[]) => {
    if (selectedTexts.length > 0 && typeof window !== 'undefined' && window.speechSynthesis) {
      const textToRead = selectedTexts.join(' ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-US'; // 영어로 설정
      utterance.rate = 1.0; // 말하기 속도 설정 (1.0이 기본값)
      utterance.pitch = 1.0; // 음높이 설정 (1.0이 기본값)
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      // 사용자에게 화면 공유 권한 요청
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "browser" },
        audio: true 
      });

      // 오디오 스트림 요청 (마이크와 시스템 오디오)
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // 시스템 오디오 캡처를 위한 AudioContext 생성
      const audioContext = new AudioContext();
      const systemSource = audioContext.createMediaStreamSource(displayStream);
      const micSource = audioContext.createMediaStreamSource(audioStream);
      const destination = audioContext.createMediaStreamDestination();

      // 시스템 오디오와 마이크 오디오를 혼합
      const systemGain = audioContext.createGain();
      const micGain = audioContext.createGain();
      systemSource.connect(systemGain).connect(destination);
      micSource.connect(micGain).connect(destination);

      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
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
      toast.error('화면 및 오디오 녹화를 시작하는 데 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };
  const saveRecording = async (title: string) => {
    setShowSaveRecordingPopup(false);
    if (!recordingBlob) {
      toast.error('저장할 녹화 파일이 없습니다.');
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
          toast.success(`녹화 파일 "${title}"이(가) 성공적으로 저장되었습니다.`);
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('녹화 파일 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('녹화 파일 저장 중 오류 발생:', error);
      toast.error('녹화 파일 저장에 실패했습니다. 다시 시도해 주세요.');
    }
    setRecordingBlob(null);
  };
  
  useEffect(() => {
    const loadLesson = async () => {
      if (params.id === 'new') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/lessons/?id=${params.id}`);
        if (!response.ok) {
          throw new Error('교안을 찾을 수 없습니다');
        }
        const lessonData = await response.json();
        
        // lessonData.path에서 파일 경로 읽기
        const filePath = `${lessonData.rows[0].path}`;
        
        // 파일 내용 읽기
        const fileResponse = await fetch(filePath);
        if (!fileResponse.ok) {
          throw new Error('파일을 찾을 수 없습니다');
        }
        const fileData = await fileResponse.json();

        setNodes(fileData.nodes);
        setDrawingActions(fileData.drawings);

        // 그리기 객체 복원
        const drawingCanvas = drawingCanvasRef.current;
        if (drawingCanvas) { 
          const ctx = drawingCanvas.getContext('2d');
          if (ctx) {
            fileData.drawings.forEach((imageData: string) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
              };
              img.src = imageData;
            });
          }
        }
      } catch (error) {
        console.error('레슨 불러오기 실패:', error);
        toast.error('레슨을 불러오는 데 실패했습니다: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [params.id]);

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
          redrawCanvas(ctx, nodes, drawingActions, selectionArea);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes, drawingActions, selectionArea]);

  useEffect(() => {
    // 브라우저 환경에서만 실행되도록 합니다.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      originalSpeakRef.current = window.speechSynthesis.speak.bind(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    const handleKeyDownEvent = (e: globalThis.KeyboardEvent) => handleKeyDown(e as unknown as KeyboardEvent);
    window.addEventListener('keydown', handleKeyDownEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [handleKeyDown]);
    
  useEffect(() => {
    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (canvas && drawingCanvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawCanvas(ctx, nodes, drawingActions, dragging ? null : selectionArea);
      }
    }
  }, [nodes, selectionArea, dragging]);

  const handleLineStyleChange = (style: 'solid' | 'dashed') => {
    setLineStyle(style);
    handleToolChange('connect');
  };

  // 전체 지우기 함수
  const clearAll = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setNodes([]);
    setDrawingActions([]);
    addToHistory();
    setShowClearConfirmPopup(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#f5f5f5">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', margin: '2px', borderRadius: '10px', backgroundColor: 'white', boxShadow: '2px 2px 2px rgba(0,0,0,0.1)' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
        <canvas
          ref={drawingCanvasRef}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {eraserPosition.visible && (
          <div style={{ position: 'absolute', left: eraserPosition.x - eraserSize / 2, top: eraserPosition.y - eraserSize / 2, width: eraserSize, height: eraserSize, border: '1px solid black', borderRadius: '50%', pointerEvents: 'none', zIndex: 3 }} />
        )}
        {editingNode && (
          <div style={{ position: 'absolute', left: editingNode.x, top: editingNode.y, width: editingNode.width, height: editingNode.height, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid black', borderRadius: '5px', padding: '5px' }}>
            <input value={editText.text1} onChange={(e) => setEditText({ ...editText, text1: e.target.value })} style={{ width: '90%', marginBottom: '5px', textAlign: 'center' }} placeholder="텍스트 1" autoFocus />
            <input value={editText.text2} onChange={(e) => setEditText({ ...editText, text2: e.target.value })} style={{ width: '90%', marginBottom: '5px', textAlign: 'center' }} placeholder="텍스트 2" />
            <input value={editText.text3} onChange={(e) => setEditText({ ...editText, text3: e.target.value })} style={{ width: '90%', textAlign: 'center' }} placeholder="텍스트 3" onBlur={finishEditing} onKeyDown={(e) => { if (e.key === 'Enter') { finishEditing(); } }} />
          </div>
        )}
      </div>
      <div style={{ paddingTop: '20px', paddingBottom: '20px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 10, gap: '10px' }}>
        {shouldRenderTool('save') && <ToolButton tool="save" icon="/icon-save.svg" onClick={() => setShowSavePopup(true)} currentTool={tool} />}
        {shouldRenderTool('move') && <ToolButton tool="move" icon="/icon-move.svg" onClick={() => handleToolChange('move')} currentTool={tool} />}
        {shouldRenderTool('draw') && <ToolButton tool="draw" icon="/icon-draw.svg" onClick={() => handleToolChange('draw')} currentTool={tool} />}
        {shouldRenderTool('addNode') && <ToolButton tool="addNode" icon="/icon-addnode.svg" onClick={() => handleToolChange('addNode')} currentTool={tool} />}
        {shouldRenderTool('connect') && <ToolButton tool="connect" icon="/icon-connect.svg" onClick={() => handleToolChange('connect')} currentTool={tool} />}
        {shouldRenderTool('erase') && <ToolButton tool="erase" icon="/icon-erase.svg" onClick={() => handleToolChange('erase')} currentTool={tool} />}
        {shouldRenderTool('clear') && (
          <ToolButton
            tool="clear"
            icon="/icon-clear.svg"
            onClick={() => setShowClearConfirmPopup(true)}
            currentTool={tool}
          />
        )}
        {shouldRenderTool('alignVertical') && <ToolButton tool="alignVertical" icon="/icon-alignv.svg" onClick={alignNodesVertically} currentTool={tool} />}
        {shouldRenderTool('alignHorizontal') && <ToolButton tool="alignHorizontal" icon="/icon-alignh.svg" onClick={alignNodesHorizontally} currentTool={tool} />}
        {shouldRenderTool('record') && (
          <ToolButton 
            tool="record" 
            icon={isRecording ? "/icon-stop-rec.svg" : "/icon-start-rec.svg"}
            onClick={isRecording ? stopRecording : startRecording}
            currentTool={tool}
          />
        )}
        <ToolButton tool="undo" icon="/icon-undo.svg" onClick={undo} currentTool={tool} />
        <ToolButton tool="redo" icon="/icon-redo.svg" onClick={redo} currentTool={tool} />
        <ToolButton 
          tool="voice" 
          icon={isVoiceEnabled ? "/icon-voice-on.svg" : "/icon-voice-off.svg"}
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          currentTool={isVoiceEnabled ? 'voice' : ''}
        />
        {mode !== 'play' && (
          <>
            <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px' }}>노드 색상</label>
              <select value={nodeColor} onChange={(e) => handleNodeColorChange(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
                <option value="#FFFFFF">흰색</option>
                <option value="#FFFF00">노랑</option>
                <option value="#FFD700">오렌지</option>
              </select>
            </div>
          </>
        )}
        {mode !== 'edit' && (
          <>
            <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px' }}>펜색상</label>
              <select value={penColor} onChange={(e) => handlePenColorChange(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
                <option value="#000000">검정</option>
                <option value="#FF4500">빨강</option>
                <option value="#0000FF">파랑</option>
              </select>
            </div>
          </>
        )}
        {mode !== 'edit' && (
          <>
            <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px' }}>펜굵기</label>
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
          </>
        )}
        {mode !== 'play' && (
          <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
            <label style={{ marginRight: '10px' }}>연결선 스타일</label>
            <select 
              value={lineStyle} 
              onChange={(e) => handleLineStyleChange(e.target.value as 'solid' | 'dashed')} 
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}
            >
              <option value="solid">실선</option>
              <option value="dashed">점선</option>
            </select>
          </div>
        )}
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
      {showClearConfirmPopup && (
        <ClearConfirmPopup
          onConfirm={clearAll}
          onCancel={() => setShowClearConfirmPopup(false)}
        />
      )}
      <ToastContainer position="top-center" autoClose={1000} />
    </div>
  );
};

export default EditStudyBoard;