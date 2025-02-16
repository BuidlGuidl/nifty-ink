import { useState } from "react";
import { BaseOnZoraForm } from "./BaseOnZoraForm";
import { GnosisForm } from "./GnosisForm";
import SelectChain from "./SelectChain";
import { Chain } from "viem";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { Chains } from "~~/types/chains";

type PublishContentProps = {
  chain: Chain;
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const PublishContent = ({ chain, connectedAddress, drawingCanvas }: PublishContentProps) => {
  const [selectedChain, setSelectedChain] = useState<Chains>(Chains.gnosis);

  const handleChangeChain = (newValue: Chains) => {
    console.log("newValue", newValue);
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
