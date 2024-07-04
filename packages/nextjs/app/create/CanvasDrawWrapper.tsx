"use client";

import Link from "next/link";
import CanvasDraw from "react-canvas-draw";
import { Address } from "~~/components/scaffold-eth";

type CanvasDrawWrapperProps = {
  size: number[];
  saveCanvas?: () => void;
  mode?: string;
  loaded: boolean;
  canvasKey: number;
  drawingCanvas: any;
  color: string;
  brushRadius: number;
  canvasDisabled: boolean;
  initialDrawing: any;
  handleCanvasChange: () => void;
};

export default function CanvasDrawWrapper({
  size,
  saveCanvas,
  mode,
  loaded,
  canvasKey,
  drawingCanvas,
  color,
  brushRadius,
  canvasDisabled,
  initialDrawing,
  handleCanvasChange,
}: CanvasDrawWrapperProps) {
  return (
    <div
      style={{
        backgroundColor: "#666666",
        width: size[0],
        margin: "auto",
        border: "1px solid #999999",
        boxShadow: "2px 2px 8px #AAAAAA",
        cursor: "pointer",
      }}
      onMouseUp={saveCanvas}
      onTouchEnd={saveCanvas}
    >
      {!loaded && <span>Loading...</span>}
      <CanvasDraw
        key={mode + "" + canvasKey}
        ref={drawingCanvas}
        canvasWidth={size[0]}
        canvasHeight={size[1]}
        brushColor={color}
        lazyRadius={1}
        brushRadius={brushRadius}
        disabled={canvasDisabled}
        //  hideGrid={props.mode !== "edit"}
        //  hideInterface={props.mode !== "edit"}
        onChange={handleCanvasChange}
        saveData={initialDrawing}
        immediateLoading={true} //drawingSize >= 10000}
        loadTimeOffset={3}
      />
    </div>
  );
}
