import { useCallback } from "react";
import { Lines } from "~~/types/canvasDrawing";

export const useCanvasActions = (drawingCanvas: any, triggerOnChange: (lines: Lines[]) => void, saveDrawing: any) => {
  const undo = useCallback(() => {
    if (!drawingCanvas?.current?.lines?.length) return;

    if (drawingCanvas.current.lines[drawingCanvas.current.lines.length - 1]?.ref) {
      drawingCanvas.current.lines[0].brushColor =
        drawingCanvas.current.lines[drawingCanvas.current.lines.length - 1].brushColor;
      const lines = drawingCanvas.current.lines.slice(0, -1);
      triggerOnChange(lines);
    } else {
      const lines = drawingCanvas.current.lines.slice(0, -1);
      triggerOnChange(lines);
    }
  }, [drawingCanvas, triggerOnChange]);

  const fillBackground = useCallback(
    (color: string) => {
      if (!drawingCanvas.current) return;
      const width = drawingCanvas?.current.props.canvasWidth;
      const height = drawingCanvas?.current.props.canvasHeight;

      const bg = {
        brushColor: color,
        brushRadius: (width + height) / 2,
        points: [
          { x: 0, y: 0 },
          { x: width, y: height },
        ],
        background: true,
      };

      const previousBGColor = drawingCanvas.current.lines.filter((l: any) => l?.ref).length
        ? drawingCanvas.current.lines[0].brushColor
        : "#FFF";

      const bgRef = {
        brushColor: previousBGColor,
        brushRadius: 1,
        points: [
          { x: -1, y: -1 },
          { x: -1, y: -1 },
        ],
        ref: true,
      };

      drawingCanvas.current.lines.filter((l: any) => l.background).length
        ? drawingCanvas.current.lines.splice(0, 1, bg)
        : drawingCanvas.current.lines.unshift(bg);
      drawingCanvas.current.lines.push(bgRef);

      const lines = drawingCanvas.current.lines;

      triggerOnChange(lines);
    },
    [drawingCanvas, triggerOnChange],
  );

  const drawFrame = useCallback(
    (color: string, radius: number) => {
      if (!drawingCanvas.current) return;

      const width = drawingCanvas.current.props.canvasWidth;
      const height = drawingCanvas.current.props.canvasHeight;

      drawingCanvas.current.lines.push({
        brushColor: color,
        brushRadius: radius,
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: width, y: height },
          { x: 0, y: height },
          { x: 0, y: height },
          { x: 0, y: 0 },
        ],
      });

      const lines = drawingCanvas.current.lines;

      triggerOnChange(lines);
    },
    [drawingCanvas, triggerOnChange],
  );

  return { undo, fillBackground, drawFrame };
};
