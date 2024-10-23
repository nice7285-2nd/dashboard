import { getTouchPos } from './canvasUtils';
import { Node, Tool } from '../types';

export const handleTouchStart = (
  e: React.TouchEvent<HTMLCanvasElement>,
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>,
  setTouchStartPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
) => {
  e.preventDefault();
  const canvas = drawingCanvasRef.current;
  if (!canvas) return;
  const touch = e.touches[0];
  if (!touch) return;
  const { x, y } = getTouchPos(canvas, touch);
  setTouchStartPos({ x, y });
  handleMouseDown({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
};

export const handleTouchMove = (
  e: React.TouchEvent<HTMLCanvasElement>,
  touchStartPos: { x: number; y: number } | null,
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
) => {
  e.preventDefault();
  if (!touchStartPos) return;
  const canvas = e.currentTarget;
  const touch = e.touches[0];
  if (!touch) return;
  const { x, y } = getTouchPos(canvas, touch);
  handleMouseMove({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
};

export const handleTouchEnd = (
  e: React.TouchEvent<HTMLCanvasElement>,
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>,
  setTouchStartPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
) => {
  e.preventDefault();
  const canvas = drawingCanvasRef.current;
  if (!canvas) return;
  const touch = e.changedTouches[0];
  if (!touch) return;
  const { x, y } = getTouchPos(canvas, touch);
  setTouchStartPos(null);
  handleMouseUp({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
};
