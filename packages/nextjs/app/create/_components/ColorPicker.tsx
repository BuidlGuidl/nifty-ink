import React from "react";
import { HighlightOutlined } from "@ant-design/icons";
import { Button, Col, Row, Select } from "antd";
import { AlphaPicker, CirclePicker, SketchPicker } from "react-color";

const { Option } = Select;
interface ColorPickerProps {
  color: string;
  updateColor: (color: { hex: string }) => void;
  colorArray: string;
  setColorArray: any;
  setPicker: any;
  picker: number;
  colorOptions: ColorOptionsType;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  updateColor,
  colorArray,
  setColorArray,
  setPicker,
  picker,
  colorOptions,
}) => {
  const pickers = [SketchPicker, CirclePicker];
  const pickerIndex = typeof picker === "number" ? picker % pickers.length : 0;
  const PickerDisplay: React.ComponentType<any> = pickers[pickerIndex];

  return (
    <>
      <Row style={{ justifyContent: "center", marginBottom: 10 }}>
        <Select defaultValue={colorArray} style={{ width: 200 }} onChange={value => setColorArray(value)}>
          <Option value="recent">Recent</Option>
          <Option value="sketch">Sketch Palette</Option>
          <Option value={"circle"}>Circle Palette</Option>
          <Option value={"github"}>Github Palette</Option>
          <Option value={"twitter"}>Twitter Palette</Option>
          <Option value={"compact"}>Compact Palette</Option>
          <Option value={"niftyone"}>Palette #1</Option>
          <Option value={"niftytwo"}>Palette #2</Option>
          <Option value={"niftythree"}>Palette #3</Option>
          <Option value={"niftyfour"}>Palette #4</Option>
          <Option value={"niftyfive"}>Palette #5</Option>
          <Option value={"niftysix"}>Palette #6</Option>
          <Option value={"niftyseven"}>Palette #7</Option>
          <Option value={"niftyeight"}>Palette #8</Option>
        </Select>
        <Button onClick={() => setPicker(picker + 1)} icon={<HighlightOutlined />} />
      </Row>
      <Row
        style={{
          justifyContent: "center",
          alignItems: "middle",
          padding: 4,
        }}
      >
        <PickerDisplay
          color={color}
          onChangeComplete={updateColor}
          colors={colorOptions[colorArray as keyof ColorOptionsType]}
          presetColors={colorOptions[colorArray as keyof ColorOptionsType]}
        />
      </Row>
      <Row
        style={{
          margin: "0 auto",
          marginTop: "4vh",
          justifyContent: "center",
          alignItems: "middle",
        }}
      >
        <AlphaPicker onChangeComplete={updateColor} color={color} />
      </Row>
    </>
  );
};
