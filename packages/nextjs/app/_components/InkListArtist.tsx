"use client";

import xDai from "../../public/xDai.png";
import { SingleInk } from "./SingleInk";
import { Button, Divider, Typography } from "antd";
import { formatEther } from "viem";

type InkListProps = {
  inks: Ink[];
  layout?: string;
  connectedAddress?: string | undefined;
  isInksLoading: boolean;
  onLoadMore: () => void;
  allItemsLoaded: boolean;
};

export const InkListArtist = ({
  inks,
  layout = "cards",
  connectedAddress,
  onLoadMore,
  allItemsLoaded,
}: InkListProps) => {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex items-center justify-center flex-col flex-grow">
        <ul className="">
          {inks.length > 0 ? (
            inks.map(ink => (
              <SingleInk key={ink.id} ink={ink} connectedAddress={connectedAddress}>
                <div className="flex flex-col items-center">
                  {ink?.bestPrice > 0 ? (
                    <div className="flex m-0">
                      <p className="text-gray-600 m-0">
                        <b>{parseFloat(formatEther(BigInt(ink?.bestPrice)))} </b>
                      </p>
                      <img src={xDai.src} alt="xdai" className="ml-1 mb-1" />
                    </div>
                  ) : (
                    <img src={xDai.src} alt="xdai" className="ml-1 mb-1 invisible" />
                  )}
                  <Divider className="my-2" />
                  <p className="text-gray-600 m-0 text-sm">
                    {"Edition: " + ink?.count + (Number(ink?.limit) > 0 ? "/" + ink?.limit : "")}
                  </p>
                </div>
              </SingleInk>
            ))
          ) : (
            <Typography.Title level={4}>No inks found for this address</Typography.Title>
          )}
        </ul>
        {!allItemsLoaded && (
          <Button type="dashed" size="large" block className="mt-5 flex items-center" onClick={() => onLoadMore()}>
            Load more
          </Button>
        )}
      </div>
    </div>
  );
};
