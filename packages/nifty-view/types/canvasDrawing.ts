import CanvasDraw from "react-canvas-draw";

export interface Lines {
  background?: unknown;
  ref?: unknown;
  brushColor: string;
  brushRadius: number;
  points: Array<{ x: number; y: number }>;
}

export interface CanvasDrawLines extends CanvasDraw {
  canvas: any;
  lines: Lines[];
  props: {
    brushColor: string;
    canvasWidth: any;
    canvasHeight: any;
  };
}
