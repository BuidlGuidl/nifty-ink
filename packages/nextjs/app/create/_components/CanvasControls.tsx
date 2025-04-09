import React from "react";
import { useCanvasActions } from "../_hooks/useCanvasActions";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BgColorsOutlined,
  BorderOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  PlaySquareOutlined,
  SaveOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Popover, Table, Tooltip } from "antd";
import { Grid } from "antd";
import { useHotkeys } from "react-hotkeys-hook";
import { CanvasDrawLines, Lines } from "~~/types/canvasDrawing";
import { shortCutsInfo, shortCutsInfoCols } from "~~/utils/constants";

const { useBreakpoint } = Grid;

interface CanvasControlsProps {
  canvasDisabled: boolean;
  isSaving: boolean;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  saveDrawing: (canvas: CanvasDrawLines, showNotification: boolean) => void;
  handleChangeDrawing: (newDrawing: string) => void;
  setCanvasDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  color: string;
  brushRadius: number;
  isPaletteRight: boolean;
  handlePalettePosition: () => void;
  portrait: boolean;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvasDisabled,
  isSaving,
  drawingCanvas,
  saveDrawing,
  handleChangeDrawing,
  setCanvasDisabled,
  color,
  brushRadius,
  isPaletteRight,
  handlePalettePosition,
  portrait,
}) => {
  const screens = useBreakpoint();
  const isSmall = !screens.sm;

  const triggerOnChange = (lines: Lines[]) => {
    if (!lines) return;
    if (!drawingCanvas?.current && !drawingCanvas?.current?.lines) return;
    const saved = JSON.stringify({
      lines: lines,
      width: drawingCanvas?.current?.props?.canvasWidth,
      height: drawingCanvas?.current?.props?.canvasHeight,
    });

    drawingCanvas?.current?.loadSaveData(saved, true);
    drawingCanvas.current.lines = lines;
    saveDrawing(drawingCanvas.current, false);
  };

  const { undo, fillBackground, drawFrame } = useCanvasActions(drawingCanvas, triggerOnChange, saveDrawing);

  useHotkeys("ctrl+z", () => undo());

  return (
    <div className="mt-2">
      <Button
        disabled={canvasDisabled || !drawingCanvas.current?.lines?.length}
        onClick={() => {
          if (canvasDisabled || !drawingCanvas.current?.lines?.length) return;
          drawingCanvas.current.loadSaveData(drawingCanvas.current.getSaveData(), false);
          setCanvasDisabled(true);
        }}
        icon={<PlaySquareOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary"
        data-tip="Play the drawing process"
      >
        {!isSmall && "PLAY"}
      </Button>
      <Button
        disabled={canvasDisabled || isSaving}
        onClick={() => {
          if (canvasDisabled || !drawingCanvas.current || !drawingCanvas.current.lines) return;
          saveDrawing(drawingCanvas.current, true);
        }}
        icon={<SaveOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary"
        data-tip="Save to local storage"
      >
        {!isSmall && (isSaving ? "SAVING..." : "SAVE")}
      </Button>
      <Popconfirm
        title="Are you sure?"
        onConfirm={() => {
          if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
          drawingCanvas?.current?.clear();
          handleChangeDrawing("");
        }}
        okText="Yes"
        cancelText="No"
      >
        <Button
          disabled={canvasDisabled || !drawingCanvas.current?.lines || drawingCanvas.current.lines.length === 0}
          icon={<ClearOutlined />}
          size={"middle"}
          className="tooltip tooltip-primary"
          data-tip="Clear the canvas"
        >
          {!isSmall && "CLEAR"}
        </Button>
      </Popconfirm>
      <Button
        disabled={canvasDisabled || !drawingCanvas.current?.lines || drawingCanvas.current.lines.length === 0}
        onClick={() => {
          if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
          undo();
        }}
        icon={<UndoOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary"
        data-tip="Undo the last action"
      >
        {!isSmall && "UNDO"}
      </Button>
      <Button
        onClick={() => fillBackground(color)}
        icon={<BgColorsOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary"
        data-tip="Fill the canvas with the current color"
      />
      <Button
        onClick={() => drawFrame(color, brushRadius)}
        icon={<BorderOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary"
        data-tip="Draw a frame around the canvas"
      />
      <Popover
        content={<Table columns={shortCutsInfoCols} dataSource={shortCutsInfo} size="small" pagination={false} />}
        title="Keyboard shortcuts"
        trigger="click"
      >
        <Button
          icon={<InfoCircleOutlined />}
          size={"middle"}
          className="tooltip tooltip-primary"
          data-tip="Keyboard shortcuts"
        />
      </Popover>
      {portrait && (
        <Button
          onClick={handlePalettePosition}
          icon={isPaletteRight ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
          size={"middle"}
          className="tooltip tooltip-primary"
          data-tip="Change the palette position"
        />
      )}
    </div>
  );
};
