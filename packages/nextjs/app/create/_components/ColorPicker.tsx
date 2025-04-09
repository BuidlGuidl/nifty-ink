import React from "react";
import { HighlightOutlined } from "@ant-design/icons";
import { Button, Select } from "antd";
import { CirclePicker, SketchPicker } from "react-color";
import { useLocalStorage } from "usehooks-ts";

const { Option } = Select;
interface ColorPickerProps {
  color: string;
  updateColor: (color: { hex: string }) => void;
  colorArray: string;
  setColorArray: any;
  colorOptions: ColorOptionsType;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  updateColor,
  colorArray,
  setColorArray,
  colorOptions,
}) => {
  const [isSketch, setIsSketch] = useLocalStorage("isSketch", true);

  return (
    <>
      <div className="mt-2">
        <Select defaultValue={colorArray} style={{ width: 200 }} onChange={value => setColorArray(value)}>
          <Option value="recent">Recent</Option>
          <Option value="sketch">Sketch Palette</Option>
          <Option value={"circle"}>Circle Palette</Option>
          <Option value={"github"}>Github Palette</Option>
          <Option value={"twitter"}>Twitter Palette</Option>
          <Option value={"compact"}>Compact Palette</Option>
        </Select>
        <Button onClick={() => setIsSketch(!isSketch)} icon={<HighlightOutlined />} />
      </div>
      <div className="mt-2">
        {isSketch ? (
          <SketchPicker
            color={color}
            onChangeComplete={updateColor}
            presetColors={colorOptions[colorArray as keyof ColorOptionsType]}
          />
        ) : (
          <CirclePicker
            color={color}
            onChangeComplete={updateColor}
            colors={colorOptions[colorArray as keyof ColorOptionsType]}
          />
        )}
      </div>
    </>
  );
};
