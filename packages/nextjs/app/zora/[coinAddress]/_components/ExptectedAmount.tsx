import Image from "next/image";
import { formatEther } from "viem";

const ExpectedAmount = ({
  isBuy,
  tokenImage,
  tokenBalance,
}: {
  isBuy: boolean;
  tokenImage?: string;
  tokenBalance?: bigint;
}) => {
  return (
    isBuy && (
      <div className="flex w-full justify-between items-center text-gray-400 text-sm mt-2">
        <span>Minimum received</span>
        {tokenImage && (
          <span className="flex items-center gap-1 font-semibold text-black">
            <Image src={tokenImage} alt="token" className="w-5 h-5" width={20} height={20} />
            {/* TODO: UPDATE TO USE THE TOKEN BALANCE */}
            {tokenBalance ? `${formatEther(tokenBalance)}` : "0"}
          </span>
        )}
      </div>
    )
  );
};

export default ExpectedAmount;
