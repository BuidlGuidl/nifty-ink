import React from "react";
import { Platform } from "~~/types/utils";

type SelectPlatformProps = {
  selectedPlatform: Platform;
  onSelect: (newValue: Platform) => void;
};

const SelectPlatform: React.FC<SelectPlatformProps> = ({ selectedPlatform, onSelect }) => {
  return (
    <div className="mb-4 flex items-center justify-center">
      <label className="">
        <div className="label">
          <span className="label-text">Pick the platform</span>
        </div>
        <select className="select select-bordered select-sm" onChange={e => onSelect(e.target.value as Platform)}>
          <option selected={selectedPlatform === "niftyink"} value="niftyink">
            nifty.ink
          </option>
          <option selected={selectedPlatform === "zora"} value="zora">
            Zora
          </option>
        </select>
      </label>
    </div>
  );
};

export default SelectPlatform;
