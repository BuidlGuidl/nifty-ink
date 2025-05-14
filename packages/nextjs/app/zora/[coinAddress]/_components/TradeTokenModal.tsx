import { useEffect, useState } from "react";
import { TradeTokenButton } from "./TradeTokenButton";
import { erc20Abi, formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { BuyTokenAmountInput, SellTokenAmountInput } from "~~/app/zora/[coinAddress]/_components/TokenAmountInput";
import { useWatchBalance } from "~~/hooks/scaffold-eth";

const BuySellToggle = ({ isBuy, handleClick }: { isBuy: boolean; handleClick: (isBuy: boolean) => void }) => {
  return (
    <div className="flex gap-2">
      <button
        className={`btn btn-sm text-black font-medium rounded-lg ${
          isBuy ? "bg-[#2BF738] hover:bg-[#2BF738]" : "btn-ghost dark:text-white"
        }`}
        onClick={() => handleClick(true)}
      >
        Buy
      </button>
      <button
        className={`btn btn-sm text-sm font-medium rounded-lg ${
          isBuy ? "btn-ghost dark:text-white" : "bg-[#FF00F0] hover:bg-[#FF00F0]"
        }`}
        onClick={() => handleClick(false)}
      >
        Sell
      </button>
    </div>
  );
};

type TradeTokenModalProps = {
  modalId: string;
  tokenImage?: string;
  coinAddress: string;
};

export const TradeTokenModal = ({ modalId, tokenImage, coinAddress }: TradeTokenModalProps) => {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState<string>("");
  const [isBuy, setIsBuy] = useState<boolean>(true);

  const { data: balance, isLoading: isBalanceLoading } = useWatchBalance({
    address: address,
    chainId: base.id,
  });

  const { data: tokenBalance, refetch } = useReadContract({
    address: coinAddress,
    chainId: base.id,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address || ""],
  });

  const isSufficient = isBuy ? (balance?.value ?? 0n) > parseEther(amount) : (tokenBalance ?? 0n) >= parseEther(amount);

  useEffect(() => {
    refetch();
  }, [address]);

  useEffect(() => {
    if (chain?.id !== base.id) {
      switchChain?.({ chainId: base.id });
    }
  }, [chain, switchChain]);

  const handleTrade = () => {
    setAmount("");
    refetch();
  };

  const handleChangeAmount = (value: string) => {
    // add check to see if the value is a number
    if (isNaN(Number(value))) {
      return;
    }

    setAmount(value);
  };

  const handleClick = (isBuy: boolean) => {
    setIsBuy(isBuy);
    setAmount("");
  };

  return (
    <div>
      <input type="checkbox" id={modalId} className="modal-toggle" />
      <label htmlFor={modalId} className="modal cursor-pointer">
        <label className="modal-box relative max-w-md w-full p-0 overflow-visible">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <div className="rounded-3xl p-4 w-full max-w-md shadow-lg flex flex-col items-center">
            <div className="flex w-full mb-4">
              <BuySellToggle isBuy={isBuy} handleClick={handleClick} />
              <div className="w-full flex justify-end mb-1 pr-1">
                {isBalanceLoading ? (
                  <span className="animate-pulse">Loading balance...</span>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    {isBuy ? (
                      <span>Balance: {balance ? `${Number(balance.formatted).toFixed(6)} ETH` : "0 ETH"}</span>
                    ) : (
                      <span>Balance: {tokenBalance ? `${Number(formatEther(tokenBalance)).toFixed(4)}` : "0 "}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {isBuy ? (
              <BuyTokenAmountInput
                value={amount}
                onChange={handleChangeAmount}
                tokenSymbol={"ETH"}
                balance={balance?.formatted ?? "0"}
              />
            ) : (
              <SellTokenAmountInput
                value={amount}
                onChange={handleChangeAmount}
                tokenImage={tokenImage}
                balance={tokenBalance ?? 0n}
              />
            )}
            <div className="flex flex-col w-full items-center mb-4">
              <TradeTokenButton
                direction={isBuy ? "buy" : "sell"}
                coinAddress={coinAddress}
                connectedAddress={address || ""}
                amount={amount}
                isSufficient={isSufficient}
                onTrade={handleTrade}
              />
            </div>

            {/* Simulate buy doesn't work.  */}
            {/* <ExpectedAmount isBuy={isBuy} tokenImage={tokenImage} tokenBalance={tokenBalance} /> */}
          </div>
        </label>
      </label>
    </div>
  );
};
