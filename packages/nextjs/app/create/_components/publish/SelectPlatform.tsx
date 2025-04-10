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
        <select
          defaultValue={selectedPlatform}
          className="select select-bordered select-sm"
          onChange={e => onSelect(e.target.value as Platform)}
        >
          <option value="niftyink">nifty.ink</option>
          <option value="zora">Zora</option>
        </select>
      </label>
    </div>
  );
};

export default SelectPlatform;
