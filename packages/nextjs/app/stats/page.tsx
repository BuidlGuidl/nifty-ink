"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HistoryStats from "../_components/stats/HistoryStats";
import TotalStats from "../_components/stats/TotalStats";
import { useQuery } from "@apollo/client";
import { LAST_30_DAILY_TOTALS, TOTALS, TOTALS_UP_TO_DATE } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { calculateStartingDate, createQueryString } from "~~/utils/helpers";

const Stats = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [metric, setMetric] = useState<string>(searchParams.get("metric") || "tokens");
  const [period, setPeriod] = useState<string>(searchParams.get("period") || "month");
  const [startingDate, setStartingDate] = useState<number>(
    calculateStartingDate(searchParams.get("period") || "month"),
  );

  const {
    loading: isLoadingLastMonthData,
    error: errorLastMonthData,
    data: lastMonthData,
  } = useQuery(LAST_30_DAILY_TOTALS, {
    variables: {
      date: calculateStartingDate("month"),
    },
  });

  const {
    loading: isLoadingTotalDataBefore,
    error: errorTotalDataBefore,
    data: totalDataBefore,
  } = useQuery(TOTALS_UP_TO_DATE, {
    variables: {
      date: startingDate,
    },
  });

  const { loading: isLoadingTotalDataNow, error: errorTotalDataNow, data: totalDataNow } = useQuery(TOTALS);

  const createQueryStringCallback = useCallback(
    (name: string, value: string) => createQueryString(name, value, searchParams),
    [searchParams],
  );

  const handleChange = (varName: string, newVal: string) => {
    if (varName === "period") {
      setPeriod(newVal);
      setStartingDate(calculateStartingDate(newVal));
      router.push(pathname + "?" + createQueryStringCallback("period", newVal));
    } else if (varName === "metric") {
      setMetric(newVal);
      router.push(pathname + "?" + createQueryStringCallback("metric", newVal));
    }
  };

  if (isLoadingTotalDataBefore || isLoadingTotalDataNow) return <Loader />;
  if (errorTotalDataNow) return `Error! ${errorTotalDataNow.message}`;
  if (errorTotalDataBefore) return `Error! ${errorTotalDataBefore.message}`;

  return (
    <div className="max-w-screen-xl">
      {lastMonthData && lastMonthData?.dailyTotals && (
        <HistoryStats lastMonthData={lastMonthData?.dailyTotals} metric={metric} handleChangeMetric={handleChange} />
      )}
      <TotalStats
        totalDataNow={totalDataNow?.totals?.[0]}
        totalDataBefore={totalDataBefore?.totals?.[0]}
        period={period}
        handleChangePeriod={handleChange}
      />
    </div>
  );
};

export default Stats;
