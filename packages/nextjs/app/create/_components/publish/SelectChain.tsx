import React from "react";
import { Chains } from "~~/types/chains";

type SelectChainProps = {
  onSelect: (newValue: Chains) => void;
};

const SelectChain: React.FC<SelectChainProps> = ({ onSelect }) => {
  return (
    <div className="mb-4 flex items-center justify-center">
      <label className="">
        <div className="label">
          <span className="label-text">Pick the platform</span>
        </div>
        <select className="select select-bordered select-sm" onChange={e => onSelect(e.target.value as Chains)}>
          <option value={Chains.gnosis}>nifty.ink</option>
          <option value={Chains.base}>Zora</option>
        </select>
      </label>
    </div>
  );
};

export default SelectChain;
