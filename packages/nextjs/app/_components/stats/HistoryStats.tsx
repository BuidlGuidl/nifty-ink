"use client";

import { useEffect, useState } from "react";
import LineChart from "./LineChart";
import ToolTip from "./ToolTip";
import { Form, Select, Typography } from "antd";
import { formatEther } from "viem";

const { Option } = Select;

interface HistoryStatsProps {
  lastMonthData?: HistoryData[];
  metric: string;
  handleChangeMetric: (varName: string, newVal: string) => void;
}

const formatUnixTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit" };
  return date.toLocaleDateString("en-US", options);
};

const formatData = (data: HistoryData[], metric: string) => {
  return data.map((x, count) => {
    const formattedValue =
      metric === "saleValue"
        ? parseFloat(formatEther(BigInt(x[metric as keyof HistoryData])))
        : parseFloat(String(x[metric as keyof HistoryData]));

    return {
      d: formatUnixTimestamp(x.day),
      p: metric === "saleValue" ? formattedValue.toFixed(2) : x[metric as keyof HistoryData],
      x: count,
      y: formattedValue,
    };
  });
};

const HistoryStats: React.FC<HistoryStatsProps> = ({ lastMonthData, metric, handleChangeMetric }) => {
  const [hoverLoc, setHoverLoc] = useState<number | null>(null);
  const [activePoint, setActivePoint] = useState(null);
  const [finalData, setFinalData] = useState(lastMonthData && formatData(lastMonthData, metric));

  useEffect(() => {
    if (lastMonthData) setFinalData(formatData(lastMonthData, metric));
  }, [metric, lastMonthData]);

  const handleChartHover = (hoverLoc: number | null, activePoint: any) => {
    setHoverLoc(hoverLoc);
    setActivePoint(activePoint);
  };

  return (
    <div className="mt-5">
      <div className="flex flex-col items-center justify-center">
        <Typography.Title level={3}>Daily statistics over the previous month</Typography.Title>
        <Form layout={"inline"} initialValues={{ metric: metric }}>
          <Form.Item name="metric">
            <Select
              value={metric}
              size="large"
              onChange={val => {
                handleChangeMetric("metric", val);
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
        </Form>
      </div>
      <div>
        {finalData && hoverLoc ? <ToolTip hoverLoc={hoverLoc} activePoint={activePoint} /> : null}
        {finalData ? <LineChart data={finalData} onChartHover={(a: any, b: any) => handleChartHover(a, b)} /> : null}
      </div>
    </div>
  );
};

export default HistoryStats;
