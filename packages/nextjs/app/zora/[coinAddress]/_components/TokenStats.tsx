import { IconWrapper } from "./IconWrapper";
import { HoldersIcon, MarketCapIcon, VolumeIcon } from "./icons";

export const TokenStats = ({
  marketCap,
  totalVolume,
  uniqueHolders,
}: {
  marketCap?: string;
  totalVolume?: string;
  uniqueHolders?: number;
}) => {
  const modalId = "buy-modal";

  return (
    <div className="flex justify-between gap-1 w-full">
      <div className="flex items-center gap-2">
        <IconWrapper icon={<MarketCapIcon className="w-6 h-6" />} text={marketCap ? `$${marketCap}` : "$0"} />
        <IconWrapper icon={<VolumeIcon className="w-6 h-6" />} text={totalVolume ? `$${totalVolume}` : "$0"} />
        <IconWrapper icon={<HoldersIcon className="w-6 h-6" />} text={uniqueHolders ? uniqueHolders.toString() : "0"} />
      </div>
      <div className="flex gap-2 mt-1">
        <label
          htmlFor={modalId}
          className="bg-[#2BF738] border-1 shadow-[0_0_0_1px_rgba(144,238,144,0.5)] hover:bg-green-500 text-black text-sm font-semibold rounded-lg px-4 py-2 transition cursor-pointer"
        >
          Buy
        </label>
      </div>
    </div>
  );
};
