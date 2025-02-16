import React from "react";
import Image from "next/image";
import { Chains } from "~~/types/chains";

type SelectChainProps = {
  onSelect: (newValue: Chains) => void;
};

const SelectChain: React.FC<SelectChainProps> = ({ onSelect }) => {
  return (
    <div className="mb-4 flex items-center justify-center">
      <label className="">
        <div className="label">
          <span className="label-text">Pick the chain</span>
        </div>
        <select className="select select-bordered select-sm" onChange={e => onSelect(e.target.value as Chains)}>
          <option value={Chains.gnosis}>Gnosis</option>
          <option value={Chains.base}>Base</option>
        </select>
      </label>
    </div>
  );
};

export default SelectChain;
