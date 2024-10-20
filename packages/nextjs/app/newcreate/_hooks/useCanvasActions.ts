import { useCallback } from "react";
import LZ from "lz-string";
import { Lines } from "~~/types/ink";

export const useCanvasActions = (
  drawingCanvas: any,
  triggerOnChange: (lines: Lines[]) => void,
  setDrafts: any,
  setCanvasFile: any,
) => {
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

  const downloadCanvas = useCallback(async () => {
    const myData = drawingCanvas?.current?.getSaveData();
    const fileName = `nifty_ink_canvas_${Date.now()}`;
    const json = JSON.stringify(myData);
    const blob = new Blob([json], { type: "application/json" });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [drawingCanvas]);

  const uploadCanvas = useCallback(
    (uploadedDrawing: React.ChangeEvent<HTMLInputElement>) => {
      const fileReader = new FileReader();
      fileReader.readAsText(uploadedDrawing.target.files![0], "UTF-8");
      fileReader.onload = e => {
        setCanvasFile(JSON.parse(e.target!.result as string));
      };
    },
    [drawingCanvas, setCanvasFile],
  );

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

  const saveDraft = useCallback(() => {
    if (!drawingCanvas.current) return;

    const imageData = drawingCanvas?.current?.canvas?.drawing.toDataURL("image/png");
    const savedData = LZ.compress(drawingCanvas.current.getSaveData());

    setDrafts((drafts: any) => {
      return [...drafts, { imageData, savedData }];
    });
  }, [drawingCanvas, setDrafts]);

  return { undo, downloadCanvas, uploadCanvas, fillBackground, drawFrame, saveDraft };
};
