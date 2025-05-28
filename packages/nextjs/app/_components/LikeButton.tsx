"use client";

import React, { useState } from "react";
import { useChainSwitcher } from "../_hooks/useChainSwitcher";
import { LikeOutlined, LikeTwoTone } from "@ant-design/icons";
import { Badge, Button } from "antd";
import { gnosis } from "viem/chains";
import { useAccount, useWriteContract } from "wagmi";
import { LIKER_CONTRACT, NIFTY_INK_CONTRACT } from "~~/contracts/externalContracts";
import { notification } from "~~/utils/scaffold-eth";

interface LikeButtonProps {
  likeCount?: number;
  hasLiked?: boolean;
  targetId?: number;
}

export const LikeButton = ({ likeCount, hasLiked, targetId }: LikeButtonProps) => {
  const [minting, setMinting] = useState(false);
  const { chain } = useAccount();
  const { switchTo } = useChainSwitcher();

  const { writeContractAsync: writeContractAsync } = useWriteContract();

  const handleLike = async (e: React.MouseEvent<HTMLElement, MouseEvent>): Promise<void> => {
    e.preventDefault();

    if (!hasLiked && !minting) {
      setMinting(true);
      if (chain?.id !== gnosis.id) {
        const switched = await switchTo(gnosis);
        if (!switched) return;
      }

      try {
        await writeContractAsync({
          abi: LIKER_CONTRACT.abi,
          address: LIKER_CONTRACT.address,
          functionName: "like",
          args: [NIFTY_INK_CONTRACT.address, BigInt(String(targetId))],
        });
        notification.success("Transaction completed successfully!", {
          icon: "🎉",
        });
      } catch (e) {
        console.log(e);
        notification.error("Failed to like");
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
          cursor: "pointer",
          boxShadow: "2px 2px 3px #d0d0d0",
        }}
      ></Button>
    </Badge>
  );
};
