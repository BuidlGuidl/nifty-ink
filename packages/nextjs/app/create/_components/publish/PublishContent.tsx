import { useEffect } from "react";
import { BaseOnZoraForm } from "./BaseOnZoraForm";
import { GnosisForm } from "./GnosisForm";
import SelectPlatform from "./SelectPlatform";
import { Chain } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useSearchParamsHandler } from "~~/hooks/useSearchParamsHandler";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { Chains } from "~~/types/chains";
import { Platform } from "~~/types/utils";
import { getChainId } from "~~/utils/chains";

type PublishContentProps = {
  chain: Chain;
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const PublishContent = ({ connectedAddress, drawingCanvas }: PublishContentProps) => {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { paramValue: platform, updateSearchParam: setPlatform } = useSearchParamsHandler("platform", "niftyink");

  useEffect(() => {
    if (chain?.id !== getChainId(platform === "niftyink" ? Chains.gnosis : Chains.base)) {
      switchChain?.({ chainId: getChainId(platform === "niftyink" ? Chains.gnosis : Chains.base) });
    }
  }, [chain, switchChain, platform]);

  const handleChangePlatform = (newValue: Platform) => {
    setPlatform(newValue);
  };

  return (
    <div>
      <SelectPlatform selectedPlatform={platform as Platform} onSelect={handleChangePlatform} />
      {platform === "niftyink" && <GnosisForm connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} />}
      {platform === "zora" && <BaseOnZoraForm connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} />}
    </div>
  );
};
