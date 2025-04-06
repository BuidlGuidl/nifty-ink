import React from "react";
import {
  BgColorsOutlined,
  BorderOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  PlaySquareOutlined,
  SaveOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Popover, Table, Tooltip } from "antd";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { shortCutsInfo, shortCutsInfoCols } from "~~/utils/constants";

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
}) => {
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
      >
        PLAY
      </Button>
      <Tooltip title="save to local storage">
        <Button
          disabled={canvasDisabled || isSaving}
          onClick={() => {
            if (canvasDisabled || !drawingCanvas.current || !drawingCanvas.current.lines) return;
            saveDrawing(drawingCanvas.current, true);
          }}
          icon={<SaveOutlined />}
        >
          {isSaving ? "SAVING..." : "SAVE"}
        </Button>
      </Tooltip>
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
        >
          CLEAR
        </Button>
      </Popconfirm>
      <Button
        disabled={canvasDisabled || !drawingCanvas.current?.lines || drawingCanvas.current.lines.length === 0}
        onClick={() => {
          if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
          undo();
        }}
        icon={<UndoOutlined />}
      >
        UNDO
      </Button>
      <Button onClick={() => fillBackground(color)} icon={<BgColorsOutlined />} />
      <Button onClick={() => drawFrame(color, brushRadius)} icon={<BorderOutlined />} />
      <Popover
        content={<Table columns={shortCutsInfoCols} dataSource={shortCutsInfo} size="small" pagination={false} />}
        title="Keyboard shortcuts"
        trigger="click"
      >
        <Button icon={<InfoCircleOutlined />} />
      </Popover>
    </div>
  );
};
