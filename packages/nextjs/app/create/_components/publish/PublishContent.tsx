import { useState } from "react";
import { BaseOnZoraForm } from "./BaseOnZoraForm";
import { GnosisForm } from "./GnosisForm";
import SelectChain from "./SelectChain";
import { Chain } from "viem";
import { useSwitchChain } from "wagmi";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { Chains } from "~~/types/chains";
import { getChainId } from "~~/utils/chains";

type PublishContentProps = {
  chain: Chain;
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const PublishContent = ({ chain, connectedAddress, drawingCanvas }: PublishContentProps) => {
  const { switchChain } = useSwitchChain();
  const [selectedChain, setSelectedChain] = useState<Chains>(Chains.gnosis);

  const handleChangeChain = (newValue: Chains) => {
    switchChain?.({ chainId: getChainId(newValue) });
    setSelectedChain(newValue);
  };

  return (
    <div>
      <SelectChain onSelect={handleChangeChain} />
      {selectedChain === Chains.gnosis && (
        <GnosisForm connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} />
      )}
      {selectedChain === Chains.base && (
        <BaseOnZoraForm connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} chainId={chain.id} />
      )}
    </div>
  );
};
