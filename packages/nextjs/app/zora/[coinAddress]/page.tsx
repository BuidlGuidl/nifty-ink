"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { TokenStats } from "./_components/TokenStats";
import { TradeTokenModal } from "./_components/TradeTokenModal";
import { useZoraDrawing } from "./_hooks/useZoraDrawing";
import CanvasDraw from "react-canvas-draw";
import { InkHeader } from "~~/app/_components/view/InkHeader";
import Loader from "~~/components/Loader";
import { CanvasDrawLines } from "~~/types/canvasDrawing";

const ZoraView = ({ params }: { params: { coinAddress: string } }) => {
  const { isLoading, error, drawingData, zoraToken, totalLines, fetchAndShowDrawing } = useZoraDrawing(
    params.coinAddress,
  );

  const drawingCanvas = useRef<CanvasDrawLines>(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const calculatedCanvaSize = useMemo(() => Math.round(0.7 * Math.min(window.innerWidth, window.innerHeight)), []);

  useEffect(() => {
    fetchAndShowDrawing()
      .then(({ drawingData }) => {
        if (drawingCanvas.current) {
          drawingCanvas.current.loadSaveData(drawingData, true);
        }
      })
      .catch(console.error);
  }, [fetchAndShowDrawing]);

  const playClick = useCallback(() => {
    setIsDrawing(true);
    drawingCanvas.current?.loadSaveData(drawingData, false);
  }, [drawingData]);

  if (error) {
    return <div className="error-message">Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-col mt-4 items-center">
      {zoraToken ? (
        // TODO: add skeleton inside InkHeader
        <InkHeader name={zoraToken.name} playClick={playClick} isDrawing={isDrawing} />
      ) : (
        <div className="flex items-center w-full max-w-md animate-pulse mx-auto">
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      )}
      <div className="relative">
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <Loader />
          </div>
        )}
        {zoraToken?.mediaContent.previewImage.medium && (
          <Image
            width={calculatedCanvaSize}
            height={calculatedCanvaSize}
            src={zoraToken.mediaContent.previewImage.medium}
            alt="Your drawing"
            className={`bg-white absolute top-0 left-0 transition-opacity duration-150 ${
              isDrawing ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
        <CanvasDraw
          ref={drawingCanvas}
          canvasWidth={calculatedCanvaSize}
          canvasHeight={calculatedCanvaSize}
          disabled={true}
          loadTimeOffset={5}
          hideInterface={true}
          hideGrid={true}
          onChange={() => {
            const drawnLines = drawingCanvas?.current?.lines.length;
            if ((drawnLines ?? 0) >= totalLines && isDrawing) {
              setIsDrawing(false);
            }
          }}
          className={`transition-opacity duration-150 ${isDrawing ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <div style={{ width: calculatedCanvaSize }}>
        <TokenStats
          marketCap={zoraToken?.marketCap}
          totalVolume={zoraToken?.totalVolume}
          uniqueHolders={zoraToken?.uniqueHolders}
        />

        <TradeTokenModal
          modalId={"buy-modal"}
          tokenImage={zoraToken?.mediaContent.previewImage.small || ""}
          coinAddress={params.coinAddress}
        />
      </div>
    </div>
  );
};

export default ZoraView;
