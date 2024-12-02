"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InkCanvas } from "./InkCanvas";
import { InkDetails } from "./InkDetails";
import { InkHistory } from "./InkHistory";
import { useQuery } from "@apollo/client";
import { Tabs, TabsProps } from "antd";
import * as uint8arrays from "uint8arrays";
import { useAccount } from "wagmi";
import { INK_QUERY } from "~~/apollo/queries";
import { Address } from "~~/components/scaffold-eth";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";
import { getFromIPFS } from "~~/utils/ipfs";

const ViewInk = ({ params }: { params: { inkId: string } }) => {
  const inkId = params?.inkId;
  const { address: connectedAddress } = useAccount();
  const [blockNumber, setBlockNumber] = useState(0);
  const [inkJson, setInkJson] = useState({});

  const { data: dataRaw } = useQuery(INK_QUERY, {
    variables: {
      inkUrl: inkId,
      liker: connectedAddress ? connectedAddress.toLowerCase() : "",
    },
    pollInterval: 5000,
  });

  useEffect(() => {
    const getInk = async (_data: any) => {
      const _blockNumber = parseInt(_data.metaData.value);
      if (_blockNumber >= blockNumber) {
        const timeout = 10000;
        const newInkJson = await getFromIPFS(_data.ink.jsonUrl, timeout);

        setBlockNumber(_blockNumber);
        setInkJson(JSON.parse(uint8arrays.toString(newInkJson)));
      }
    };

    dataRaw && dataRaw.ink ? getInk(dataRaw) : console.log("loading");
  }, [dataRaw]);

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: <p className={`${TEXT_PRIMARY_COLOR} my-0`}>Details</p>,
      children: (
        <>
          {connectedAddress && dataRaw?.ink && (
            <InkDetails ink={dataRaw?.ink} inkId={inkId} connectedAddress={connectedAddress} inkJson={inkJson} />
          )}
        </>
      ),
    },
    {
      key: "2",
      label: <p className={`${TEXT_PRIMARY_COLOR} my-0`}>History</p>,
      children: <InkHistory inkTokenTransfers={dataRaw?.ink?.tokenTransfers} />,
    },
  ];

  return (
    <div className="flex justify-center">
      <div className="max-w-3xl flex flex-col mt-2">
        {connectedAddress && dataRaw?.ink && (
          <InkCanvas ink={dataRaw?.ink} inkJson={inkJson} connectedAddress={connectedAddress} inkId={inkId} />
        )}

        <div className="flex flex-col items-center text-center mb-5 mt-8">
          <p className="my-0 text-xl">Artist:</p>
          <Link href={`/artist/${dataRaw?.ink?.artist?.id}`} className="my-1">
            <Address address={dataRaw?.ink?.artist?.id} size="2xl" disableAddressLink />
          </Link>
          <p className="my-0">
            {dataRaw?.ink?.createdAt &&
              new Date(parseInt(dataRaw?.ink?.createdAt) * 1000).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
          </p>
        </div>

        {connectedAddress && (
          <div className={"w-10/12 mx-auto"}>
            <Tabs defaultActiveKey="1" type="line" centered items={items}></Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInk;
