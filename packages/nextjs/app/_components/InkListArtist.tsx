"use client";

import Image from "next/image";
import xDai from "../../public/xDai.png";
import LoadMoreButton from "./LoadMoreButton";
import { SingleInk } from "./SingleInk";
import { formatEther } from "viem";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";

type InkListProps = {
  inks: Ink[];
  layout?: string;
  connectedAddress?: string | undefined;
  isInksLoading: boolean;
  allItemsLoaded: boolean;
  loadMoreInks: () => void;
};

export const InkListArtist = ({
  inks,
  connectedAddress,
  allItemsLoaded,
  isInksLoading,
  loadMoreInks,
}: InkListProps) => {
  return (
    <div className={`max-w-2xl mx-auto text-center ${TEXT_PRIMARY_COLOR}`}>
      <div className="flex items-center justify-center flex-col flex-grow">
        <ul className="">
          {inks.length > 0 ? (
            <>
              {inks.map(
                ink =>
                  ink.metadata && ( // skip inks without metadata
                    <SingleInk key={ink.id} ink={ink} connectedAddress={connectedAddress}>
                      <div className="flex flex-col items-center">
                        {ink?.bestPrice > 0 ? (
                          <div className="flex m-0">
                            <p className="text-gray-600 dark:text-gray-400 m-0">
                              <b>{parseFloat(formatEther(BigInt(ink?.bestPrice)))} </b>
                            </p>
                            <Image
                              src={xDai.src}
                              width={xDai.width}
                              height={xDai.height}
                              alt="xdai"
                              className="ml-1 mb-1"
                            />
                          </div>
                        ) : (
                          <Image
                            src={xDai.src}
                            width={xDai.width}
                            height={xDai.height}
                            alt="xdai"
                            className="ml-1 mb-1 invisible"
                          />
                        )}
                        <div className="w-full h-px bg-gray-400 mb-1" />
                        <p className="text-gray-600 dark:text-gray-400 m-0 text-sm">
                          {"Edition: " + ink?.count + (Number(ink?.limit) > 0 ? "/" + ink?.limit : "")}
                        </p>
                      </div>
                    </SingleInk>
                  ),
              )}
              <LoadMoreButton
                allItemsLoaded={allItemsLoaded}
                allItemsLoadedText={"All inks were loaded."}
                moreInksLoading={isInksLoading}
                loadMoreInks={loadMoreInks}
              />
            </>
          ) : (
            <p className="text-lg">No inks found for this address</p>
          )}
        </ul>
      </div>
    </div>
  );
};
