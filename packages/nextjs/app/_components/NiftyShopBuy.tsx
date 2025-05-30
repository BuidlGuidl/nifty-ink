"use client";

import { useState } from "react";
import { useChainSwitcher } from "../_hooks/useChainSwitcher";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import { formatEther } from "viem";
import { gnosis } from "viem/chains";
import { useAccount, useWriteContract } from "wagmi";
import { NIFTY_TOKEN_CONTRACT } from "~~/contracts/externalContracts";
import { notification } from "~~/utils/scaffold-eth";

export const NiftyShopBuy = ({
  price,
  itemForSale,
  inkName,
  type,
}: {
  price: number;
  itemForSale: string;
  inkName: string;
  type: string;
}) => {
  const { chain } = useAccount();
  const { switchTo } = useChainSwitcher();
  const { writeContractAsync } = useWriteContract();
  const [buying, setBuying] = useState(false);

  const buyInk = async () => {
    setBuying(true);
    if (chain?.id !== gnosis.id) {
      const switched = await switchTo(gnosis);
      if (!switched) return;
    }
    try {
      await writeContractAsync({
        abi: NIFTY_TOKEN_CONTRACT.abi,
        address: NIFTY_TOKEN_CONTRACT.address,
        functionName: type === "ink" ? "buyInk" : "buyToken",
        args: [itemForSale],
        value: BigInt(price),
      });
      notification.success("Transaction completed successfully!", {
        icon: "🎉",
      });
    } catch (e) {
      console.log(e);
      notification.error("Transaction failed");
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      {price > 0 && (
        <Popconfirm
          title={'Purchase "' + inkName + '" for $' + parseFloat(formatEther(BigInt(price))).toFixed(2)}
          onConfirm={buyInk}
          okText="Purchase"
          cancelText="Cancel"
          icon={<ShoppingCartOutlined />}
        >
          <Button disabled={buying} type="primary" size="small" icon={<ShoppingCartOutlined />}>
            {"$" + parseFloat(formatEther(BigInt(price))).toFixed(2)}
          </Button>
        </Popconfirm>
      )}
    </>
  );
};
