"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import { CanvasDrawLines } from "../../../types/canvasDrawing";

const NiftyView = ({ params }: { params: { cid: string } }) => {
  const cid = params?.cid;
  const [calculatedCanvaSize, setCalculatedCanvaSize] = useState<number>(500);
  const [isDrawing, setIsDrawing] = useState<boolean>(true);
  const [finalDrawing, setFinalDrawing] = useState<string>("");
  const totalLines = useRef<number>(0);
  const isMounted = useRef(false);

  const drawingCanvas = useRef<CanvasDrawLines>(null);
  const [drawingData, setDrawingData] = useState<string>("");

  useEffect(() => {
    if (!isMounted.current) {
      const size = Math.round(0.7 * Math.min(window.innerWidth, window.innerHeight));
      fetchAndShowDrawing();
      setCalculatedCanvaSize(size);
      isMounted.current = true;
    }
  }, []);

  const fetchAndShowDrawing = async () => {
    const url = `${process.env.NEXT_PUBLIC_IPFS_LINK}/ipfs/${cid}`;
    try {
      console.log(`fetching from IPFS ${new Date().toISOString()}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch drawing content");
      }
      const drawingContent = await response.arrayBuffer();
      console.log(`received from IPFS ${new Date().toISOString()}`);

      console.log(`decompressing ${new Date().toISOString()}`);

      const decompressed = LZ.decompressFromUint8Array(new Uint8Array(drawingContent));
      const parsedDrawing = JSON.parse(decompressed);
      totalLines.current = parsedDrawing.lines.length;

      console.log(`finding length ${new Date().toISOString()}`);
      setDrawingData(decompressed);
      drawingCanvas.current?.loadSaveData(decompressed, true);
      setFinalDrawing(drawingCanvas.current?.canvas.drawing.toDataURL("image/png"));
      console.log(`saving ${new Date().toISOString()}`);
      console.log(`done ${new Date().toISOString()}`);
    } catch (e) {
      console.error("Error loading or decompressing drawing:", e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex gap-2 mb-1">
        <button
          className="btn btn-primary "
          onClick={() => {
            setIsDrawing(true);
            drawingCanvas.current?.loadSaveData(drawingData, false);
          }}
          disabled={isDrawing}
        >
          Play
        </button>
      </div>
      <div className="relative">
        <Image
          width={calculatedCanvaSize}
          height={calculatedCanvaSize}
          src={`${finalDrawing}`}
          alt="Your drawing"
          className={`border-2 border-gray-300 rounded-md bg-white absolute top-0 left-0 ${isDrawing ? "-z-10" : "z-10"}`}
        />
        <CanvasDraw
          ref={drawingCanvas}
          canvasWidth={calculatedCanvaSize}
          canvasHeight={calculatedCanvaSize}
          disabled={true}
          loadTimeOffset={5}
          hideInterface={true}
          hideGrid={true}
          onChange={() => {
            try {
              const drawnLines = drawingCanvas?.current?.lines.length;
              if ((drawnLines ?? 0) >= totalLines?.current && isDrawing) {
                setIsDrawing(false);
              }
            } catch (e) {
              console.log(e);
            }
          }}
          className="border-2 border-gray-300 rounded-md"
        />
      </div>
    </div>
  );
};

export default NiftyView;
