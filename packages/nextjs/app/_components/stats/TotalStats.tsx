"use client";

import { useEffect, useState } from "react";
import StatCard from "../StatCard";
import { useQuery } from "@apollo/client";
import { Form, Row, Select } from "antd";
import { formatEther } from "viem";
import { TOTALS, TOTALS_UP_TO_DATE } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { useSearchParamsHandler } from "~~/hooks/useSearchParamsHandler";
import { calculateStartingDate } from "~~/utils/helpers";

const { Option } = Select;

type TotalData = Omit<HistoryData, "day">;

const TotalStats = () => {
  const [totalData, setTotalData] = useState<TotalData | null>(null);
  const { paramValue: period, updateSearchParam: updatePeriod } = useSearchParamsHandler("period", "month");

  const { data: totalDataNow } = useQuery(TOTALS);
  const { data: totalDataBefore, refetch } = useQuery(TOTALS_UP_TO_DATE, {
    variables: {
      date: calculateStartingDate(period),
    },
  });

  useEffect(() => {
    if (totalDataBefore && totalDataNow) {
      const prevData = totalDataBefore.totals?.[0];
      const curData = totalDataNow.totals?.[0];
      setTotalData({
        tokens: curData?.tokens - (prevData?.tokens || 0),
        inks: curData?.inks - (prevData?.inks || 0),
        saleValue:
          Number(formatEther(BigInt(curData?.saleValue))) - Number(formatEther(BigInt(prevData?.saleValue || 0n))),
        sales: curData.sales - (prevData?.sales || 0),
        upgrades: curData.upgrades - (prevData?.upgrades || 0),
        users: curData.users - (prevData?.users || 0),
        artists: curData.artists - (prevData?.artists || 0),
      });
    }
  }, [totalDataBefore, totalDataNow]);

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-xl">
        <div className="flex flex-col items-center justify-center mt-5">
          <h1 className="text-2xl">Total statistics</h1>
          <Form initialValues={{ period: period }}>
            <Form.Item name="period" className="m-0">
              <Select
                value={period}
                size="large"
                onChange={val => {
                  updatePeriod(val);
                  refetch();
                }}
              >
                <Option value="week">Week</Option>
                <Option value="month">Month</Option>
                <Option value="year">Year</Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
        <div>
          {!totalData ? (
            <Loader />
          ) : (
            <Row gutter={16}>
              <ul className="flex flex-wrap justify-center p-0 mx-5">
                <StatCard name={"Inks"} value={totalData.inks} emoji={"🖼️"} />
                <StatCard name={"Tokens"} value={totalData.tokens} emoji={"🪙"} />
                <StatCard name={"Sale Value"} value={Number(totalData.saleValue)?.toFixed(2)} emoji={"💲"} />
                <StatCard name={"Upgrades"} value={totalData.upgrades} emoji={"👍"} />
                <StatCard name={"Artists"} value={totalData.artists} emoji={"🧑‍🎨"} />
                <StatCard name={"Users"} value={totalData.users} emoji={"😎"} />
                <StatCard name={"Sales"} value={totalData.sales} emoji={"💲"} />
              </ul>
            </Row>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalStats;
