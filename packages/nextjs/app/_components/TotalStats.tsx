"use client";

import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { Form, Row, Select } from "antd";
import { formatEther } from "viem";

const { Option } = Select;

interface TotalStatsProps {
  totalDataNow: TotalData;
  totalDataBefore: TotalData;
  isLoadingTotalDataNow: boolean;
  isLoadingTotalDataBefore: boolean;
  period: string;
  handleChangePeriod: (varName: string, newVal: string) => void;
}

type TotalData = {
  artists: number;
  inks: number;
  sales: number;
  saleValue: number;
  tokens: number;
  upgrades: number;
  users: number;
};

const defaultTotalData: TotalData = {
  artists: 0,
  inks: 0,
  sales: 0,
  saleValue: 0,
  tokens: 0,
  upgrades: 0,
  users: 0,
};

const TotalStats: React.FC<TotalStatsProps> = ({
  totalDataNow,
  totalDataBefore,
  isLoadingTotalDataNow,
  isLoadingTotalDataBefore,
  period,
  handleChangePeriod,
}) => {
  const [totalData, setTotalData] = useState<TotalData>(defaultTotalData);

  useEffect(() => {
    if (totalDataBefore && totalDataNow) {
      setTotalData({
        tokens: totalDataNow?.tokens - (totalDataBefore?.tokens || 0),
        inks: totalDataNow?.inks - (totalDataBefore?.inks || 0),
        saleValue:
          Number(formatEther(BigInt(totalDataNow?.saleValue))) -
          Number(formatEther(BigInt(totalDataBefore?.saleValue || 0n))),
        sales: totalDataNow.sales - (totalDataBefore?.sales || 0),
        upgrades: totalDataNow.upgrades - (totalDataBefore?.upgrades || 0),
        users: totalDataNow.users - (totalDataBefore?.users || 0),
        artists: totalDataNow.artists - (totalDataBefore?.artists || 0),
      });
    }
  }, [totalDataBefore, totalDataNow]);

  return (
    <>
      <div className="flex items-center justify-center my-5">
        <Form initialValues={{ period: period }}>
          <Form.Item name="period" className="m-0">
            <Select
              value={period}
              size="large"
              onChange={val => {
                handleChangePeriod("period", val);
              }}
            >
              <Option value="week">Week</Option>
              <Option value="month">Month</Option>
              <Option value="year">Year</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
      <div style={{ marginTop: "20px" }}>
        <Row gutter={16}>
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "0",
              margin: "0 20px",
            }}
          >
            <StatCard name={"Inks"} value={totalData.inks} emoji={"🖼️"} />
            <StatCard name={"Tokens"} value={totalData.tokens} emoji={"🪙"} />
            <StatCard name={"Sale Value"} value={Number(totalData.saleValue)?.toFixed(2)} emoji={"💲"} />
            <StatCard name={"Upgrades"} value={totalData.upgrades} emoji={"👍"} />
            <StatCard name={"Artists"} value={totalData.artists} emoji={"🧑‍🎨"} />
            <StatCard name={"Users"} value={totalData.users} emoji={"😎"} />
            <StatCard name={"Sales"} value={totalData.sales} emoji={"💲"} />
          </ul>
        </Row>
      </div>
    </>
  );
};

export default TotalStats;
