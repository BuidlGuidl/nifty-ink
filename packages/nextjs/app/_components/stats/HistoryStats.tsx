"use client";

import { useEffect, useState } from "react";
import StatCard from "../StatCard";
import LineChart from "./LineChart";
import ToolTip from "./ToolTip";
import { Col, Form, Row, Select, Typography } from "antd";
import { formatEther } from "viem";

const { Option } = Select;

interface HistoryStatsProps {
  lastMonthData?: HistoryData[];
  handleChangePeriod?: (varName: string, newVal: string) => void;
}

type HistoryData = {
  artists: number;
  day: number;
  inks: number;
  sales: number;
  saleValue: number;
  tokens: number;
  upgrades: number;
  users: number;
};

const HistoryStats: React.FC<HistoryStatsProps> = ({ lastMonthData, handleChangePeriod }) => {
  const [hoverLoc, setHoverLoc] = useState<number | null>(null);
  const [activePoint, setActivePoint] = useState(null);
  const metric = "saleValue";
  const [finalData, setFinalData] = useState(
    lastMonthData &&
      lastMonthData.map((x, count) => {
        return {
          d: "hi",
          p: metric === "saleValue" ? parseFloat(formatEther(BigInt(x[metric]))).toFixed(2) : "klj",
          x: count,
          y: metric === "saleValue" ? +parseFloat(formatEther(BigInt(x[metric]))).toFixed(2) : parseFloat(x[metric]),
        };
      }),
  );

  console.log(lastMonthData && lastMonthData.length);
  console.log(finalData);

  const handleChartHover = (hoverLoc: number | null, activePoint: any) => {
    console.log("Hover Location:", hoverLoc);
    console.log("Active Point:", activePoint);
    setHoverLoc(hoverLoc);
    setActivePoint(activePoint);
  };

  return (
    <div className="">
      <div style={{ marginTop: "16px", textAlign: "left" }}>
        <div className="container">
          <div className="row">
            <Typography.Title level={3}>Daily statistics over the previous month</Typography.Title>
          </div>
          <Row gutter={16}>
            <Col>
              {/* <Form layout={"inline"} initialValues={{ metric: metric }}>
                <Form.Item name="metric" size="large">
                  <Select
                    value={metric}
                    size="large"
                    onChange={val => {
                      searchParams.set("metric", val);
                      history.push(`${location.pathname}?${searchParams.toString()}`);
                      setMetric(val);
                    }}
                  >
                    <Option value="tokens">Tokens</Option>
                    <Option value="inks">Inks</Option>
                    <Option value="sales">Sales</Option>
                    <Option value="upgrades">Upgrades</Option>
                    <Option value="artists">Artists</Option>
                    <Option value="saleValue">Sale Value</Option>
                    <Option value="users">Users</Option>
                  </Select>
                </Form.Item>
              </Form> */}
            </Col>
          </Row>
          <div className="row">
            <div className="popup">
              {finalData && hoverLoc ? <ToolTip hoverLoc={hoverLoc} activePoint={activePoint} /> : null}
            </div>
          </div>
          <div className="row">
            <div className="items-left">
              {finalData ? (
                <LineChart data={finalData} onChartHover={(a: any, b: any) => handleChartHover(a, b)} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryStats;
