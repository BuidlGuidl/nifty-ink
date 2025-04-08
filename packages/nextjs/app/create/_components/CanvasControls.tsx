import React from "react";
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
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { shortCutsInfo, shortCutsInfoCols } from "~~/utils/constants";

const { useBreakpoint } = Grid;

interface CanvasControlsProps {
  canvasDisabled: boolean;
  isSaving: boolean;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  saveDrawing: (canvas: CanvasDrawLines, showNotification: boolean) => void;
  undo: () => void;
  handleChangeDrawing: (newDrawing: string) => void;
  setCanvasDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  drawFrame: (color: string, brushRadius: number) => void;
  color: string;
  brushRadius: number;
  fillBackground: (color: string) => void;
  isPaletteRight: boolean;
  handlePalettePosition: () => void;
  portrait: boolean;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvasDisabled,
  isSaving,
  drawingCanvas,
  saveDrawing,
  undo,
  handleChangeDrawing,
  setCanvasDisabled,
  drawFrame,
  color,
  brushRadius,
  fillBackground,
  isPaletteRight,
  handlePalettePosition,
  portrait,
}) => {
  const screens = useBreakpoint();
  const isSmall = !screens.sm;
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
