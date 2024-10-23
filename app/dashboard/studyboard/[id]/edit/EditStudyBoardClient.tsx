'use client';

import React, { useRef, useEffect, useState, KeyboardEvent, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import ToolButton from '@/ui/component/ToolButton';
import SaveLessonPopup from '@/ui/component/SaveLessonPopup';
import SaveRecordingPopup from '@/ui/component/SaveRecordingPopup';
import ClearConfirmPopup from '@/ui/component/ClearConfirmPopup';
import { redrawCanvas, isNodeInSelectionArea, getLinkPoint, getCurvedLinkTopPoint, getSolidLinkTopPoint, drawLinks, addNode, getClickedNodeAndHandle, getClickedNode, getNodeSide, getTouchPos, isDragSignificant } from './utils/canvasUtils';
import { startRecording, stopRecording, saveRecording } from './utils/recordingUtils';
import { Tool, Node, DraggingState, SelectionArea, DrawingAction, Link, TemporaryLink, EditingLink } from './types';
import { CircularProgress, Box } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { deleteSelectedNodes } from './utils/canvasUtils';
import { startEditing, finishEditing, cancelEditing } from './utils/canvasUtils';
import { alignNodesVertically, alignNodesHorizontally } from './utils/canvasUtils';
import { saveCanvas } from './utils/canvasUtils';
import { finishEditingLink } from './utils/canvasUtils';
import { handleTouchStart, handleTouchMove, handleTouchEnd } from './utils/touchHandlers';

interface EditStudyBoardClientProps {
  params: { id: string };
  author: string | null;
  email: string | null;
}

const EditStudyBoardClient: React.FC<EditStudyBoardClientProps> = ({ params, author, email }) => {
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'edit';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [drawingActions, setDrawingActions] = useState<DrawingAction[]>([]);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('move');
  const [nodeColor, setNodeColor] = useState('#FFF');
  const [nodeBorderColor, setNodeBorderColor] = useState('#05f');
  const [penColor, setPenColor] = useState('#000');
  const [lineWidth, setLineWidth] = useState<string>('4');
  const [eraserPosition, setEraserPosition] = useState({ x: 0, y: 0, visible: false });
  const [eraserSize, setEraserSize] = useState(100);
  const [resizing, setResizing] = useState<{ node: Node; direction: string } | null>(null);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(null);
  const [linking, setLinking] = useState<{ id: number; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'curved'>('solid');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editText, setEditText] = useState({ text1: '', text2: '', text3: '' });
  const [history, setHistory] = useState<{ nodes: Node[][], drawings: DrawingAction[][] }>({ nodes: [], drawings: [] });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastNodePosition, setLastNodePosition] = useState({ x: 100, y: 200 });
  const originalSpeakRef = useRef<typeof window.speechSynthesis.speak | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSaveRecordingPopup, setShowSaveRecordingPopup] = useState(false);
  const [showClearConfirmPopup, setShowClearConfirmPopup] = useState(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [editingLink, setEditingLink] = useState<EditingLink | null>(null);
  const [linkText, setLinkText] = useState('');
  const prevNodesRef = useRef(nodes);
  const prevDrawingActionsRef = useRef(drawingActions);
  const isUndoRedoActionRef = useRef(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [temporaryLink, setTemporaryLink] = useState<TemporaryLink | null>(null);
  const MAX_HISTORY_LENGTH = 30; // 적절한 값으로 조정

  const hiddenToolsInPlayMode = ['save', 'move', 'addNode', 'link', 'clear', 'alignVertical', 'alignHorizontal'];
  const hiddenToolsInEditMode = ['draw', 'erase', 'record'];

  // 전체 지우기 함수
  const clearAll = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {ctx.clearRect(0, 0, canvas.width, canvas.height);}
    }
    setNodes([]);
    setDrawingActions([]);
    setHistory({ nodes: [], drawings: [] });
    setHistoryIndex(-1);
    setShowClearConfirmPopup(false);
    setLastNodePosition({ x: 100, y: 200 });
  };

  // 툴 버튼을 렌더링할지 결정하는 함수
  const shouldRenderTool = (toolName: string) => {
    if (mode === 'play' && hiddenToolsInPlayMode.includes(toolName)) {return false;}
    if (mode === 'edit' && hiddenToolsInEditMode.includes(toolName)) {return false;}
    return true;
  };

  const handleAddNode = () => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const { newNode, newMaxZIndex, newLastNodePosition } = addNode(
      nodes,
      canvasRect.width,
      canvasRect.height,
      lastNodePosition,
      maxZIndex
    );

    setNodes((prevNodes) => [...prevNodes.map((node) => ({ ...node, selected: false })), newNode]);
    setMaxZIndex(newMaxZIndex);
    setLastNodePosition(newLastNodePosition);
    startEditing(newNode, setEditingNode, setEditText);
  };

  const handleDeleteSelectedNodes = () => {
    const updatedNodes = deleteSelectedNodes(nodes);
    setNodes(updatedNodes);
  };

  const handleLineStyleChange = (style: 'solid' | 'dashed' | 'curved') => {
    setLineStyle(style);
    handleToolChange('link');
  };
  
  const handleStartEditing = (node: Node) => {
    startEditing(node, setEditingNode, setEditText);
  };

  const handleFinishEditing = () => {
    finishEditing(editingNode, editText, canvasRef.current, setNodes, setEditingNode, setEditText);
  };

  const handleCancelEditing = () => {
    cancelEditing(setEditingNode, setEditText);
  };
  
  const handleFinishEditingLink = () => {
    finishEditingLink(editingLink, linkText, setNodes, setEditingLink, setLinkText);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete') {handleDeleteSelectedNodes();
    } else if (e.key === 'Escape') {
      // ESC 키를 눌렀을 때 연결선 그리기 초기화
      setLinking(null);
      setTemporaryLink(null);
    } else if (editingNode) {
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLInputElement) {
          const inputs = document.querySelectorAll('input');
          const currentIndex = Array.from(inputs).indexOf(e.target as HTMLInputElement);
          if (currentIndex < inputs.length - 1) {(inputs[currentIndex + 1] as HTMLInputElement).focus();
          } else {handleFinishEditing();}
        } else {handleFinishEditing();}
      } else if (e.key === 'Escape') {handleCancelEditing();}
    } else {
      const selectedNode = nodes.find(node => node.selected);
      if (selectedNode && e.key.length === 1) {handleStartEditing(selectedNode);}
    }
  }, [nodes, editingNode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      const clickedNode = getClickedNode(nodes, offsetX, offsetY);
      
      if (clickedNode) {
        if (!clickedNode.selected) {
          // 선택되지 않은 노드를 클릭한 경우, 해당 노드만 선택
          setNodes(prevNodes => prevNodes.map(node => ({...node, selected: node.id === clickedNode.id})));
        }
        // 그룹 드래그 시작
        setIsDraggingGroup(true);
      } else {
        // 빈 공간 클릭 시 선택 영역 드래그 시작
        setSelectionArea({ startX: offsetX, startY: offsetY, endX: offsetX, endY: offsetY });
        setIsSelecting(true);
      }
      
      setDragStartPosition({ x: offsetX, y: offsetY });
    } else if (tool === 'link') {
      const { offsetX, offsetY } = e.nativeEvent;
      const clickedNode = getClickedNode(nodes, offsetX, offsetY);
      if (clickedNode) {
        const side = getNodeSide(clickedNode, offsetX, offsetY);
        setTemporaryLink({ startNode: clickedNode, startSide: side, endX: offsetX, endY: offsetY });
      }
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
      const { node, handle } = getClickedNodeAndHandle(nodes, x, y);
      if (node) {
        setIsDragging(true);        
        if (handle) {setResizing({ node, direction: handle });}
        else {
          const selectedNodes = nodes.filter((n) => n.selected);
          if (selectedNodes.length > 1 && node.selected) {
            // 여러 노드가 선택된 경우
            setDragging({node: {id: -1, x: x, y: y, width: 0, height: 0, text1: '', text2: '', text3: '', links: [], zIndex: 0, backgroundColor: '', borderColor: '', selected: false },offsetX: x, offsetY: y, selectedNodes: selectedNodes});
          } else {
            setDragging({ node, offsetX: x - node.x, offsetY: y - node.y });
            setNodes(nodes.map((n) => ({ ...n, selected: n.id === node.id })));
          }
        }
      } else {
        setSelectionArea({ startX: x, startY: y, endX: x, endY: y });
        setNodes(nodes.map((n) => ({ ...n, selected: false })));
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
    } else if (tool === 'link' && temporaryLink) {
      const { offsetX, offsetY } = e.nativeEvent;
      setTemporaryLink(prev => prev ? { ...prev, endX: offsetX, endY: offsetY } : null);
    }

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // ctx.beginPath();
        // ctx.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
  
        if (tool === 'draw') {
          // 현재 그리기 점 추가
          setCurrentDrawingPoints(prevPoints => [...prevPoints, { x, y }]);

          if (currentDrawingPoints.length < 2) return;

          ctx.strokeStyle = penColor;
          ctx.lineWidth = Number(lineWidth);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
      
          for (let i = 1; i < currentDrawingPoints.length; i++) {
            const currentPoint = currentDrawingPoints[i];
            const previousPoint = currentDrawingPoints[i - 1];
            const midPoint = {x: (previousPoint.x + currentPoint.x) / 2, y: (previousPoint.y + currentPoint.y) / 2};
      
            ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, midPoint.x, midPoint.y);
          }    
          // const lastPoint = currentDrawingPoints[currentDrawingPoints.length - 1];
          // ctx.lineTo(lastPoint.x, lastPoint.y);    
          ctx.stroke();          

        } else if (tool === 'erase') {
          ctx.lineTo(x, y);
          ctx.strokeStyle = 'rgba(255,255,255,1)';
          ctx.lineWidth = eraserSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
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
          if (node.selected) {return { ...node, x: node.x + dx, y: node.y + dy };}
          return node;
        });
        setNodes(newNodes);
        setDragging({ ...dragging, offsetX: x, offsetY: y });
      } else {
        // 단일 노드 이동
        const newNodes = nodes.map((node) => {
          if (node.id === dragging.node.id) {return { ...node, x: x - dragging.offsetX, y: y - dragging.offsetY };}
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
            const minHeight = 100;

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

    if (tool === 'erase') {setEraserPosition({ x, y, visible: true });}
    else {setEraserPosition({ x: 0, y: 0, visible: false });}
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    setDragging(null);
    setResizing(null);
    setIsDragging(false);

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
            setNodes(prevNodes => prevNodes.map(node => ({...node, selected: selectedNodes.some(selectedNode => selectedNode.id === node.id)})));
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
      const selectedNodes = nodes.map((node) => ({...node, selected: isNodeInSelectionArea(node, selectionArea),}));
      setNodes(selectedNodes);

      // 선택된 노드들의 텍트를 읽어주는 기능 추가
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

    if (tool === 'link' && temporaryLink) {      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedNode = getClickedNode(nodes, x, y);
      if (clickedNode) {
        const side = getNodeSide(clickedNode, x, y);
        if (linking === null) {setLinking({ id: clickedNode.id, side });}
        else {
          const fromNode = nodes.find(node => node.id === linking.id);
          if (fromNode) {
            const newLink: Link = {id: clickedNode.id.toString(), fromSide: linking.side, toSide: side, lineStyle: lineStyle};
            setNodes((prevNodes: Node[]) =>
              prevNodes.map((node) => {
                if (node.id === linking.id) {return { ...node, links: [...node.links, newLink] };}
                return node;
              })
            );

            let fromSide = newLink.fromSide;
            let toSide = newLink.toSide;
    
            if (newLink.lineStyle === 'curved') {
              fromSide = 'topRight';
              toSide = 'topLeft';
            }
                
            // 연결 생성 후 바로 텍스트 입력 모드로 전환
            const fromPoint = getLinkPoint(fromNode, fromSide);
            const toPoint = getLinkPoint(clickedNode, toSide);

            let textX, textY;

            if (newLink && newLink.lineStyle === 'curved') {
              const textOffset = 15; // 텍스트와 선 사이의 거리
              const topPoint = getCurvedLinkTopPoint(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);
              textX = topPoint.x;
              textY = topPoint.y + textOffset;  // 최상위 접선에 바로 위치
            } else {
              const textOffset = 10; // 텍스트와 선 사이의 거리
              const {x, y, textAlign, textBaseline} = getSolidLinkTopPoint(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y, textOffset);
              textX = x || 0;
              textY = y || 0;
            }
            
            setEditingLink({
              startNode: fromNode,
              endNode: clickedNode,
              fromSide: linking.side,
              toSide: side,
              lineStyle: lineStyle,
              x: textX,
              y: textY
            });

            let link = '';
            if (newLink.lineStyle === 'curved') {link = 'Describing';}
            else if (newLink.lineStyle === 'solid') {link = 'Adding';}
            else if (newLink.lineStyle === 'dashed') {link = 'verbing';}

            setLinkText(link);            
          }
          setLinking(null);
          setTemporaryLink(null);
        }
      }
    }
  };

  const handleToolChange = (newTool: Tool) => {
    if (newTool !== 'move') {
      setNodes((prevNodes) => prevNodes.map((node) => ({ ...node, selected: false })));
    }
    setTool(newTool);
    if (newTool === 'addNode') {
      setPenColor('#FFFFFF');
      handleAddNode();
      setTool('move');
    } else if (newTool === 'draw') {
      setPenColor('#000000');
    }
  };

  const handleAlignNodesVertically = () => {
    setNodes(alignNodesVertically(nodes));
  };

  const handleAlignNodesHorizontally = () => {
    setNodes(alignNodesHorizontally(nodes));
  };
  
  const handleNodeColorChange = (color: string) => {
    setNodeColor(color);
    setNodes((prevNodes) => prevNodes.map((node) => 
      node.selected ? { ...node, backgroundColor: color } : node
    ));
  };

  const handleNodeBorderColorChange = (color: string): void => {
    setNodeBorderColor(color);
    setNodes((prevNodes) => prevNodes.map((node) => 
      node.selected ? { ...node, borderColor: color } : node
    ));
  };

  const handlePenColorChange = (color: string) => {
    setPenColor(color);
  };
  

  // 히토리에 현재 상태 추가 함수 수정
  const addToHistory = () => {
    setHistory(prevHistory => {
      // 새로운 상태를 추가합니다.
      const newNodes = [...prevHistory.nodes, [...nodes]];
      const newDrawings = [...prevHistory.drawings, [...drawingActions]];
      
      // 최근 10건만 유지합니다.
      const slicedNodes = newNodes.slice(-MAX_HISTORY_LENGTH);
      const slicedDrawings = newDrawings.slice(-MAX_HISTORY_LENGTH);
      
      // console.log(slicedNodes);
      // console.log(slicedDrawings);

      return {
        nodes: slicedNodes,
        drawings: slicedDrawings
      };
    });
  
    // 히스토리가 추가될 때마다 인덱스를 업데이트합니다.
    setHistoryIndex(prevIndex => Math.min(prevIndex + 1, MAX_HISTORY_LENGTH - 1));
  };
  
  // Undo 기능 수정
  const undo = () => {
    if (historyIndex > 0) {
      isUndoRedoActionRef.current = true;
      const newIndex = historyIndex - 1;
      setNodes(history.nodes[newIndex]);
      setDrawingActions(history.drawings[newIndex]);
      setHistoryIndex(newIndex);
      // setTimeout을 사용하여 상태 업데이트 후 플래그를 리셋
      setTimeout(() => {
        isUndoRedoActionRef.current = false;
      }, 0);
    }
  };

  const redo = () => {
    if (historyIndex < history.nodes.length - 1) {
      isUndoRedoActionRef.current = true;
      const newIndex = historyIndex + 1;
      setNodes(history.nodes[newIndex]);
      setDrawingActions(history.drawings[newIndex]);
      setHistoryIndex(newIndex);
      // setTimeout을 사용하여 상태 업데이트 후 플래그를 리셋
      setTimeout(() => {
        isUndoRedoActionRef.current = false;
      }, 0);
    }
  };
  

  // 저장 버튼 클릭 핸들러 함수 추가
  const handleSaveClick = () => {
    if (nodes.length === 0 && drawingActions.length === 0) {
      toast.warning('저장할 내용이 없습니다. 노드를 추가하거나 그림을 그려주세요.');
      return;
    }
    setShowSavePopup(true);
  };

  // 저장 기능 수정
  const handleSaveCanvas = (title: string) => {
    saveCanvas(title, nodes, drawingActions, author, email, setShowSavePopup);
  };

  // 음성 읽기 함수 수정
  const readSelectedTexts = (selectedTexts: string[]) => {
    if (selectedTexts.length > 0 && typeof window !== 'undefined' && window.speechSynthesis) {
      const textToRead = selectedTexts.join(' ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-US'; // 영어로 설정
      utterance.rate = 1.0; // 말하기 속도 설정 (1.0이 기본값)
      utterance.pitch = 1.0; // 음높이 설정 (1.0이 본)
      window.speechSynthesis.speak(utterance);
    }
  };

  // 노드 선택 이벤트를 제외한 변경사항만 감지하는 함수
  const hasSignificantChanges = (prevNodes: Node[], currentNodes: Node[]) => {
    if (prevNodes.length !== currentNodes.length) return true;
    
    for (let i = 0; i < prevNodes.length; i++) {
      const prevNode = prevNodes[i];
      const currentNode = currentNodes[i];
      
      for (const key in prevNode) {
        if (key === 'selected') continue; // 'selected' 속성 변경은 무시
        if (key === 'links') {
          // links 배열의 길이나 내용이 변경되었는지 확인
          if (!Array.isArray(prevNode.links) || !Array.isArray(currentNode.links) ||
              prevNode.links.length !== currentNode.links.length ||
              JSON.stringify(prevNode.links) !== JSON.stringify(currentNode.links)) {
            return true;
          }
        } else if (prevNode[key as keyof Node] !== currentNode[key as keyof Node]) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  const handleStartRecording = () => {startRecording(setIsRecording, setRecordingBlob, setShowSaveRecordingPopup, mediaRecorderRef);};
  const handleStopRecording = () => {stopRecording(mediaRecorderRef);};
  const handleSaveRecording = (author: string, email: string, title: string) => {saveRecording(author, email, title, recordingBlob, setShowSaveRecordingPopup, setRecordingBlob);};

  useEffect(() => {
    const mode = searchParams?.get('mode') || 'edit';
    if (mode === 'play') {setTool('draw');}
    else {setTool('move');}

    const loadLesson = async () => {
      if (params.id === 'new') {
        setIsLoading(false);
        addToHistory();
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/lessons/?id=${params.id}`);
        if (!response.ok) {throw new Error('교안을 찾을 수 없습니다');}

        const lessonData = await response.json();
        
        // lessonData.path에서 파일 경로 읽기
        const filePath = `${lessonData.rows[0].path}`;
        
        // 파일 내용 읽기
        const fileResponse = await fetch(filePath);
        if (!fileResponse.ok) {throw new Error('파일을 찾을 수 없습니다');}

        const fileData = await fileResponse.json();

        setNodes(fileData.nodes);
        setDrawingActions(fileData.drawings);
        // maxIndex 업데이트
        const maxNodeIndex = Math.max(...fileData.nodes.map((node: Node) => node.zIndex), 0);
        setMaxZIndex(maxNodeIndex);
        setLastNodePosition({ x: fileData.nodes[fileData.nodes.length - 1].x, y: fileData.nodes[fileData.nodes.length - 1].y });
        
        // 그리기 객체 복원
        const drawingCanvas = drawingCanvasRef.current;
        if (drawingCanvas) { 
          const ctx = drawingCanvas.getContext('2d');
          if (ctx) {
            fileData.drawings.forEach((imageData: string) => {
              const img = new Image();
              img.onload = () => {ctx.drawImage(img, 0, 0);};
              img.src = imageData;
            });
          }
        }
      } catch (error) {
        console.error('레슨 불러오기 실패:', error);
        toast.error('레슨을 불러오는 데 실패했습니다: ' + (error as Error).message);
      } finally {setIsLoading(false);}
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
        if (ctx) {redrawCanvas(ctx, nodes, drawingActions, selectionArea);}
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
    return () => {window.removeEventListener('keydown', handleKeyDownEvent);};
  }, [handleKeyDown]);
    
  useEffect(() => {
    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (canvas && drawingCanvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawCanvas(ctx, nodes, drawingActions, dragging ? null : selectionArea);      

        // 임시 연결선 그리기
        if (temporaryLink) {
          let nodesWithTemporaryLink = nodes;
      
          if (temporaryLink) {
            const tempNode: Node = {id: -1, x: temporaryLink.endX, y: temporaryLink.endY, width: 1, height: 1, text1: '', text2: '', text3: '', backgroundColor: '', borderColor: '', links: [], zIndex: 0, selected: false, rotation: 0};
            
            const tempLink: Link = {id: '-1', fromSide: temporaryLink.startSide, toSide: 'left', lineStyle: lineStyle};
            
            nodesWithTemporaryLink = [
              ...nodes.map(node => 
                node.id === temporaryLink.startNode.id ? { ...node, links: [...node.links, tempLink] } : node
              ),
              tempNode
            ];
          }
    
          // redrawCanvas(ctx, nodesWithTemporaryLink, drawingActions, dragging ? null : selectionArea);
          drawLinks(ctx, nodesWithTemporaryLink);
        }
      }
    }
  }, [nodes, selectionArea, dragging, temporaryLink, lineStyle, drawingActions]);

  useEffect(() => {
    if (
      !isUndoRedoActionRef.current &&
      !isDragging &&  // 드래그 중이 아닐 때만 히스토리에 추가
      (hasSignificantChanges(prevNodesRef.current, nodes) ||
      JSON.stringify(prevDrawingActionsRef.current) !== JSON.stringify(drawingActions))
    ) {
      addToHistory();
      prevNodesRef.current = nodes;
      prevDrawingActionsRef.current = drawingActions;
    }
  }, [nodes, drawingActions, isDragging]);

  useEffect(() => {
    setUndoCount(historyIndex);
    setRedoCount(history.nodes.length - historyIndex - 1);
  }, [historyIndex]);


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
          onTouchStart={(e) => handleTouchStart(e, drawingCanvasRef, setTouchStartPos, handleMouseDown)}
          onTouchMove={(e) => handleTouchMove(e, touchStartPos, handleMouseMove)}
          onTouchEnd={(e) => handleTouchEnd(e, drawingCanvasRef, setTouchStartPos, handleMouseUp)}
        />
        {eraserPosition.visible && (
          <div style={{ position: 'absolute', left: eraserPosition.x - eraserSize / 2, top: eraserPosition.y - eraserSize / 2, width: eraserSize, height: eraserSize, border: '1px solid black', borderRadius: '50%', pointerEvents: 'none', zIndex: 3 }} />
        )}
        {editingNode && (
          <div style={{ position: 'absolute', left: editingNode.x, top: editingNode.y, width: editingNode.width, height: editingNode.height, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #05f', borderRadius: '0px', padding: '5px' }}>
            <input value={editText.text1} onChange={(e) => setEditText({ ...editText, text1: e.target.value })} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '90%', marginBottom: '5px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#f07500' }} placeholder="텍스트 1" autoFocus />
            <input value={editText.text2} onChange={(e) => setEditText({ ...editText, text2: e.target.value })} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '90%', marginBottom: '5px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }} placeholder="텍스트 2" />
            <input value={editText.text3} onChange={(e) => setEditText({ ...editText, text3: e.target.value })} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '90%', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }} placeholder="텍스트 3" onBlur={handleFinishEditing} onKeyDown={(e) => { if (e.key === 'Enter') { handleFinishEditing(); } }} />
          </div>
        )}
        {editingLink && (
          <div style={{ position: 'absolute', left: editingLink.x, top: editingLink.y, transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            <input 
              value={linkText} 
              onChange={(e) => setLinkText(e.target.value)} 
              onBlur={handleFinishEditingLink} 
              onKeyDown={(e) => { if (e.key === 'Enter') handleFinishEditingLink(); }} 
              style={{ padding: '5px', border: 'none', outline: 'none', backgroundColor: 'transparent', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', width: '80px' }} 
              placeholder="설명 입력" 
              autoFocus 
            />
          </div>
        )}
      </div>
      <div style={{ paddingTop: '20px', paddingBottom: '20px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 10, gap: '10px' }}>
        {shouldRenderTool('save') && <ToolButton tool="save" icon="/icon-save.svg" onClick={handleSaveClick} currentTool={tool} />}
        {shouldRenderTool('move') && <ToolButton tool="move" icon="/icon-move.svg" onClick={() => handleToolChange('move')} currentTool={tool} />}
        {shouldRenderTool('draw') && <ToolButton tool="draw" icon="/icon-draw.svg" onClick={() => handleToolChange('draw')} currentTool={tool} />}
        {shouldRenderTool('addNode') && <ToolButton tool="addNode" icon="/icon-addnode.svg" onClick={() => handleToolChange('addNode')} currentTool={tool} />}
        {shouldRenderTool('link') && <ToolButton tool="link" icon="/icon-connect.svg" onClick={() => handleToolChange('link')} currentTool={tool} />}
        {shouldRenderTool('erase') && <ToolButton tool="erase" icon="/icon-erase.svg" onClick={() => handleToolChange('erase')} currentTool={tool} />}
        {shouldRenderTool('clear') && <ToolButton tool="clear" icon="/icon-clear.svg" onClick={() => setShowClearConfirmPopup(true)} currentTool={tool} />}
        {shouldRenderTool('alignVertical') && <ToolButton tool="alignVertical" icon="/icon-alignv.svg" onClick={handleAlignNodesVertically} currentTool={tool} />}
        {shouldRenderTool('alignHorizontal') && <ToolButton tool="alignHorizontal" icon="/icon-alignh.svg" onClick={handleAlignNodesHorizontally} currentTool={tool} />}
        {shouldRenderTool('record') && <ToolButton tool="record" icon={isRecording ? "/icon-stop-rec.svg" : "/icon-start-rec.svg"} onClick={isRecording ? handleStopRecording : handleStartRecording} currentTool={tool} />}
        <ToolButton tool="undo" icon="/icon-undo.svg" onClick={undo} currentTool={tool} count={undoCount} />
        <ToolButton tool="redo" icon="/icon-redo.svg" onClick={redo} currentTool={tool} count={redoCount}/>
        <ToolButton tool="voice" icon={isVoiceEnabled ? "/icon-voice-on.svg" : "/icon-voice-off.svg"} onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} currentTool={isVoiceEnabled ? 'voice' : ''} />
        {mode !== 'play' && (
          <>
            <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px' }}>노드 색상</label>
              <select value={nodeColor} onChange={(e) => handleNodeColorChange(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
                <option value="#FFFFFF">흰색</option>
                <option value="#FFD700">오렌지</option>
                <option value="#acf">밝은파랑</option>
                <option value="#90EE90">밝은녹색</option>
              </select>
            </div>
          </>
        )}
        {mode !== 'play' && (
          <>
            <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px' }}>노드 테두리</label>
              <select value={nodeBorderColor} onChange={(e) => handleNodeBorderColorChange(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}>
                <option value="#05f">밝은파랑</option>
                <option value="#fd5500">빨강</option>
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
              onChange={(e) => handleLineStyleChange(e.target.value as 'solid' | 'dashed' | 'curved')} 
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '14px' }}
            >
              <option value="solid">실선</option>
              <option value="dashed">점선</option>
              <option value="curved">곡선</option>
            </select>
          </div>
        )}
      </div>
      {showSavePopup && <SaveLessonPopup onSave={handleSaveCanvas} onCancel={() => setShowSavePopup(false)} />}
      {showSaveRecordingPopup && <SaveRecordingPopup author={author || ''} email={email || ''} onSave={handleSaveRecording} onCancel={() => setShowSaveRecordingPopup(false)} />}
      {showClearConfirmPopup && <ClearConfirmPopup onConfirm={clearAll} onCancel={() => setShowClearConfirmPopup(false)} />}
      <ToastContainer position="bottom-right" autoClose={1000} />
    </div>
  );
};

export default EditStudyBoardClient;
