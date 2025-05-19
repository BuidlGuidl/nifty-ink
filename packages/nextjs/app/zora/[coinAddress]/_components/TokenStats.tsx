import { IconWrapper } from "./IconWrapper";
import { HoldersIcon, MarketCapIcon, VolumeIcon } from "./icons";
import { ZoraIcon } from "~~/app/_components/ZoraIcon";
import { ZoraToken } from "~~/types/zora";
import { baseAddressPlatformReferrer } from "~~/utils/constants";

export const TokenStats = ({ zoraToken }: { zoraToken: ZoraToken }) => {
  const modalId = "buy-modal";
  const ink = `https://zora.co/coin/base:${zoraToken.address}?referrer=${baseAddressPlatformReferrer}`;

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-2 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <IconWrapper
          icon={<MarketCapIcon className="w-4 h-4 sm:w-6 sm:h-6" />}
          text={zoraToken?.marketCap ? `$${Number(zoraToken.marketCap).toFixed(2)}` : "$0"}
        />
        <IconWrapper
          icon={<VolumeIcon className="w-5 h-4 sm:w-6 sm:h-6" />}
          text={zoraToken?.totalVolume ? `$${Number(zoraToken.totalVolume).toFixed(2)}` : "$0"}
        />
        <IconWrapper
          icon={<HoldersIcon className="w-4 h-4 sm:w-6 sm:h-6" />}
          text={zoraToken?.uniqueHolders ? zoraToken.uniqueHolders.toString() : "0"}
        />
        <div className="tooltip" data-tip="View on Zora">
          <button
            onClick={() => window.open(ink, "_blank")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
            aria-label="View on Zora"
          >
            <ZoraIcon className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>
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
