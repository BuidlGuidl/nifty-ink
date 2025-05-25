"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ShareModal } from "./_components/ShareModal";
import { TokenStats } from "./_components/TokenStats";
import { TradeTokenModal } from "./_components/TradeTokenModal";
import { useZoraDrawing } from "./_hooks/useZoraDrawing";
import CanvasDraw from "react-canvas-draw";
import { ForkButton, PlayButton } from "~~/app/_components/buttons";
import { InkHeader } from "~~/app/_components/view/InkHeader";
import Loader from "~~/components/Loader";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { getFetchableUrl } from "~~/utils/ipfs";
import { calculateLoadTimeOffset } from "~~/utils/loadTime";

const ZoraView = ({ params }: { params: { coinAddress: string } }) => {
  const { isLoading, error, drawingData, zoraToken, totalLines, fetchAndShowDrawing, metadata, owners } =
    useZoraDrawing(params.coinAddress);

  const drawingCanvas = useRef<CanvasDrawLines>(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const calculatedCanvaSize = useMemo(() => Math.round(0.7 * Math.min(window.innerWidth, window.innerHeight)), []);

  useEffect(() => {
    fetchAndShowDrawing();
  }, [fetchAndShowDrawing]);

  const playClick = useCallback(() => {
    setIsDrawing(true);
    drawingCanvas.current?.loadSaveData(drawingData, false);
  }, [drawingData]);

  if (error) {
    return <div className="error-message">Error: {error.message}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>No token found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-4 items-center mx-auto" style={{ width: calculatedCanvaSize }}>
      <InkHeader
        name={metadata.name}
        artist={owners?.[0] ?? ""}
        createdAt={zoraToken?.createdAt ?? ""}
        buttons={
          <>
            <PlayButton isDrawing={isDrawing} playClick={playClick} />
            <ForkButton artist={owners?.[0] ?? ""} drawing={drawingData} />
          </>
        }
      />
      <div className="relative">
        <Image
          width={calculatedCanvaSize}
          height={calculatedCanvaSize}
          src={getFetchableUrl(metadata.image)}
          alt={metadata.name || "Zora ink"}
          className={`bg-white absolute top-0 left-0 ${isDrawing ? "opacity-0" : "opacity-100"}`}
        />
        <CanvasDraw
          ref={drawingCanvas}
          canvasWidth={calculatedCanvaSize}
          canvasHeight={calculatedCanvaSize}
          disabled={true}
          saveData={drawingData}
          immediateLoading={true}
          loadTimeOffset={calculateLoadTimeOffset(totalLines)}
          hideInterface={true}
          hideGrid={true}
          onChange={() => {
            const drawnLines = drawingCanvas?.current?.lines.length;
            if ((drawnLines ?? 0) >= totalLines && isDrawing) {
              setIsDrawing(false);
            }
          }}
        />
      </div>
      {zoraToken && (
        <>
          <TokenStats zoraToken={zoraToken} />
          <TradeTokenModal
            modalId={"buy-modal"}
            tokenImage={zoraToken?.mediaContent?.previewImage?.small || ""}
            coinAddress={params.coinAddress}
          />
          <ShareModal modalId={"share-modal"} shareUrl={`https://nifty.ink/zora/${params.coinAddress}`} />
        </>
      )}
    </div>
  );
};

export default ZoraView;
