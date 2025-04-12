import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Slider } from "antd";
import { AlphaPicker } from "react-color";

interface BrushControlsProps {
  color: string;
  brushRadius: number;
  updateColor: (color: any) => void;
  updateBrushRadius: (value: number | null) => void;
}

export const BrushControls = ({ color, brushRadius, updateColor, updateBrushRadius }: BrushControlsProps) => {
  // TODO: Remove this
  const handleOpacityChange = (value: number) => {
    const [r, g, b] = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    updateColor({ rgb: { r, g, b, a: value / 100 } });
  };

  const currentOpacity = Math.round(parseFloat(color.split(",")[3]?.replace(")", "")) * 100);

  return (
    <div className="flex flex-col items-center gap-2 max-w-md w-10/12">
      <div className="flex items-center gap-2 w-full tooltip tooltip-primary" data-tip={`${currentOpacity}%`}>
        <Button
          icon={<MinusOutlined />}
          onClick={() => handleOpacityChange(Math.max(0, currentOpacity - 1))}
          size="small"
        />
        <AlphaPicker onChange={updateColor} color={color} />
        <Button
          icon={<PlusOutlined />}
          onClick={() => handleOpacityChange(Math.min(100, currentOpacity + 1))}
          size="small"
        />
      </div>
      <div className="flex items-center gap-2 w-full tooltip tooltip-primary" data-tip={brushRadius}>
        <Button icon={<MinusOutlined />} onClick={() => updateBrushRadius(Math.max(1, brushRadius - 1))} size="small" />
        <Slider
          min={1}
          max={100}
          onChange={updateBrushRadius}
          value={typeof brushRadius === "number" ? brushRadius : 0}
          className="w-full"
          style={{ margin: "0" }}
          tooltip={{ open: false }}
        />
        <Button
          icon={<PlusOutlined />}
          onClick={() => updateBrushRadius(Math.min(100, brushRadius + 1))}
          size="small"
        />
      </div>
    </div>
  );
};
