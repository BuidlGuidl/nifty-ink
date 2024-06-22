"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { Divider, Row, Tabs } from "antd";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ARTISTS_QUERY, INK_MAIN_QUERY, INK_QUERY } from "~~/apollo/queries";
import { InkListArtist } from "~~/app/_components/InkListArtist";
import { Profile } from "~~/app/_components/Profile";
import { RecentActivity } from "~~/app/_components/RecentActivity";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import StatCard from "~~/app/_components/StatCard";
import { getMetadata } from "~~/utils/helpers";

const { TabPane } = Tabs;

const ViewInk = ({ params }: { params: { inkId: string } }) => {
  const inkId = params?.inkId;
  const [inks, setInks] = useState<Ink[]>([]);
  const { address: connectedAddress } = useAccount();

  //   const {
  //     loading: loadingMain,
  //     error: errorMain,
  //     data: dataMain,
  //   } = useQuery(INK_MAIN_QUERY, {
  //     variables: { inkUrl: hash },
  //     pollInterval: 15000,
  //     client: mainClient,
  //   });

  const {
    loading,
    error,
    data: dataRaw,
  } = useQuery(INK_QUERY, {
    variables: {
      inkUrl: inkId,
      // liker: connectedAddress ? connectedAddress.toLowerCase() : "",
    },
    pollInterval: 2500,
  });

  console.log(params);
  console.log(inkId);
  console.log(dataRaw);

  //   useEffect(() => {
  //       const getInk = async (_data: any) => {
  //       let _blockNumber = parseInt(_data.metaData.value);
  //       //console.log(blockNumber, _blockNumber)
  //       if (_blockNumber >= blockNumber) {
  //         let tIpfsConfig = { ...props.ipfsConfig };
  //         tIpfsConfig["timeout"] = 10000;
  //         let newInkJson = await getFromIPFS(_data.ink.jsonUrl, tIpfsConfig);

  //         setData(_data);
  //         setBlockNumber(_blockNumber);
  //         setInkJson(JSON.parse(uint8arrays.toString(newInkJson)));
  //       }
  //     };

  //     dataRaw && dataRaw.ink ? getInk(dataRaw) : console.log("loading");
  //     dataRaw && dataRaw.ink ? setInkTokenTransfers(dataRaw.ink.tokenTransfers) : console.log();
  //   }, [dataRaw, props.address]);

  return (
    <div className="max-w-3xl">
      <Row
        style={{
          width: "90vmin",
          margin: "0 auto",
          marginTop: "1vh",
          justifyContent: "center",
        }}
      >
        {/* {data && data.ink.burned ? (
          <Typography.Text
            style={{ color: "#222222" }}
            style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}
          >
            <span role="img" aria-label="Fire">
              🔥🔥This ink has been burned🔥🔥
            </span>
          </Typography.Text>
        ) : (
          <Typography.Text
            style={{ color: "#222222" }}
            copyable={{ text: inkJson ? inkJson.external_url : "" }}
            style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}
          >
            <a href={"/" + hash} style={{ color: "#222222" }}>
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
            drawingCanvas.current.loadSaveData(drawing, false);
            setCanvasState("drawing");
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
                  setPlaySpeed(value);
                }}
              />
            }
            title="Playback speed"
          >
            <QuestionCircleOutlined />
          </Popover>
        </div>

        {data && data.ink && props.address && props.address.toLowerCase() == data.ink.artist.id && (
          <Button
            style={{ marginTop: 4, marginLeft: 4 }}
            onClick={() => {
              let _savedData = LZ.compress(drawing);
              props.setDrawing(_savedData);
              history.push("/create");
            }}
          >
            <span style={{ marginRight: 12 }} role="img" aria-label="Fork">
              🍴
            </span>{" "}
            FORK
          </Button>
        )} */}
      </Row>
    </div>
  );
};

export default ViewInk;
