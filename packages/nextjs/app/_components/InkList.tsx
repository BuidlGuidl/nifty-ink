"use client";

import { useState } from "react";
import Link from "next/link";
import xDai from "../../public/xDai.png";
import { LikeButton } from "./LikeButton";
import { Button, Typography } from "antd";
import { formatEther } from "viem";

type InkListProps = {
  inks: Record<number, Ink>;
  orderBy: keyof Ink;
  orderDirection: string;
  layout: string;
  likesData: Ink[];
  connectedAddress: string | undefined;
  MoreInksLoading: boolean;
  onLoadMore: () => void;
  allItemsLoaded: boolean;
};

export const InkList = ({
  inks,
  orderBy,
  orderDirection,
  layout,
  likesData,
  MoreInksLoading,
  connectedAddress,
  allItemsLoaded,
  onLoadMore,
}: InkListProps) => {
  return (
    <div>
      <div className="flex items-center flex-col flex-grow">
        <div className="inks-grid">
          <ul className="p-0 text-center list-none">
            {inks
              ? Object.keys(inks)
                  .sort((a, b) => {
                    const inkA = Number(inks[Number(a)]?.[orderBy]);
                    const inkB = Number(inks[Number(b)]?.[orderBy]);
                    return orderDirection === "desc" ? inkB - inkA : inkA - inkB;
                  })
                  .map(inkKey => {
                    const ink = Number(inkKey);
                    const likeInfo =
                      likesData?.length > 0 && likesData.find(element => element.inkNumber === inks[ink].inkNumber);
                    return (
                      <li
                        key={inks[ink].id}
                        className={`inline-block border border-gray-200 rounded-lg ${
                          layout === "cards" ? "m-2 p-2 font-bold" : ""
                        }`}
                      >
                        <Link href={{ pathname: "/ink/" + inks[ink].id }} className="text-black">
                          <img
                            src={inks[ink]?.metadata?.image}
                            alt={inks[ink]?.metadata?.name}
                            width={layout === "cards" ? "180" : "150"}
                            className={`${layout === "cards" ? "border border-gray-200 rounded-lg" : ""}`}
                          />
                          {layout === "cards" && (
                            <>
                              <div className="flex flex-col items-center w-44">
                                <h3 className="my-2 text-md font-bold">
                                  {inks[ink]?.metadata?.name?.length ?? 0 > 18 // review for zero
                                    ? inks[ink]?.metadata?.name.slice(0, 15).concat("...")
                                    : inks[ink]?.metadata?.name}
                                </h3>
                                <div className="flex items-center justify-center w-44">
                                  {inks[ink]?.bestPrice > 0 ? (
                                    <>
                                      <p className="text-gray-600 m-0">
                                        <b>{parseFloat(formatEther(BigInt(inks[ink]?.bestPrice)))} </b>
                                      </p>
                                      <img src={xDai.src} alt="xdai" className="ml-1" />
                                    </>
                                  ) : (
                                    <img src={xDai.src} alt="xdai" className="ml-1 invisible" />
                                  )}
                                  <div className="mx-2">
                                    <LikeButton
                                      targetId={inks[ink].inkNumber}
                                      likeCount={(likeInfo && likeInfo?.likeCount) || 0}
                                      hasLiked={(likeInfo && likeInfo?.likes?.length > 0) || false}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  })
              : null}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div aria-label="Page navigation" className="flex space-x-2">
          <div>
            {allItemsLoaded ? (
              <div className="mt-2 text-lg">All inks were loaded within the specified date range.</div>
            ) : (
              <Button
                type="dashed"
                size="large"
                block
                className="mt-2 flex items-center"
                onClick={() => onLoadMore()}
                disabled={MoreInksLoading}
              >
                {MoreInksLoading ? "Loading..." : "Load more"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
