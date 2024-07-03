"use client";

import { useEffect, useRef, useState } from "react";
import { PlaySquareOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, InputNumber, Popover, Row, Spin, Typography } from "antd";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import { useLocalStorage } from "usehooks-ts";
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
  const drawingCanvas = useRef(null);
  const calculatedCanvaSize = Math.round(0.7 * Math.min(window.innerWidth, window.innerHeight));
  const [size, setSize] = useState([calculatedCanvaSize, calculatedCanvaSize]);
  const [drawingSize, setDrawingSize] = useState(10000);
  const [drawing, setDrawing] = useState<string | undefined>();
  const drawnLines = useRef([]);
  const [canvasState, setCanvasState] = useState("downloading");
  const totalLines = useRef([]);
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

        console.log(`saving ${new Date().toISOString()}`);
        setDrawingSize(points);
        totalLines.current = parsedDrawing.lines.length;

        setDrawing(decompressed);
        setCanvasState(points < 10000 ? "drawing" : "ready");
        if (points < 10000) {
          // @ts-ignore:next-line
          drawingCanvas.current?.loadSaveData(decompressed, false);
        }

        console.log(`done ${new Date().toISOString()}`);
      } catch (e) {
        console.error("Error loading or decompressing drawing:", e);
      }
    };

    setCanvasKey(Date.now());
    fetchAndShowDrawing();
  }, [inkId]);

  return (
    <>
      <Row
        style={{
          width: "90vmin",
          margin: "0 auto",
          marginTop: "1vh",
          justifyContent: "center",
        }}
      >
        {ink && ink?.burned ? (
          <Typography.Text style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}>
            <span role="img" aria-label="Fire">
              🔥🔥This ink has been burned🔥🔥
            </span>
          </Typography.Text>
        ) : (
          <Typography.Text
            copyable={{ text: inkJson ? inkJson.external_url : "" }}
            style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}
          >
            <a href={"/" + inkId} style={{ color: "#222222" }}>
              {inkJson ? inkJson.name : <Spin />}
            </a>
          </Typography.Text>
        )}

        <Button
          loading={canvasState !== "ready"}
          disabled={canvasState !== "ready"}
          style={{ marginTop: 4, marginLeft: 4 }}
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
          <Button
            style={{ marginTop: 4, marginLeft: 4 }}
            onClick={() => {
              // let _savedData = LZ.compress(drawing);
              // props.setDrawing(_savedData);
              // history.push("/create");
            }}
          >
            <span style={{ marginRight: 12 }} role="img" aria-label="Fork">
              🍴
            </span>{" "}
            FORK
          </Button>
        )}
      </Row>
      <div
        style={{
          backgroundColor: "#666666",
          width: size[0],
          height: size[0],
          margin: "0 auto",
          outline: "3px solid #999999",
        }}
      >
        <div style={{ position: "relative" }}>
          {drawingSize >= 10000 && (
            <div
              style={{
                width: "100%",
                position: "absolute",
                zIndex: 90,
                margin: "auto",
              }}
            >
              {inkJson.image ? (
                <object
                  type="image/png"
                  style={{ width: "100%", height: "100%" }}
                  data={inkJson.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/")}
                >
                  <img src={inkJson.image} />
                </object>
              ) : (
                <Loader />
              )}
            </div>
          )}
          <div style={{ width: "100%", height: "100%", position: "absolute" }}>
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
                immediateLoading={drawingSize >= 10000}
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
      </div>
    </>
  );
};
