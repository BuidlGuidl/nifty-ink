"use client";

import Image from "next/image";
import Link from "next/link";
import xDai from "../../public/xDai.png";
import { LikeButton } from "./LikeButton";
import LoadMoreButton from "./LoadMoreButton";
import { formatEther } from "viem";

type InkListProps = {
  inks: Record<number, Ink>;
  orderBy: keyof Ink;
  orderDirection: string;
  layout: string;
  likesData: Ink[];
  connectedAddress: string | undefined;
  moreInksLoading: boolean;
  allItemsLoaded: boolean;
  loadMoreInks: () => void;
};

export const InkList = ({
  inks,
  orderBy,
  orderDirection,
  layout,
  likesData,
  moreInksLoading,
  connectedAddress,
  allItemsLoaded,
  loadMoreInks,
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
                        <Link href={{ pathname: "/ink/" + inks[ink].id }} className="">
                          <Image
                            src={inks[ink]?.metadata?.image as string}
                            alt={inks[ink]?.metadata?.name as string}
                            width={layout === "cards" ? "180" : "150"}
                            height={layout === "cards" ? "180" : "150"}
                            className={`${layout === "cards" ? "border border-gray-200 rounded-lg" : ""}`}
                          />
                          {layout === "cards" && (
                            <>
                              <div className="flex flex-col items-center w-44">
                                <h3 className="my-2 text-md font-bold">
                                  {(inks[ink]?.metadata?.name?.length ?? 0) > 18
                                    ? inks[ink]?.metadata?.name.slice(0, 15).concat("...")
                                    : inks[ink]?.metadata?.name}
                                </h3>
                                <div className="flex items-center justify-center w-44">
                                  {inks[ink]?.bestPrice > 0 ? (
                                    <>
                                      <p className="m-0">
                                        <b>{parseFloat(formatEther(BigInt(inks[ink]?.bestPrice)))} </b>
                                      </p>
                                      <Image
                                        src={xDai.src}
                                        width={xDai.width}
                                        height={xDai.height}
                                        alt="xdai"
                                        className="ml-1"
                                      />
                                    </>
                                  ) : (
                                    <Image
                                      src={xDai.src}
                                      width={xDai.width}
                                      height={xDai.height}
                                      alt="xdai"
                                      className="ml-1 invisible"
                                    />
                                  )}
                                  <div className="mx-2">
                                    {connectedAddress && (
                                      <LikeButton
                                        targetId={inks[ink].inkNumber}
                                        likeCount={(likeInfo && likeInfo?.likeCount) || 0}
                                        hasLiked={(likeInfo && likeInfo?.likes?.length > 0) || false}
                                        connectedAddress={connectedAddress}
                                      />
                                    )}
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

      <LoadMoreButton
        allItemsLoaded={allItemsLoaded}
        allItemsLoadedText={"All inks were loaded within the specified date range."}
        moreInksLoading={moreInksLoading}
        loadMoreInks={loadMoreInks}
      />
    </div>
  );
};
