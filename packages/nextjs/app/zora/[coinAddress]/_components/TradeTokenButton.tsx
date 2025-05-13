import { useState } from "react";
import { tradeCoin } from "@zoralabs/coins-sdk";
import { Address, formatEther, parseEther } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { baseAddressPlatformReferrer } from "~~/utils/constants";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

// In your component
export const TradeTokenButton = ({
  direction,
  coinAddress,
  connectedAddress,
  amount,
  isSufficient,
  onTrade,
}: {
  direction: "buy" | "sell";
  coinAddress: Address;
  connectedAddress: Address;
  amount: string;
  isSufficient: boolean;
  onTrade: () => void;
}) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: base.id });
  const buttonText = direction === "buy" ? "Buy" : "Sell";
  const buttonColor = direction === "buy" ? "bg-[#2BF738]" : "bg-[#FF00F0]";
  const textColor = direction === "buy" ? "text-black" : "text-white";

  const [isPending, setIsPending] = useState(false);

  const handleTrade = async () => {
    // Define trade parameters
    const tradeParams = {
      direction: direction,
      target: coinAddress as Address,
      args: {
        recipient: connectedAddress as Address,
        orderSize: parseEther(amount),
        minAmountOut: 0n, // TODO: Add min amount out when we have an expected amount out
        tradeReferrer: baseAddressPlatformReferrer as Address,
      },
    };

    if (!walletClient) {
      console.error("Wallet client not connected");
      return;
    }

    setIsPending(true);
    try {
      const result: any = await tradeCoin(tradeParams, walletClient, publicClient);

      notification.success(
        <>
          <p className="font-semibold mt-0 mb-1">Transaction successful! 🎉</p>
          {result.trade && result.trade.coinsPurchased > 0n && (
            <p className="m-0">You bought {Number(formatEther(result.trade.coinsPurchased)).toFixed(4)} tokens</p>
          )}
        </>,
      );
      onTrade();
    } catch (error) {
      const parsedError = getParsedError(error);
      notification.error(parsedError);
    } finally {
      setIsPending(false);
    }
  };

  if (!isSufficient) {
    return (
      <button disabled={true} className="btn w-full text-lg rounded-xl mt-2 border-none">
        Insufficient balance
      </button>
    );
  }

  return (
    <button
      onClick={handleTrade}
      disabled={isPending}
      className={`btn w-full ${buttonColor} disabled:bg-${buttonColor} hover:${buttonColor} hover:brightness-95 ${textColor} text-lg font-medium rounded-xl mt-2 border-none`}
    >
      {isPending ? <span className="loading loading-spinner loading-sm"></span> : buttonText}
    </button>
  );
};
