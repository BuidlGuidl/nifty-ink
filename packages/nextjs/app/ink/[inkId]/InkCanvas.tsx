"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkOutlined, PlaySquareOutlined, QuestionCircleOutlined, XOutlined } from "@ant-design/icons";
import { Button, Descriptions, InputNumber, Popover, Row, Spin } from "antd";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import CopyToClipboard from "react-copy-to-clipboard";
import { useLocalStorage } from "usehooks-ts";
import { formatEther } from "viem";
import { LikeButton } from "~~/app/_components/LikeButton";
import Loader from "~~/components/Loader";
import { getFromIPFS } from "~~/utils/ipfs";

export const InkCanvas = ({
  inkJson,
  ink,
  connectedAddress,
  inkId,
}: {
  inkJson: any;
  ink: Ink;
  connectedAddress: string;
  inkId: string;
}) => {
  const router = useRouter();
  const drawingCanvas = useRef<CanvasDraw>(null);
  const calculatedCanvaSize = Math.round(0.7 * Math.min(window.innerWidth, window.innerHeight));
  const size = [calculatedCanvaSize, calculatedCanvaSize];
  const [drawingSize, setDrawingSize] = useState(10000);
  const [drawing, setDrawing] = useState<string | undefined>();
  const drawnLines = useRef([]);
  const [canvasState, setCanvasState] = useState("downloading");
  const totalLines = useRef([]);
  const [drawingLocalStorage, setDrawingLocalStorage] = useLocalStorage("drawing", "");

  const [canvasKey, setCanvasKey] = useState(Date.now());
  const [playSpeed, setPlaySpeed] = useLocalStorage("playspeed", 7, {
    initializeWithValue: false,
  });

  useEffect(() => {
    const fetchAndShowDrawing = async () => {
      if (!inkId) return;

      const timeout = 100000;
      try {
        console.log(`fetching from IPFS ${new Date().toISOString()}`);
        const drawingContent = await getFromIPFS(inkId, timeout);
        console.log(`received from IPFS ${new Date().toISOString()}`);

        setCanvasState("decompressing");
        console.log(`decompressing ${new Date().toISOString()}`);
        const decompressed = LZ.decompressFromUint8Array(drawingContent);

        console.log(`finding length ${new Date().toISOString()}`);
        const parsedDrawing = JSON.parse(decompressed);
        const points = parsedDrawing.lines.reduce((acc: number, line: any) => acc + line.points.length, 0);
        drawingCanvas.current?.loadSaveData(decompressed, true);
        console.log(`saving ${new Date().toISOString()}`);
        setDrawingSize(points);
        totalLines.current = parsedDrawing.lines.length;
        console.log(drawingSize);
        setDrawing(decompressed);
        setCanvasState("ready");

        console.log(`done ${new Date().toISOString()}`);
      } catch (e) {
        console.error("Error loading or decompressing drawing:", e);
      }
    };

    setCanvasKey(Date.now());
    fetchAndShowDrawing();
  }, [inkId]);

  const detailContent = (
    <Descriptions
      column={1}
      labelStyle={{
        fontSize: 12,
        lineHeight: 0,
        margin: 0,
      }}
      contentStyle={{
        fontSize: 10,
        lineHeight: 0,
        margin: 0,
      }}
    >
      <Descriptions.Item label="Name">{inkJson?.name}</Descriptions.Item>
      <Descriptions.Item label="Artist">{ink?.artist?.id}</Descriptions.Item>
      <Descriptions.Item label="drawingHash">
        {inkId}
        {/* {clickAndSave} */}
      </Descriptions.Item>
      <Descriptions.Item label="id">{ink?.inkNumber}</Descriptions.Item>
      <Descriptions.Item label="jsonUrl">{ink?.jsonUrl}</Descriptions.Item>
      {inkJson.image && (
        <Descriptions.Item label="Image">
          {
            <a
              href={inkJson.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/")}
              target="_blank"
            >
              {inkJson.image}
            </a>
          }
        </Descriptions.Item>
      )}
      <Descriptions.Item label="Count">{ink?.count ? ink?.count : "0"}</Descriptions.Item>
      <Descriptions.Item label="Limit">{ink?.limit}</Descriptions.Item>
      {/* <Descriptions.Item label="Description">{inkJson.description}</Descriptions.Item> */}
      <Descriptions.Item label="Price">
        {ink?.mintPrice && ink?.mintPrice > 0 ? formatEther(BigInt(ink?.mintPrice)) : "No price set"}
      </Descriptions.Item>
    </Descriptions>
  );

  return (
    <>
      <Row className="w-[90vmin] mx-auto mt-[1vh] flex justify-center">
        <p className="text-2xl my-1">
          {ink && ink?.burned ? "🔥🔥This ink has been burned🔥🔥" : inkJson ? inkJson.name : <Spin />}
        </p>

        <Button
          loading={canvasState !== "ready"}
          disabled={canvasState !== "ready"}
          className="mt-1 ml-1"
          onClick={() => {
            setDrawingSize(0);
            // @ts-ignore:next-line
            drawingCanvas.current.loadSaveData(drawing, false);
            setCanvasState("drawing");
          }}
          icon={<PlaySquareOutlined />}
        >
          {canvasState === "ready" ? "PLAY" : canvasState}
        </Button>

        <div>
          <Popover
            content={
              <InputNumber
                min={0}
                max={10}
                value={playSpeed}
                onChange={value => {
                  if (value && 0 <= value && value <= 10) {
                    setPlaySpeed(value);
                  }
                }}
              />
            }
            title="Playback speed"
          >
            <QuestionCircleOutlined />
          </Popover>
        </div>

        {ink && connectedAddress && connectedAddress.toLowerCase() == ink.artist.id && (
          <>
            <Button
              className="mt-1 ml-1"
              onClick={() => {
                if (!drawing) return;
                const _savedData = LZ.compress(drawing);
                setDrawingLocalStorage(_savedData);
                router.push("/create");
              }}
            >
              <span style={{ marginRight: 12 }} role="img" aria-label="Fork">
                🍴
              </span>{" "}
              FORK
            </Button>
          </>
        )}
      </Row>
      <div
        style={{
          backgroundColor: "#666666",
          width: size[0],
          height: size[0],
          margin: "0 auto",
        }}
      >
        <div style={{ position: "relative" }}>
          {drawingSize >= 10000 && (
            <div
              style={{
                width: "100%",
                position: "absolute",
                margin: "auto",
              }}
            >
              {inkJson.image ? (
                <object
                  type="image/png"
                  className="w-full h-full"
                  data={inkJson.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/")}
                >
                  <img src={inkJson.image} />
                </object>
              ) : (
                <Loader />
              )}
            </div>
          )}
          <div className="w-full h-full absolute">
            {
              <CanvasDraw
                key={canvasKey}
                ref={drawingCanvas}
                canvasWidth={size[0]}
                canvasHeight={size[1]}
                lazyRadius={4}
                disabled={true}
                hideGrid={true}
                hideInterface={true}
                // saveData={drawing}
                loadTimeOffset={10 - playSpeed}
                onChange={() => {
                  try {
                    // @ts-ignore:next-line
                    drawnLines.current = drawingCanvas?.current?.lines.length;
                    if (drawnLines?.current >= totalLines?.current && canvasState !== "ready") {
                      console.log("enabling it!");
                      setCanvasState("ready");
                    }
                  } catch (e) {
                    console.log(e);
                  }
                }}
              />
            }
          </div>
        </div>
        <div style={{ marginLeft: calculatedCanvaSize - 10, marginTop: calculatedCanvaSize + 5 }}></div>
        <div className="mt-15 flex justify-between gap-1">
          <div className="flex gap-2">
            <LikeButton
              likeCount={ink?.likeCount}
              hasLiked={ink?.likes?.length > 0}
              targetId={ink?.inkNumber}
              connectedAddress={connectedAddress}
            />
            <div className="hidden sm:block">
              <Popover
                content={detailContent}
                title="Ink Details"
                placement="topLeft"
                arrow={false}
                overlayStyle={{
                  maxWidth: "500px",
                }}
              >
                <Button shape="circle" icon={<QuestionCircleOutlined />} />
              </Popover>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              shape="circle"
              onClick={() => {
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  "Check out my drawing here:",
                )}&url=${encodeURIComponent(`https://nifty.ink/ink/${inkId}`)}${`&hashtags=${encodeURIComponent(
                  "handmade #onchain",
                )}`}${`&via=${encodeURIComponent("NiftyInk")}`}`;
                window.open(twitterUrl, "_blank");
              }}
              icon={<XOutlined />}
            />
            <CopyToClipboard text={`https://nifty.ink/ink/${inkId}`}>
              <Button shape="circle" className="border-2" icon={<LinkOutlined />} />
            </CopyToClipboard>
          </div>
        </div>
      </div>
    </>
  );
};
