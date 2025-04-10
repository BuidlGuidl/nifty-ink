import React from "react";
import { HighlightOutlined } from "@ant-design/icons";
import { Button, Select } from "antd";
import { CirclePicker, SketchPicker } from "react-color";
import Github from "react-color/lib/components/github/Github";
import { useLocalStorage } from "usehooks-ts";

const { Option } = Select;
interface ColorPickerProps {
  color: string;
  updateColor: (color: { hex: string }) => void;
  colorArray: string;
  setColorArray: any;
  colorOptions: ColorOptionsType;
  portrait: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  updateColor,
  colorArray,
  setColorArray,
  colorOptions,
  portrait,
}) => {
  return (
    <>
      <div className="mt-2">
        <div className={"mb-2"}>
          {portrait ? (
            <Github
              colors={colorOptions[colorArray as keyof ColorOptionsType]}
              onChangeComplete={updateColor}
              triangle="hide"
              width={"238px"}
            />
          ) : (
            <CirclePicker
              color={color}
              onChangeComplete={updateColor}
              circleSize={24}
              circleSpacing={4}
              colors={colorOptions[colorArray as keyof ColorOptionsType]}
            />
          )}
        </div>
        <Select defaultValue={colorArray} style={{ width: 200 }} onChange={value => setColorArray(value)}>
          <Option value="recent">Recent</Option>
          <Option value="sketch">Sketch Palette</Option>
          <Option value={"circle"}>Circle Palette</Option>
          <Option value={"github"}>Github Palette</Option>
          <Option value={"twitter"}>Twitter Palette</Option>
          <Option value={"compact"}>Compact Palette</Option>
        </Select>
      </div>
      <div className="mt-2">
        <SketchPicker
          color={color}
          onChangeComplete={updateColor}
          presetColors={colorOptions[colorArray as keyof ColorOptionsType]}
        />
      </div>
    </>
  );
};
