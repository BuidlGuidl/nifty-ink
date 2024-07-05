"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LikeButton } from "./LikeButton";
import { formatEther } from "viem";
import xDai from "~~/public/xDAI.png";

type InkListProps = {
  inks: Record<number, Ink>;
  orderBy: keyof Ink;
  orderDirection: string;
  layout: string;
  likesData: Ink[];
  connectedAddress: string | undefined;
  isInksLoading: boolean;
  onLoadMore: (skip: number) => void;
};

export const InkList = ({
  inks,
  orderBy,
  orderDirection,
  layout,
  likesData,
  connectedAddress,
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
            <button
              className="relative block rounded bg-transparent px-3 py-1.5 text-md transition duration-300 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-700 dark:hover:text-white"
              onClick={() => {
                onLoadMore(Object.values(inks).length);
              }}
            >
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
