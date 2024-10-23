import React from "react";
import { BgColorsOutlined, BorderOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Button, Col, Popover, Row, Space, Table } from "antd";
import { shortCutsInfo, shortCutsInfoCols } from "~~/utils/constants";

interface CanvasActionsProps {
  fillBackground: (color: string) => void;
  drawFrame: (color: string, brushRadius: number) => void;
  color: string;
  brushRadius: number;
}

export const CanvasActions: React.FC<CanvasActionsProps> = ({ fillBackground, drawFrame, color, brushRadius }) => {
  return (
    <>
      <Row
        style={{
          margin: "0 auto",
          marginTop: "4vh",
          justifyContent: "center",
        }}
      >
        <Space>
          <Col span={4}>
            <Button onClick={() => fillBackground(color)} icon={<BgColorsOutlined />}>
              Background
            </Button>
          </Col>
          <Col span={4}>
            <Button onClick={() => drawFrame(color, brushRadius)} icon={<BorderOutlined />}>
              Frame
            </Button>
          </Col>
        </Space>
      </Row>
      <Row
        style={{
          width: "40vmin",
          margin: "0 auto",
          marginTop: "1vh",
          justifyContent: "center",
        }}
      >
        <Space>
          <Col span={4}>
            <Popover
              content={<Table columns={shortCutsInfoCols} dataSource={shortCutsInfo} size="small" pagination={false} />}
              title="Keyboard shortcuts"
              trigger="click"
            >
              <Button icon={<InfoCircleOutlined />}>Shortcuts</Button>
            </Popover>
          </Col>
        </Space>
      </Row>
    </>
  );
};
