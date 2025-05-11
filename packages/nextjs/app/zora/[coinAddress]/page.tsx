"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IconWrapper } from "./_components/IconWrapper";
import { HoldersIcon, MarketCapIcon, VolumeIcon } from "./_components/icons";
import { getCoin } from "@zoralabs/coins-sdk";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import { base } from "viem/chains";
import { InkHeader } from "~~/app/_components/view/InkHeader";
import Loader from "~~/components/Loader";
import { CanvasDrawLines } from "~~/types/canvasDrawing";

type Metadata = {
  animation_url: string;
  content: {
    mime: string;
    uri: string;
  };
  description: string;
  image: string;
  name: string;
};

type ZoraToken = {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h: string;
  marketCap: string;
  createdAt?: string;
  creatorAddress?: string;
  uniqueHolders: number;
  tokenUri?: string;
  zoraComments: any;
};

const ZoraView = ({ params }: { params: { coinAddress: string } }) => {
  const coinAddress = params?.coinAddress;
  const [zoraToken, setZoraToken] = useState<ZoraToken | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const calculatedCanvaSize = Math.round(0.7 * Math.min(window.innerWidth, window.innerHeight));

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(true);
  const [finalDrawing, setFinalDrawing] = useState<string>("");
  const totalLines = useRef<number>(0);
  const isMounted = useRef(false);

  const drawingCanvas = useRef<CanvasDrawLines>(null);
  const [drawingData, setDrawingData] = useState<string>("");

  useEffect(() => {
    if (!isMounted.current) {
      const size = Math.round(0.85 * Math.min(window.innerWidth, window.innerHeight));
      fetchAndShowDrawing();
      // setCalculatedCanvaSize(size);
      isMounted.current = true;
    }
  }, []);

  const fetchAndShowDrawing = async () => {
    try {
      const coinResponse = await getCoin({
        address: coinAddress,
        chain: base.id, // Optional: Base chain set by default
      });
      if (!coinResponse?.data?.zora20Token) {
        throw new Error("No data found");
      }

      console.log("coinAddress", coinAddress);
      console.log("coinResponse", coinResponse);

      console.log(`fetching from IPFS ${new Date().toISOString()}`);
      setZoraToken(coinResponse?.data?.zora20Token);
      // @ts-ignore
      const inkId = await coinResponse.data?.zora20Token?.tokenUri?.split("/ipfs/").pop();
      let url = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${inkId}`;
      if (inkId === "bafybeiaxw4zkw57lsc7iueyxpzwalb2rxdr5dx4vervynjhwgxagbbdeli") {
        url = "https://bafkreifhnbmjsb4c4cobi2bk4x2vikityhqcwzv6nprs3sd3i2qk5xlqne.ipfs.community.bgipfs.com/";
      }
      console.log("url", url);
      const response = await fetch(url);
      console.log("First fetch done", response);
      if (!response.ok) {
        throw new Error("Failed to fetch drawing content");
      }
      const metadata = await response.json();
      console.log("metadata", metadata);
      setMetadata(metadata);

      console.log("metadata.content.uri", metadata.content.uri, metadata.content.uri.split("/ink/").pop());
      const ink = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${metadata.content.uri.split("/ink/").pop()}`;
      const inkUri = await fetch(ink);
      if (!inkUri.ok) {
        throw new Error("Failed to fetch ink URI");
      }

      const drawingContent = await inkUri.arrayBuffer();

      const decompressed = LZ.decompressFromUint8Array(new Uint8Array(drawingContent));
      const parsedDrawing = JSON.parse(decompressed);
      totalLines.current = parsedDrawing.lines.length;

      setDrawingData(decompressed);
      drawingCanvas.current?.loadSaveData(decompressed, true);
      setFinalDrawing(drawingCanvas.current?.canvas.drawing.toDataURL("image/png"));
    } catch (e) {
      console.error("Error loading or decompressing drawing:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const playClick = () => {
    setIsDrawing(true);
    drawingCanvas.current?.loadSaveData(drawingData, false);
  };

  return (
    <div className="flex flex-col mt-4 items-center">
      {metadata ? (
        // TODO: add skeleton inside InkHeader
        <InkHeader name={metadata?.name} playClick={playClick} isDrawing={isDrawing} />
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
        <Image
          width={calculatedCanvaSize}
          height={calculatedCanvaSize}
          src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${metadata?.image.split("ipfs://").pop()}`}
          alt="Your drawing"
          className={`bg-white absolute top-0 left-0 transition-opacity duration-150 ${
            isDrawing ? "opacity-0" : "opacity-100"
          }`}
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
          className={`transition-opacity duration-150 ${isDrawing ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <div className="flex justify-between gap-1 w-full" style={{ width: calculatedCanvaSize }}>
        <div className="flex items-center gap-2">
          <IconWrapper icon={<MarketCapIcon className="w-6 h-6" />} text={`$${zoraToken?.marketCap}`} />
          <IconWrapper icon={<VolumeIcon className="w-6 h-6" />} text={`$${zoraToken?.totalVolume}`} />
          <IconWrapper icon={<HoldersIcon className="w-6 h-6" />} text={`${zoraToken?.uniqueHolders}`} />
        </div>
        <div className="flex gap-2 mt-1">
          <button className="bg-[#2BF738] border-1 shadow-[0_0_0_1px_rgba(144,238,144,0.5)] hover:bg-green-500 text-black text-sm font-semibold rounded-lg px-4 py-2 transition">
            Buy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoraView;
