"use client";

import React, { useState } from "react";
import Link from "next/link";
import xDai from "../../public/xDai.png";
import { LikeButton } from "./LikeButton";
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
  const [currentPage, setCurrentPage] = useState<number>(1);

  return (
    <div>
      <div className="flex items-center flex-col flex-grow">
        <div className="inks-grid">
          <ul className="">
            {inks.length > 0 ? (
              inks.map(ink => (
                <li
                  key={ink.id}
                  className={`inline-block border border-gray-200 rounded-lg ${
                    layout === "cards" ? "m-2 p-2 font-bold" : ""
                  }`}
                >
                  <Link href={{ pathname: "/ink/" + ink.id }} className="text-black">
                    <img
                      src={ink?.metadata?.image}
                      alt={ink?.metadata?.name}
                      width={layout === "cards" ? "180" : "150"}
                      className={`${layout === "cards" ? "border border-gray-200 rounded-lg" : ""}`}
                    />
                    {layout === "cards" && (
                      <>
                        <div className="flex flex-col items-center w-44">
                          <h3 className="my-2 text-md font-bold">
                            {ink?.metadata?.name?.length ?? 0 > 18 // review for zero
                              ? ink?.metadata?.name.slice(0, 15).concat("...")
                              : ink?.metadata?.name}
                          </h3>
                          <div className="flex items-center justify-center w-44">
                            {ink?.bestPrice > 0 ? (
                              <>
                                <p className="text-gray-600 m-0">
                                  <b>{parseFloat(formatEther(BigInt(ink?.bestPrice)))} </b>
                                </p>
                                <img src={xDai.src} alt="xdai" className="ml-1" />
                              </>
                            ) : (
                              <img src={xDai.src} alt="xdai" className="ml-1 invisible" />
                            )}
                            {/* <div className="mx-2">
                                  <LikeButton
                                    // metaProvider={props.metaProvider}
                                    // metaSigner={props.metaSigner}
                                    // injectedGsnSigner={props.injectedGsnSigner}
                                    // signingProvider={props.injectedProvider}
                                    // localProvider={props.kovanProvider}
                                    // contractAddress={props.contractAddress}
                                    targetId={inks[ink].inkNumber}
                                    likerAddress={connectedAddress}
                                    // transactionConfig={props.transactionConfig}
                                    likeCount={inks[ink]?.likeCount || 0}
                                    hasLiked={false}
                                    // hasLiked={(likeInfo && likeInfo.likes.length > 0) || false}
                                    // marginBottom="0"
                                  />
                                </div> */}
                          </div>
                          <Divider className="my-2" />
                          <p className="text-gray-600 m-0 text-sm">
                            {"Edition: " + ink?.count + (Number(ink?.limit) > 0 ? "/" + ink?.limit : "")}
                          </p>
                        </div>
                      </>
                    )}
                  </Link>
                </li>
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
    </div>
  );
};
