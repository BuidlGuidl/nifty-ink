import React from "react";
import { ClearOutlined, PlaySquareOutlined, SaveOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { CanvasDrawLines } from "~~/types/ink";

interface CanvasControlsProps {
  canvasDisabled: boolean;
  isSaving: boolean;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  saveDrawing: (canvas: CanvasDrawLines, showNotification: boolean) => void;
  undo: () => void;
  handleChangeDrawing: (newDrawing: string) => void;
  setCanvasDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvasDisabled,
  isSaving,
  drawingCanvas,
  saveDrawing,
  undo,
  handleChangeDrawing,
  setCanvasDisabled,
}) => {
  return (
    <div style={{ marginTop: 16 }}>
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
    </div>
  );
};
