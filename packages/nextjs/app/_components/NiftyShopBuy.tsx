"use client";

import { useState } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import { formatEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
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
  const [buying, setBuying] = useState(true);

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyToken");

  const buyInk = async () => {
    setBuying(true);
    try {
      await writeYourContractAsync({
        functionName: type === "ink" ? "buyInk" : "buyToken",
        args: [itemForSale],
        value: BigInt(price),
      });
    } catch (e) {
      setBuying(false);
      console.log(e);
      notification.error("Something went wrong");
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
          <Button type="primary" size="small" icon={<ShoppingCartOutlined />}>
            {"$" + parseFloat(formatEther(BigInt(price))).toFixed(2)}
          </Button>
        </Popconfirm>
      )}
    </>
  );
};
