import React from "react";
import { Col, InputNumber, Row, Slider } from "antd";

interface BrushControlsProps {
  brushRadius: number;
  updateBrushRadius: (value: number | null) => void;
}

export const BrushControls: React.FC<BrushControlsProps> = ({ brushRadius, updateBrushRadius }) => {
  return (
    <Row
      style={{
        margin: "0 auto",
        marginTop: "4vh",
        justifyContent: "center",
      }}
    >
      <Col span={12}>
        <Slider
          min={1}
          max={100}
          onChange={updateBrushRadius}
          value={typeof brushRadius === "number" ? brushRadius : 0}
        />
      </Col>
      <Col span={4}>
        <InputNumber min={1} max={100} style={{ margin: "0 16px" }} value={brushRadius} onChange={updateBrushRadius} />
      </Col>
    </Row>
  );
};
