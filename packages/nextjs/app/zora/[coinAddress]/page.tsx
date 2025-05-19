"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TokenStats } from "./_components/TokenStats";
import { TradeTokenModal } from "./_components/TradeTokenModal";
import { useZoraDrawing } from "./_hooks/useZoraDrawing";
import CanvasDraw from "react-canvas-draw";
import { InkHeader } from "~~/app/_components/view/InkHeader";
import Loader from "~~/components/Loader";
import { Address } from "~~/components/scaffold-eth";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { getFetchableUrl } from "~~/utils/ipfs";

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
    <div className="flex flex-col mt-4 items-center">
      {metadata ? (
        <InkHeader name={metadata.name} playClick={playClick} isDrawing={isDrawing || !drawingData} />
      ) : (
        <div className="flex items-center w-full max-w-md animate-pulse mx-auto">
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      )}
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
          loadTimeOffset={5}
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
        <div style={{ width: calculatedCanvaSize }}>
          <TokenStats zoraToken={zoraToken} />

          <TradeTokenModal
            modalId={"buy-modal"}
            tokenImage={zoraToken?.mediaContent?.previewImage?.small || ""}
            coinAddress={params.coinAddress}
          />
        </div>
      )}
      <div className="flex flex-col items-center text-center mb-5 mt-2">
        <p className="my-0 text-lg">Artist:</p>
        <Link href={`/artist/${owners?.[0]}?platform=zora`} className="my-1">
          <Address address={owners?.[0]} size="xl" disableAddressLink />
        </Link>
        {zoraToken?.createdAt && (
          <p className="my-0 text-sm">
            {new Date(zoraToken?.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ZoraView;
