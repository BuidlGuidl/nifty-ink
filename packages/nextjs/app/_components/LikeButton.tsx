"use client";

import React, { useState } from "react";
// import { notification, Badge } from "antd";
import { LikeOutlined, LikeTwoTone } from "@ant-design/icons";
import { Badge, Button } from "antd";
import { parseEther } from "viem";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface LikeButtonProps {
  likeCount?: number;
  hasLiked?: boolean;
  contractAddress?: string;
  targetId?: number;
  likerAddress?: string;
}

export const LikeButton = ({ likeCount, hasLiked, targetId }: LikeButtonProps) => {
  const [minting, setMinting] = useState(false);

  const niftyInkContract = useDeployedContractInfo("NiftyInk");
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("Liker");

  const handleLike = async (e: React.MouseEvent<HTMLElement, MouseEvent>): Promise<void> => {
    e.preventDefault();
    if (!hasLiked && !minting) {
      setMinting(true);
      try {
        await writeYourContractAsync({
          functionName: "like",
          args: [niftyInkContract?.data?.address, parseEther(String(targetId))],
        });
      } catch (e) {
        setMinting(false);
        console.log(e);
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
