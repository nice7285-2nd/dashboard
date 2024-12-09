import { getTouchPos } from './canvasUtils';
import { Node, Tool } from './types';

export const hndTouchStart = (
  e: React.TouchEvent<HTMLCanvasElement>,
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>,
  setTouchStartPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
  hndMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
) => {
  e.preventDefault();
  const canvas = drawingCanvasRef.current;
  if (!canvas) return;
  const touch = e.touches[0];
  if (!touch) return;
  const { x, y } = getTouchPos(canvas, touch);
  setTouchStartPos({ x, y });
  hndMouseDown({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
};

export const hndTouchMove = (
  e: React.TouchEvent<HTMLCanvasElement>,
  touchStartPos: { x: number; y: number } | null,
  hndMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
) => {
  e.preventDefault();
  if (!touchStartPos) return;
  const canvas = e.currentTarget;
  const touch = e.touches[0];
  if (!touch) return;
  const { x, y } = getTouchPos(canvas, touch);
  hndMouseMove({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
};

export const hndTouchEnd = (
  e: React.TouchEvent<HTMLCanvasElement>,
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>,
  setTouchStartPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
  hndMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
) => {
  e.preventDefault();
  const canvas = drawingCanvasRef.current;
  if (!canvas) return;
  const touch = e.changedTouches[0];
  if (!touch) return;
  const { x, y } = getTouchPos(canvas, touch);
  setTouchStartPos(null);
  hndMouseUp({ clientX: x, clientY: y } as unknown as React.MouseEvent<HTMLCanvasElement>);
};
