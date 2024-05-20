"use client";

import React, { useState } from "react";

// import { notification, Badge } from "antd";
// import { LikeTwoTone, LikeOutlined } from "@ant-design/icons";
// import { useContractLoader, usePoller } from "./hooks";
// import { transactionHandler } from "./helpers";

interface LikeButtonProps {
  likeCount?: number;
  hasLiked?: boolean;
  contractAddress?: string;
  targetId?: number;
  likerAddress?: string;
}

export const LikeButton = ({ likeCount, hasLiked }: LikeButtonProps) => {
  const [minting, setMinting] = useState(false);

  //   const readContracts = useContractLoader(props.metaProvider);

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> => {
    e.preventDefault();
    if (!hasLiked && !minting) {
      setMinting(true);
      //       try {
      //         const contractAddress = props.contractAddress;
      //         const target = props.targetId;
      //         const liker = props.likerAddress;

      //         const contractName = "Liker";
      //         const regularFunction = "like";
      //         const regularFunctionArgs = [contractAddress, target];
      //         const signatureFunction = "likeWithSignature";
      //         const signatureFunctionArgs = [contractAddress, target, liker];
      //         const getSignatureTypes = [
      //           "bytes",
      //           "bytes",
      //           "address",
      //           "address",
      //           "uint256",
      //           "address"
      //         ];
      //         const getSignatureArgs = [
      //           "0x19",
      //           "0x00",
      //           readContracts["Liker"].address,
      //           contractAddress,
      //           target,
      //           liker
      //         ];

      //         const likeConfig = {
      //           ...props.transactionConfig.current,
      //           contractName,
      //           regularFunction,
      //           regularFunctionArgs,
      //           signatureFunction,
      //           signatureFunctionArgs,
      //           getSignatureTypes,
      //           getSignatureArgs
      //         };

      //         const result = await transactionHandler(likeConfig);

      //         if (result) {
      //           notification.open({
      //             message: "You liked this ink!",
      //             description: (
      //               <a
      //                 target="_blank"
      //                 href={
      //                   "https://blockscout.com/poa/xdai/tx/" + result.hash
      //                 }
      //               >
      //                 View transaction.
      //               </a>
      //             )
      //           });
      //           setMinting(false);
      //           console.log(result);
      //         }
      //       } catch (e) {
      //         setMinting(false);
      //         console.log(e.message);
      //       }
    }
  };

  return (
    <div className="relative">
      {likeCount && likeCount > 0 && (
        <span className="absolute top-0 end-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-sky-500 text-white">
          {likeCount}
        </span>
      )}
      <button
        type="button"
        onClick={handleLike}
        className={`${
          hasLiked || minting ? "bg-primary" : "bg-secondary"
        } p-2 rounded-full shadow-md cursor-pointer shadow-[1px_2px_3px_2px_rgba(208,208,208,0.8)]`}
      >
        {minting ? (
          ""
        ) : hasLiked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 stroke-sky-700"
          >
            <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.4}
            stroke="currentColor"
            className="w-4 h-4 stroke-sky-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
