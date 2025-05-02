import React from "react";
import { useCanvasActions } from "../_hooks/useCanvasActions";
import { PublishModal } from "./publish/PublishModal";
import {
  BgColorsOutlined,
  BorderOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  PlaySquareOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Popover, Table } from "antd";
import { Grid } from "antd";
import { useHotkeys } from "react-hotkeys-hook";
import { Address, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useWatchBalance } from "~~/hooks/scaffold-eth";
import { CanvasDrawLines, Lines } from "~~/types/canvasDrawing";
import { shortCutsInfo, shortCutsInfoCols } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

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
}) => {
  const { address: connectedAddress, connector, chain } = useAccount();
  const screens = useBreakpoint();
  const isSmall = !screens.sm;
  const isBurnerWalletConnected = connector?.name === "Burner Wallet";

  const { data: balance } = useWatchBalance({
    address: connectedAddress,
  });

  const openModal = () => {
    if (!isBurnerWalletConnected && balance && balance.value < parseEther("0.00000001")) {
      notification.error("Insufficient balance. Please add funds to your wallet to continue.");
      return;
    }
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
    <div className={`flex items-center justify-center mt-2 mb-1 ${isSmall ? "gap-1" : ""}`}>
      <PublishModal
        chain={chain}
        connectedAddress={connectedAddress as Address}
        modalId="publish-modal"
        drawingCanvas={drawingCanvas}
      />
      <Button
        disabled={isCanvasDisabledOrEmpty}
        onClick={() => {
          if (isCanvasDisabledOrEmpty) return;
          drawingCanvas.current.loadSaveData(drawingCanvas.current.getSaveData(), false);
          setCanvasDisabled(true);
        }}
        icon={<PlaySquareOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary tooltip-bottom"
        data-tip="Play the drawing process"
      >
        {!isSmall && "PLAY"}
      </Button>
      <Popconfirm
        title="Are you sure you want to clear the canvas?"
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
          className="tooltip tooltip-primary tooltip-bottom"
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
        className="tooltip tooltip-primary tooltip-bottom"
        data-tip="Undo the last action"
      >
        {!isSmall && "UNDO"}
      </Button>
      <Button
        onClick={() => fillBackground(color)}
        icon={<BgColorsOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary tooltip-bottom"
        data-tip="Fill the canvas"
      />
      <Button
        onClick={() => drawFrame(color, brushRadius)}
        icon={<BorderOutlined />}
        size={"middle"}
        className="tooltip tooltip-primary tooltip-bottom"
        data-tip="Apply canvas frame"
      />
      <Popover
        content={<Table columns={shortCutsInfoCols} dataSource={shortCutsInfo} size="small" pagination={false} />}
        title="Keyboard shortcuts"
        trigger="click"
        placement="bottomRight"
      >
        <Button
          icon={<InfoCircleOutlined />}
          size={"middle"}
          className={`tooltip tooltip-primary tooltip-bottom`}
          data-tip="Shortcuts"
        />
      </Popover>
      <Button
        onClick={openModal}
        disabled={isCanvasDisabledOrEmpty}
        className={`bg-primary tooltip tooltip-primary tooltip-bottom ml-2 font-bold`}
        data-tip="Publish your drawing"
        size="middle"
      >
        Ink!
      </Button>
    </div>
  );
};
