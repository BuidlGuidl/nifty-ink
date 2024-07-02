"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MintButton from "./MintButton";
import {
  LinkOutlined,
  PlaySquareOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SendOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ApolloClient, InMemoryCache, useQuery } from "@apollo/client";
import { Button, InputNumber, List, Popover, Row, Space, Spin, Typography } from "antd";
import CanvasDraw from "react-canvas-draw";
// import { useLocalStorage } from "usehooks-ts";
import { INK_MAIN_QUERY } from "~~/apollo/queries";
import { NiftyShop } from "~~/app/_components/NiftyShop";
import { NiftyShopBuy } from "~~/app/_components/NiftyShopBuy";
import SendInkForm from "~~/app/_components/SendInkForm";
import Loader from "~~/components/Loader";
import { Address } from "~~/components/scaffold-eth";
import { getFromIPFS } from "~~/utils/ipfs";

export const InkCanvas = ({
  inkJson,
  calculatedVmin,
  ink,
  connectedAddress,
  inkId,
}: {
  inkJson: any;
  calculatedVmin: number;
  ink: Ink;
  connectedAddress: string;
  inkId: string;
}) => {
  const drawingCanvas = useRef(null);
  const [size, setSize] = useState([0.8 * calculatedVmin, 0.8 * calculatedVmin]);

  const [drawingSize, setDrawingSize] = useState(10000);
  const [drawing, setDrawing] = useState();

  const drawnLines = useRef([]);
  const [canvasState, setCanvasState] = useState("downloading");
  const totalLines = useRef([]);

  const [canvasKey, setCanvasKey] = useState(Date.now());
  //   const [playSpeed, setPlaySpeed] = useLocalStorage("playspeed", 7);
  const [playSpeed, setPlaySpeed] = useState(7);

  // useEffect(() => {
  //   setCanvasKey(Date.now());
  //   const showDrawing = async () => {
  //     if (inkId) {
  //       const timeout = 100000;
  //       let drawingContent;
  //       try {
  //         console.log(`fetching from ipfs ${new Date().toISOString()}`);
  //         drawingContent = await getFromIPFS(inkId, timeout);
  //         console.log(`received from ipfs ${new Date().toISOString()}`);
  //       } catch (e) {
  //         console.log("Loading error:", e);
  //       }
  //       try {
  //         setCanvasState("decompressing");
  //         console.log(`decompressing ${new Date().toISOString()}`);
  //         let decompressed = LZ.decompressFromUint8Array(drawingContent);
  //         //console.log(decompressed)

  //         console.log(`finding length ${new Date().toISOString()}`);
  //         let points = 0;
  //         for (const line of JSON.parse(decompressed)["lines"]) {
  //           points = points + line.points.length;
  //         }

  //         console.log(`saving ${new Date().toISOString()}`);

  //         setDrawingSize(points);
  //         totalLines.current = JSON.parse(decompressed)["lines"].length;
  //         if (points < 10000) {
  //           setCanvasState("drawing");
  //           drawingCanvas.current.loadSaveData(decompressed, false);
  //           setDrawing(decompressed);
  //         } else {
  //           setCanvasState("ready");
  //           setDrawing(decompressed);
  //         }
  //         console.log(`done ${new Date().toISOString()}`);
  //       } catch (e) {
  //         console.log("Drawing Error:", e);
  //       }
  //     }
  //   };
  //   showDrawing();
  // }, [inkId]);

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
          <Typography.Text
            style={{ color: "#222222" }}
            // style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}
          >
            <span role="img" aria-label="Fire">
              🔥🔥This ink has been burned🔥🔥
            </span>
          </Typography.Text>
        ) : (
          <Typography.Text
            style={{ color: "#222222" }}
            copyable={{ text: inkJson ? inkJson.external_url : "" }}
            // style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}
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
            // setDrawingSize(0);
            // drawingCanvas.current.loadSaveData(drawing, false);
            // setCanvasState("drawing");
          }}
        >
          <PlaySquareOutlined /> {canvasState === "ready" ? "PLAY" : canvasState}
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
                //saveData={drawing}
                immediateLoading={drawingSize >= 10000}
                loadTimeOffset={10 - playSpeed}
                onChange={() => {
                  try {
                    // drawnLines.current = drawingCanvas?.current?.lines.length;
                    // if (drawnLines.current >= totalLines.current && canvasState !== "ready") {
                    //   console.log("enabling it!");
                    //   setCanvasState("ready");
                    // }
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
