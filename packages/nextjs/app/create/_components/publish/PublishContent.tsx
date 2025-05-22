import { BaseOnZoraForm } from "./BaseOnZoraForm";
import { GnosisForm } from "./GnosisForm";
import SelectPlatform from "./SelectPlatform";
import { Chain } from "viem";
import { useSearchParamsHandler } from "~~/hooks/useSearchParamsHandler";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { Platform } from "~~/types/utils";

type PublishContentProps = {
  chain: Chain;
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const PublishContent = ({ connectedAddress, drawingCanvas }: PublishContentProps) => {
  const { paramValue: platform, updateSearchParam: setPlatform } = useSearchParamsHandler("platform", "niftyink");

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
