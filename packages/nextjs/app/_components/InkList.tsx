"use client";

import React from "react";
import Link from "next/link";
import { LikeButton } from "./LikeButton";
import { formatEther } from "viem";
import xDai from "~~/public/xDAI.png";

type InkListProps = {
  inks: Record<number, Ink>;
  orderBy: keyof Ink;
  orderDirection: string;
  layout: string;
  connectedAddress: string | undefined;
  isInksLoading: boolean;
};

export const InkList = ({ inks, orderBy, orderDirection, layout, connectedAddress }: InkListProps) => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
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
                              <h3 className="my-2 text-lg font-bold">
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
  );
};
