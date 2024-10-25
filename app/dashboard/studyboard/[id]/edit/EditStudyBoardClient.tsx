'use client';

import React, { useRef, useEffect, useState, KeyboardEvent, useCallback, use } from 'react';
import { PencilIcon, CloudArrowUpIcon, RectangleGroupIcon, ArrowLongRightIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, TrashIcon, AdjustmentsHorizontalIcon, AdjustmentsVerticalIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import ToolButton from '@/ui/component/ToolButton';
import SaveLessonPopup from '@/ui/component/SaveLessonPopup';
import SaveRecPopup from '@/ui/component/SaveRecPopup';
import ClearConfirmPopup from '@/ui/component/ClearConfirmPopup';
import NodeSelector from '@/ui/component/NodeSelector';
import { redrawCanvas, isNodeInSelectionArea, getLinkPnt, getCurvedLinkTopPnt, getSolidLinkTopPnt, drawLinks, addNode, getClickedNodeAndHandle, getClickedNode, getNodeSide, getTouchPos, isDragSignificant } from './utils/canvasUtils';
import { startRec, stopRec, saveRec } from './utils/recUtils';
import { Tool, Node, DragState, SelectionArea, DrawAction, Link, TemporaryLink, EditLink } from './types';
import { CircularProgress, Box } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { deleteSelectedNodes } from './utils/canvasUtils';
import { startEdit, finishEdit, cancelEdit } from './utils/canvasUtils';
import { alignNodesV, alignNodesH } from './utils/canvasUtils';
import { saveCanvas } from './utils/canvasUtils';
import { finishEditLink } from './utils/canvasUtils';
import { hndTouchStart, hndTouchMove, hndTouchEnd } from './utils/touchHandlers';

interface EditStudyBoardClientProps {params: { id: string }; author: string | null; email: string | null;}

const EditStudyBoardClient: React.FC<EditStudyBoardClientProps> = ({ params, author, email }) => {
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'edit';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [drawActions, setDrawActions] = useState<DrawAction[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [tool, setTool] = useState('move');
  const [nodeColor, setNodeColor] = useState('#FFF');
  const [nodeBorderColor, setNodeBorderColor] = useState('#05f');
  const [penColor, setPenColor] = useState('#000');
  const [lineWidth, setLineWidth] = useState<string>('4');
  const [eraserPos, setEraserPos] = useState({ x: 0, y: 0, visible: false });
  const [eraserSize, setEraserSize] = useState(100);
  const [resize, setResize] = useState<{ node: Node; direction: string } | null>(null);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(null);
  const [linking, setLinking] = useState<{ id: number; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'curved'>('solid');
  const [isRec, setIsRec] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [editNode, setEditNode] = useState<Node | null>(null);
  const [editText, setEditText] = useState({ text1: '', text2: '', text3: '' });
  const [history, setHistory] = useState<{ nodes: Node[][], draws: DrawAction[][] }>({ nodes: [], draws: [] });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastNodePos, setLastNodePos] = useState({ x: 100, y: 200 });
  const originalSpeakRef = useRef<typeof window.speechSynthesis.speak | null>(null);
  const [isSelect, setIsSelect] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrag, setIsDrag] = useState(false);
  const [isDragGroup, setIsDragGroup] = useState(false);
  const [RecBlob, setRecBlob] = useState<Blob | null>(null);
  const [isLoad, setIsLoad] = useState(true);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSaveRecPopup, setShowSaveRecPopup] = useState(false);
  const [showClearConfirmPopup, setShowClearConfirmPopup] = useState(false);
  const [currDrawPnts, setcurrDrawPnts] = useState<{ x: number; y: number }[]>([]);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [editLink, setEditLink] = useState<EditLink | null>(null);
  const [linkText, setLinkText] = useState('');
  const prevNodesRef = useRef(nodes);
  const prevDrawActionsRef = useRef(drawActions);
  const isUndoRedoActionRef = useRef(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [temporaryLink, setTemporaryLink] = useState<TemporaryLink | null>(null);
  const MAX_HISTORY_LENGTH = 30; // 적절한 값으로 조정

  const hiddenToolsInPlayMode = ['save', 'move', 'addNode', 'link', 'clear', 'alignVertical', 'alignHorizontal'];
  const hiddenToolsInEditMode = ['draw', 'erase', 'record'];
  const nodeColors = [{ value: "#FFFFFF", label: "흰색" }, { value: "#FFD700", label: "오렌지" }, { value: "#acf", label: "밝은파랑" }, { value: "#90EE90", label: "밝은녹색" },
  ];
  const nodeBorderColors = [{ value: "#05F", label: "밝은파랑" }, { value: "#FD5500", label: "빨강" }];
  const penColors = [{ value: "#000000", label: "검정" }, { value: "#FF4500", label: "빨강" }, { value: "#0000FF", label: "파랑" }];
  const lineWidths = [{ value: "1", label: "얇게" }, { value: "2", label: "보통" }, { value: "4", label: "굵게" }, { value: "8", label: "매우 굵게" }];
  const eraserSizes = [{ value: "50", label: "작게" }, { value: "100", label: "보통" }, { value: "200", label: "크게" }];
  const linkStyles = [{ value: "solid", label: "실선" }, { value: "dashed", label: "점선" }, { value: "curved", label: "곡선" }];

  // 전체 지우기 함수
  const clearAll = () => {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {ctx.clearRect(0, 0, canvas.width, canvas.height);}
    }
    setNodes([]);
    setDrawActions([]);
    setHistory({ nodes: [], draws: [] });
    setHistoryIndex(-1);
    setShowClearConfirmPopup(false);
    setLastNodePos({ x: 100, y: 200 });
  };

  // 툴 버튼을 렌더링할지 결정하는 함수
  const shouldRenderTool = (toolName: string) => {
    if (mode === 'play' && hiddenToolsInPlayMode.includes(toolName)) {return false;}
    if (mode === 'edit' && hiddenToolsInEditMode.includes(toolName)) {return false;}
    return true;
  };

  const hndAddNode = () => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const { newNode, newMaxZIndex, newLastNodePos } = addNode(
      nodes,
      canvasRect.width,
      canvasRect.height,
      lastNodePos,
      maxZIndex
    );

    setNodes((prevNodes) => [...prevNodes.map((node) => ({ ...node, selected: false })), newNode]);
    setMaxZIndex(newMaxZIndex);
    setLastNodePos(newLastNodePos);
    startEdit(newNode, setEditNode, setEditText);
  };

  const hndDeleteSelectedNodes = () => {
    const updatedNodes = deleteSelectedNodes(nodes);
    setNodes(updatedNodes);
  };

  const hndLineStyleChange = (style: string) => {
    setLineStyle(style as 'solid' | 'dashed' | 'curved');
    hndToolChange('link');
  };
  
  const hndStartEdit = (node: Node) => {startEdit(node, setEditNode, setEditText);};
  const hndFinishEdit = () => {finishEdit(editNode, editText, canvasRef.current, setNodes, setEditNode, setEditText);};
  const hndCancelEdit = () => {cancelEdit(setEditNode, setEditText);};
  const hndFinishEditLink = () => {finishEditLink(editLink, linkText, setNodes, setEditLink, setLinkText);};

  const hndKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete') {hndDeleteSelectedNodes();
    } else if (e.key === 'Escape') {
      // ESC 키를 눌렀을 때 연결선 그리기 초기화
      setLinking(null);
      setTemporaryLink(null);
    } else if (editNode) {
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLInputElement) {
          const inputs = document.querySelectorAll('input');
          const currIndex = Array.from(inputs).indexOf(e.target as HTMLInputElement);
          if (currIndex < inputs.length - 1) {(inputs[currIndex + 1] as HTMLInputElement).focus();
          } else {hndFinishEdit();}
        } else {hndFinishEdit();}
      } else if (e.key === 'Escape') {hndCancelEdit();}
    } else {
      const selectedNode = nodes.find(node => node.selected);
      if (selectedNode && e.key.length === 1) {hndStartEdit(selectedNode);}
    }
  }, [nodes, editNode]);

  const hndMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      const clickedNode = getClickedNode(nodes, offsetX, offsetY);
      
      if (clickedNode) {
        if (!clickedNode.selected) {
          // 선택되지 않은 노드를 클릭한 경우, 해당 노드만 선택
          setNodes(prevNodes => prevNodes.map(node => ({...node, selected: node.id === clickedNode.id})));
        }
        // 그룹 드래그 시작
        setIsDragGroup(true);
      } else {
        // 빈 공간 클릭 시 선택 영역 드래그 시작
        setSelectionArea({ startX: offsetX, startY: offsetY, endX: offsetX, endY: offsetY });
        setIsSelect(true);
      }
      
      setDragStartPos({ x: offsetX, y: offsetY });
    } else if (tool === 'link') {
      const { offsetX, offsetY } = e.nativeEvent;
      const clickedNode = getClickedNode(nodes, offsetX, offsetY);
      if (clickedNode) {
        const side = getNodeSide(clickedNode, offsetX, offsetY);
        setTemporaryLink({ startNode: clickedNode, startSide: side, endX: offsetX, endY: offsetY });
      }
    }

    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'draw' || tool === 'erase') {
      setIsDraw(true);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        // 그리기 시작 점 설정
        setcurrDrawPnts([{ x, y }]);
      }
    } else if (tool === 'move') {
      const { node, handle } = getClickedNodeAndHandle(nodes, x, y);
      if (node) {
        setIsDrag(true);        
        if (handle) {setResize({ node, direction: handle });}
        else {
          const selectedNodes = nodes.filter((n) => n.selected);
          if (selectedNodes.length > 1 && node.selected) {
            // 여러 노드가 선택된 경우
            setDrag({node: {id: -1, x: x, y: y, width: 0, height: 0, text1: '', text2: '', text3: '', links: [], zIndex: 0, backgroundColor: '', borderColor: '', selected: false },offsetX: x, offsetY: y, selectedNodes: selectedNodes});
          } else {
            setDrag({ node, offsetX: x - node.x, offsetY: y - node.y });
            setNodes(nodes.map((n) => ({ ...n, selected: n.id === node.id })));
          }
        }
      } else {
        setSelectionArea({ startX: x, startY: y, endX: x, endY: y });
        setNodes(nodes.map((n) => ({ ...n, selected: false })));
      }
    }
  };

  const hndMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      
      if (isDragGroup && dragStartPos) {
        setDragStartPos({ x: offsetX, y: offsetY });
      } else if (isSelect && !resize) {
        // 다중 선택을 위한 드래그 (리사이징 중이 아닐 때만)
        setSelectionArea(prev => prev ? { ...prev, endX: offsetX, endY: offsetY } : null);
      }
    } else if (tool === 'link' && temporaryLink) {
      const { offsetX, offsetY } = e.nativeEvent;
      setTemporaryLink(prev => prev ? { ...prev, endX: offsetX, endY: offsetY } : null);
    }

    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDraw) {
      const ctx = canvas.getContext('2d');
      if (ctx) { 
        if (tool === 'draw') {
          // 현재 그리기 점 추가
          setcurrDrawPnts(prevPnts => [...prevPnts, { x, y }]);

          if (currDrawPnts.length < 2) return;

          ctx.strokeStyle = penColor;
          ctx.lineWidth = Number(lineWidth);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(currDrawPnts[0].x, currDrawPnts[0].y);
      
          for (let i = 1; i < currDrawPnts.length; i++) {
            const currPnt = currDrawPnts[i];
            const previousPnt = currDrawPnts[i - 1];
            const midPnt = {x: (previousPnt.x + currPnt.x) / 2, y: (previousPnt.y + currPnt.y) / 2};
      
            ctx.quadraticCurveTo(previousPnt.x, previousPnt.y, midPnt.x, midPnt.y);
          }    
          ctx.stroke();          

        } else if (tool === 'erase') {
          ctx.lineTo(x, y);
          ctx.strokeStyle = 'rgba(255,255,255,1)';
          ctx.lineWidth = eraserSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          // 현재 그리기 점 추가
          setcurrDrawPnts(prevPnts => [...prevPnts, { x, y }]);
        }
      }
    } else if (drag) {
      if (drag.node.id === -1) {
        // 여러 노드가 선택된 경우
        const dx = x - drag.offsetX;
        const dy = y - drag.offsetY;
        const newNodes = nodes.map((node) => {
          if (node.selected) {return { ...node, x: node.x + dx, y: node.y + dy };}
          return node;
        });
        setNodes(newNodes);
        setDrag({ ...drag, offsetX: x, offsetY: y });
      } else {
        // 단일 노드 이동
        const newNodes = nodes.map((node) => {
          if (node.id === drag.node.id) {return { ...node, x: x - drag.offsetX, y: y - drag.offsetY };}
          return node;
        });
        setNodes(newNodes);
        setLastNodePos({ x: x - drag.offsetX, y: y - drag.offsetY });
      }
    } else if (resize) {
      const newNodes = nodes.map((node) => {
        if (node.id === resize.node.id) {
          let newWidth = node.width;
          let newHeight = node.height;
          let newX = node.x;
          let newY = node.y;

          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.font = 'bold 18px Arial';
            const minWidth = Math.max(120, ctx.measureText(node.text2).width + 40);
            const minHeight = 100;

            if (resize.direction.includes('e')) newWidth = Math.max(minWidth, x - node.x);
            if (resize.direction.includes('w')) {
              newWidth = Math.max(minWidth, node.x + node.width - x);
              newX = Math.min(x, node.x + node.width - minWidth);
            }
            if (resize.direction.includes('s')) newHeight = Math.max(minHeight, y - node.y);
            if (resize.direction.includes('n')) {
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

    if (tool === 'erase') {setEraserPos({ x, y, visible: true });}
    else {setEraserPos({ x: 0, y: 0, visible: false });}
  };

  const hndMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraw(false);
    setDrag(null);
    setResize(null);
    setIsDrag(false);

    if (tool === 'move') {
      const { offsetX, offsetY } = e.nativeEvent;
      
      if (isDragGroup) {
        // 그룹 드래그 종료
        setIsDragGroup(false);
      } else if (isSelect) {
        // 다중 선택 종료
        setIsSelect(false);
        if (isDragSignificant(dragStartPos!, { x: offsetX, y: offsetY })) {
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
    setDragStartPos(null);

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
    if (isDraw && (tool === 'draw' || tool === 'erase')) {
      setDrawActions(prevActions => [
        ...prevActions,
        {
          type: tool,
          pnts: currDrawPnts,
          color: tool === 'draw' ? penColor : '#FFF',
          lineWidth: tool === 'draw' ? Number(lineWidth) : eraserSize
        }
      ]);
      setcurrDrawPnts([]);
      if (tool === 'erase') {setTool('draw');}
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
            const fromPnt = getLinkPnt(fromNode, fromSide);
            const toPnt = getLinkPnt(clickedNode, toSide);

            let textX, textY;

            if (newLink && newLink.lineStyle === 'curved') {
              const textOffset = 15; // 텍스트와 선 사이의 거리
              const topPnt = getCurvedLinkTopPnt(fromPnt.x, fromPnt.y, toPnt.x, toPnt.y);
              textX = topPnt.x;
              textY = topPnt.y + textOffset;  // 최상위 접선에 바로 위치
            } else {
              const textOffset = 10; // 텍스트와 선 사이의 거리
              const {x, y, textAlign, textBaseline} = getSolidLinkTopPnt(fromPnt.x, fromPnt.y, toPnt.x, toPnt.y, textOffset);
              textX = x || 0;
              textY = y || 0;
            }
            
            setEditLink({ startNode: fromNode, endNode: clickedNode, fromSide: linking.side, toSide: side, lineStyle: lineStyle, x: textX, y: textY });

            let link = '';
            if (newLink.lineStyle === 'curved') {link = 'Describing';}
            else if (newLink.lineStyle === 'solid') {link = 'Adding';}
            else if (newLink.lineStyle === 'dashed') {link = 'Verbing';}

            setLinkText(link);            
          }
          setLinking(null);
          setTemporaryLink(null);
        }
      }
    }
  };

  const hndToolChange = (newTool: Tool) => {
    if (newTool !== 'move') {
      setNodes((prevNodes) => prevNodes.map((node) => ({ ...node, selected: false })));
    }
    setTool(newTool);
    if (newTool === 'addNode') {
      setPenColor('#FFFFFF');
      hndAddNode();
      setTool('move');
    } else if (newTool === 'draw') {
      setPenColor('#000000');
    }
  };

  const hndAlignNodesV = () => {setNodes(alignNodesV(nodes));};
  const hndAlignNodesH = () => {setNodes(alignNodesH(nodes));};
  
  const hndNodeColorChange = (color: string) => {
    setNodeColor(color);
    setNodes((prevNodes) => prevNodes.map((node) => 
      node.selected ? { ...node, backgroundColor: color } : node
    ));
  };

  const hndNodeBorderColorChange = (color: string): void => {
    setNodeBorderColor(color);
    setNodes((prevNodes) => prevNodes.map((node) => 
      node.selected ? { ...node, borderColor: color } : node
    ));
  };

  const hndPenColorChange = (color: string) => {setPenColor(color);};
  const hndLineWidthChange = (lineWidth: string) => {setLineWidth(lineWidth);};
  const hndEraserSizeChange = (eraserSize: string) => {setEraserSize(Number(eraserSize));};

  // 히토리에 현재 상태 추가 함수 수정
  const addToHistory = () => {
    setHistory(prevHistory => {
      // 새로운 상태를 추가합니다.
      const newNodes = [...prevHistory.nodes, [...nodes]];
      const newDraws = [...prevHistory.draws, [...drawActions]];
      
      // 최근 10건만 유지합니다.
      const slicedNodes = newNodes.slice(-MAX_HISTORY_LENGTH);
      const slicedDraws = newDraws.slice(-MAX_HISTORY_LENGTH);
      
      // console.log(slicedNodes);
      // console.log(slicedDraws);

      return {
        nodes: slicedNodes,
        draws: slicedDraws
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
      setDrawActions(history.draws[newIndex]);
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
      setDrawActions(history.draws[newIndex]);
      setHistoryIndex(newIndex);
      // setTimeout을 사용하여 상태 업데이트 후 플래그를 리셋
      setTimeout(() => {
        isUndoRedoActionRef.current = false;
      }, 0);
    }
  };
  

  // 저장 버튼 클릭 핸들러 함수 추가
  const hndSaveClick = () => {
    if (nodes.length === 0 && drawActions.length === 0) {
      toast.warn('저장할 내용이 없습니다. 노드를 추가하거나 그림을 그려주세요.');
      return;
    }
    setShowSavePopup(true);
  };

  // 저장 기능 수정
  const hndSaveCanvas = (title: string) => {saveCanvas(title, nodes, drawActions, author, email, setShowSavePopup);};

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
  const hasSignificantChanges = (prevNodes: Node[], currNodes: Node[]) => {
    if (prevNodes.length !== currNodes.length) return true;
    
    for (let i = 0; i < prevNodes.length; i++) {
      const prevNode = prevNodes[i];
      const currNode = currNodes[i];
      
      for (const key in prevNode) {
        if (key === 'selected') continue; // 'selected' 속성 변경은 무시
        if (key === 'links') {
          // links 배열의 길이나 내용이 변경되었는지 확인
          if (!Array.isArray(prevNode.links) || !Array.isArray(currNode.links) ||
              prevNode.links.length !== currNode.links.length ||
              JSON.stringify(prevNode.links) !== JSON.stringify(currNode.links)) {
            return true;
          }
        } else if (prevNode[key as keyof Node] !== currNode[key as keyof Node]) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  const hndStartRec = () => {startRec(setIsRec, setRecBlob, setShowSaveRecPopup, mediaRecorderRef);};
  const hndStopRec = () => {stopRec(mediaRecorderRef);};
  const hndSaveRec = (author: string, email: string, title: string) => {saveRec(author, email, title, RecBlob, setShowSaveRecPopup, setRecBlob);};

  useEffect(() => {
    const mode = searchParams?.get('mode') || 'edit';
    if (mode === 'play') {setTool('draw');}
    else {setTool('move');}

    const loadLesson = async () => {
      if (params.id === 'new') {
        setIsLoad(false);
        addToHistory();
        return;
      }

      setIsLoad(true);
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
        setDrawActions(fileData.draws);
        // maxIndex 업데이트
        const maxNodeIndex = Math.max(...fileData.nodes.map((node: Node) => node.zIndex), 0);
        setMaxZIndex(maxNodeIndex);
        setLastNodePos({ x: fileData.nodes[fileData.nodes.length - 1].x, y: fileData.nodes[fileData.nodes.length - 1].y });
        
        // 그리기 객체 복원
        const drawCanvas = drawCanvasRef.current;
        if (drawCanvas) { 
          const ctx = drawCanvas.getContext('2d');
          if (ctx) {
            fileData.draws.forEach((imageData: string) => {
              const img = new Image();
              img.onload = () => {ctx.drawImage(img, 0, 0);};
              img.src = imageData;
            });
          }
        }
      } catch (error) {
        console.error('레슨 불러오기 실패:', error);
        toast.error('레슨을 불러오는 데 실패했습니다: ' + (error as Error).message);
      } finally {
        setIsLoad(false);
      }
    };

    loadLesson();
  }, [params.id]);

  useEffect(() => {
    const resizeCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const drawCanvas = drawCanvasRef.current;

      if (container && canvas && drawCanvas) {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        drawCanvas.width = width;
        drawCanvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {redrawCanvas(ctx, nodes, drawActions, selectionArea);}
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes, drawActions, selectionArea]);

  useEffect(() => {
    // 브라우저 환경에서만 실행되도록 합니다.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      originalSpeakRef.current = window.speechSynthesis.speak.bind(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    const hndKeyDownEvent = (e: globalThis.KeyboardEvent) => hndKeyDown(e as unknown as KeyboardEvent);
    window.addEventListener('keydown', hndKeyDownEvent);
    return () => {window.removeEventListener('keydown', hndKeyDownEvent);};
  }, [hndKeyDown]);
    
  useEffect(() => {
    const canvas = canvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (canvas && drawCanvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawCanvas(ctx, nodes, drawActions, drag ? null : selectionArea);      

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
    
          drawLinks(ctx, nodesWithTemporaryLink);
        }
      }
    }
  }, [nodes, selectionArea, drag, temporaryLink, lineStyle, drawActions]);

  useEffect(() => {
    if (
      !isUndoRedoActionRef.current &&
      !isDrag &&  // 드래그 중이 아닐 때만 히스토리에 추가
      (hasSignificantChanges(prevNodesRef.current, nodes) ||
      JSON.stringify(prevDrawActionsRef.current) !== JSON.stringify(drawActions))
    ) {
      addToHistory();
      prevNodesRef.current = nodes;
      prevDrawActionsRef.current = drawActions;
    }
  }, [nodes, drawActions, isDrag]);

  useEffect(() => {
    setUndoCount(historyIndex);
    setRedoCount(history.nodes.length - historyIndex - 1);
  }, [historyIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', margin: '2px', borderRadius: '10px', backgroundColor: 'white', boxShadow: '2px 2px 2px rgba(0,0,0,0.1)' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
        <canvas
          ref={drawCanvasRef}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
          onMouseDown={hndMouseDown}
          onMouseMove={hndMouseMove}
          onMouseUp={hndMouseUp}
          onMouseLeave={hndMouseUp}
          onTouchStart={(e) => hndTouchStart(e, drawCanvasRef, setTouchStartPos, hndMouseDown)}
          onTouchMove={(e) => hndTouchMove(e, touchStartPos, hndMouseMove)}
          onTouchEnd={(e) => hndTouchEnd(e, drawCanvasRef, setTouchStartPos, hndMouseUp)}
        />
        {eraserPos.visible && (
          <div style={{ position: 'absolute', left: eraserPos.x - eraserSize / 2, top: eraserPos.y - eraserSize / 2, width: eraserSize, height: eraserSize, border: '1px solid black', borderRadius: '50%', pointerEvents: 'none', zIndex: 3 }} />
        )}
        {editNode && (
          <div style={{ position: 'absolute', left: editNode.x, top: editNode.y, width: editNode.width, height: editNode.height, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #05f', borderRadius: '0px', padding: '5px' }}>
            <input value={editText.text1} onChange={(e) => setEditText({ ...editText, text1: e.target.value })} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '90%', marginBottom: '5px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#f07500' }} placeholder="텍스트 1" autoFocus />
            <input value={editText.text2} onChange={(e) => setEditText({ ...editText, text2: e.target.value })} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '90%', marginBottom: '5px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }} placeholder="텍스트 2" />
            <input value={editText.text3} onChange={(e) => setEditText({ ...editText, text3: e.target.value })} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '90%', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }} placeholder="텍스트 3" onBlur={hndFinishEdit} onKeyDown={(e) => { if (e.key === 'Enter') { hndFinishEdit(); } }} />
          </div>
        )}
        {editLink && (
          <div style={{ position: 'absolute', left: editLink.x, top: editLink.y, transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            <input 
              value={linkText} 
              onChange={(e) => setLinkText(e.target.value)} 
              onBlur={hndFinishEditLink} 
              onKeyDown={(e) => { if (e.key === 'Enter') hndFinishEditLink(); }} 
              style={{ padding: '5px', border: 'none', outline: 'none', backgroundColor: 'transparent', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', width: '80px' }} 
              placeholder="설명 입력" 
              autoFocus 
            />
          </div>
        )}
      </div>
      <div style={{ paddingTop: '20px', paddingBottom: '20px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 10, gap: '10px' }}>
        {shouldRenderTool('save') && <ToolButton tool="save" icon={<CloudArrowUpIcon className="h-6 w-6" />} onClick={hndSaveClick} currTool={tool} />}
        {shouldRenderTool('move') && <ToolButton tool="move" icon={<HandRaisedIcon className="h-6 w-6" />} onClick={() => hndToolChange('move')} currTool={tool} />}
        {shouldRenderTool('draw') && <ToolButton tool="draw" icon={<PencilIcon className="h-6 w-6" />} onClick={() => hndToolChange('draw')} currTool={tool} />}
        {shouldRenderTool('addNode') && <ToolButton tool="addNode" icon={<RectangleGroupIcon className="h-6 w-6" />} onClick={() => hndToolChange('addNode')} currTool={tool} />}
        {shouldRenderTool('link') && <ToolButton tool="link" icon={<ArrowLongRightIcon className="h-6 w-6" />} onClick={() => hndToolChange('link')} currTool={tool} />}
        {shouldRenderTool('erase') && <ToolButton tool="erase" icon="/icon-erase.svg" onClick={() => hndToolChange('erase')} currTool={tool} />}
        {shouldRenderTool('alignVertical') && <ToolButton tool="alignVertical" icon={<AdjustmentsVerticalIcon className="h-6 w-6" />} onClick={hndAlignNodesV} currTool={tool} />}
        {shouldRenderTool('alignHorizontal') && <ToolButton tool="alignHorizontal" icon={<AdjustmentsHorizontalIcon className="h-6 w-6" />} onClick={hndAlignNodesH} currTool={tool} />}
        {shouldRenderTool('record') && <ToolButton tool="record" icon={isRec ? "/icon-stop-rec.svg" : "/icon-start-rec.svg"} onClick={isRec ? hndStopRec : hndStartRec} currTool={tool} />}
        <ToolButton tool="undo" icon={<ArrowUturnLeftIcon className="h-5 w-5" />} onClick={undo} currTool={tool} label={undoCount.toString()} disabled={undoCount === 0} />
        <ToolButton tool="redo" icon={<ArrowUturnRightIcon className="h-5 w-5" />} onClick={redo} currTool={tool} label={redoCount.toString()} disabled={redoCount === 0} />
        <ToolButton tool="voice" icon={isVoiceEnabled ? "/icon-voice-on.svg" : "/icon-voice-off.svg"} onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} currTool={isVoiceEnabled ? 'voice' : ''} />
        {shouldRenderTool('clear') && <ToolButton tool="clear" icon={<TrashIcon className="h-6 w-6" />} onClick={() => setShowClearConfirmPopup(true)} currTool={tool} />}
        {mode !== 'play' && (<NodeSelector title="노드 색상" value={nodeColor} onChange={hndNodeColorChange} options={nodeColors} />)}
        {mode !== 'play' && (<NodeSelector title="노드 테두리" value={nodeBorderColor} onChange={hndNodeBorderColorChange} options={nodeBorderColors} />)}
        {mode !== 'edit' && (<NodeSelector title="펜색상" value={penColor} onChange={hndPenColorChange} options={penColors} />)}
        {mode !== 'edit' && (<NodeSelector title="펜굵기" value={lineWidth} onChange={hndLineWidthChange} options={lineWidths} />)}
        {mode !== 'edit' && (<NodeSelector title="지우개 크기" value={eraserSize.toString()} onChange={hndEraserSizeChange} options={eraserSizes} />)}
        {mode !== 'play' && (<NodeSelector title="선종류" value={lineStyle} onChange={hndLineStyleChange as (value: string) => void} options={linkStyles} />)}
      </div>
      {showSavePopup && <SaveLessonPopup onSave={hndSaveCanvas} onCancel={() => setShowSavePopup(false)} />}
      {showSaveRecPopup && <SaveRecPopup author={author || ''} email={email || ''} onSave={hndSaveRec} onCancel={() => setShowSaveRecPopup(false)} />}
      {showClearConfirmPopup && <ClearConfirmPopup onConfirm={clearAll} onCancel={() => setShowClearConfirmPopup(false)} />}
      <ToastContainer position="bottom-right" autoClose={1000} />
      {isLoad && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

export default EditStudyBoardClient;
