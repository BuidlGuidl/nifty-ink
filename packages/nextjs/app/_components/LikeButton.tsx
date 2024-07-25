"use client";

import React, { useState } from "react";
import { LikeOutlined, LikeTwoTone } from "@ant-design/icons";
import { Badge, Button } from "antd";
import { useDeployedContractInfo, useScaffoldWriteContract, useWatchBalance } from "~~/hooks/scaffold-eth";
import { checkBalanceAndFund } from "~~/utils/checkBalanceAndFund";

interface LikeButtonProps {
  likeCount?: number;
  hasLiked?: boolean;
  targetId?: number;
  connectedAddress?: string;
}

export const LikeButton = ({ likeCount, hasLiked, targetId, connectedAddress }: LikeButtonProps) => {
  const [minting, setMinting] = useState(false);
  const { data: balance } = useWatchBalance({
    address: connectedAddress,
  });

  const niftyInkContract = useDeployedContractInfo("NiftyInk");
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("Liker");

  const handleLike = async (e: React.MouseEvent<HTMLElement, MouseEvent>): Promise<void> => {
    e.preventDefault();
    if (!hasLiked && !minting) {
      setMinting(true);
      await checkBalanceAndFund(balance, connectedAddress);
      try {
        await writeYourContractAsync({
          functionName: "like",
          args: [niftyInkContract?.data?.address, BigInt(String(targetId))],
        });
      } catch (e) {
        console.log(e);
      } finally {
        setMinting(false);
      }
    }
  };

  return (
    <Badge color="#2db7f5" count={likeCount}>
      <Button
        onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => handleLike(e)}
        loading={minting}
        shape={"circle"}
        type={hasLiked || minting ? "primary" : "default"}
        icon={minting ? "" : hasLiked ? <LikeOutlined /> : <LikeTwoTone />}
        style={{
          zIndex: 90,
          cursor: "pointer",
          boxShadow: "2px 2px 3px #d0d0d0",
        }}
      ></Button>
    </Badge>
  );
};
