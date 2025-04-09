import React from "react";
import { useCanvasActions } from "../_hooks/useCanvasActions";
import { PublishModal } from "./publish/PublishModal";
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
import { Button, Popconfirm, Popover, Table } from "antd";
import { Grid } from "antd";
import { useHotkeys } from "react-hotkeys-hook";
import { Address } from "viem";
import { useAccount } from "wagmi";
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
  const { address: connectedAddress, chain } = useAccount();
  const screens = useBreakpoint();
  const isSmall = !screens.sm;

  const openModal = () => {
    const modalToggle = document.getElementById("publish-modal") as HTMLInputElement;
    if (modalToggle) modalToggle.checked = true;
  };

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
  const isCanvasDisabledOrEmpty = canvasDisabled || !drawingCanvas.current?.lines?.length;

  return (
    <div className="mt-2">
      <PublishModal
        chain={chain}
        connectedAddress={connectedAddress as Address}
        modalId="publish-modal"
        drawingCanvas={drawingCanvas}
      />
      <Button
        onClick={openModal}
        disabled={isCanvasDisabledOrEmpty}
        className="bg-primary tooltip tooltip-primary"
        data-tip="Publish your drawing"
        size="middle"
      >
        Ink!
      </Button>
      <Button
        disabled={isCanvasDisabledOrEmpty}
        onClick={() => {
          if (isCanvasDisabledOrEmpty) return;
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
        disabled={isCanvasDisabledOrEmpty || isSaving}
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
          if (isCanvasDisabledOrEmpty) return;
          drawingCanvas?.current?.clear();
          handleChangeDrawing("");
        }}
        okText="Yes"
        cancelText="No"
      >
        <Button
          disabled={isCanvasDisabledOrEmpty}
          icon={<ClearOutlined />}
          size={"middle"}
          className="tooltip tooltip-primary"
          data-tip="Clear the canvas"
        >
          {!isSmall && "CLEAR"}
        </Button>
      </Popconfirm>
      <Button
        disabled={isCanvasDisabledOrEmpty}
        onClick={() => {
          if (isCanvasDisabledOrEmpty) return;
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
