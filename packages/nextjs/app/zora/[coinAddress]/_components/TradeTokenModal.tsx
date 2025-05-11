import { useState } from "react";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";
import { TokenAmountInput } from "~~/app/zora/[coinAddress]/_components/TokenAmountInput";
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
        className={`btn btn-sm text-black  text-sm font-medium rounded-lg ${
          isBuy ? "btn-ghost dark:text-white" : "bg-[#FF00F0] hover:bg-[#FF00F0]"
        }`}
        onClick={() => handleClick(false)}
      >
        Sell
      </button>
    </div>
  );
};

export const TradeTokenModal = ({ modalId }: { modalId: string }) => {
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [isBuy, setIsBuy] = useState<boolean>(true);

  const { data: balance, isLoading: isBalanceLoading } = useWatchBalance({
    address: address,
    chainId: base.id,
  });

  const handleClick = (isBuy: boolean) => {
    setIsBuy(isBuy);
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
                    <span>Balance: {balance ? `${Number(balance.formatted).toFixed(6)} ETH` : "0 ETH"}</span>
                  </div>
                )}
              </div>
            </div>
            <TokenAmountInput
              value={amount}
              onChange={setAmount}
              tokenSymbol={"ETH"}
              balance={balance?.formatted ?? "0"}
            />
            <div className="flex flex-col w-full items-center mb-4">
              <button className="btn w-full bg-[#2BF738] hover:bg-green-500 text-black font-semibold rounded-xl mt-2 border-none">
                Buy
              </button>
            </div>
            {isBuy && (
              <div className="flex w-full justify-between items-center text-gray-400 text-sm mt-2">
                <span>Minimum received</span>
                <span className="flex items-center gap-1 font-semibold text-black">
                  <img src="https://i.imgur.com/your-token-image.png" alt="token" className="w-5 h-5 rounded-full" />
                  3,632,877
                </span>
              </div>
            )}
          </div>
        </label>
      </label>
    </div>
  );
};
