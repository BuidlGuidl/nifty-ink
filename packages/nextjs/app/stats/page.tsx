"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TotalStats from "../_components/TotalStats";
import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { TOTALS, TOTALS_UP_TO_DATE } from "~~/apollo/queries";
import Loader from "~~/components/Loader";

const calculateStartingDate = (period: string) => {
  const startOfDay = dayjs().startOf("day");
  switch (period) {
    case "month":
      return startOfDay.subtract(28, "day").unix();
    case "week":
      return startOfDay.subtract(1, "week").unix();
    case "year":
      return startOfDay.subtract(1, "year").unix();
    default:
      return startOfDay.unix();
  }
};

const Stats = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dailyTotals, setDailyTotals] = useState(null);
  const [period, setPeriod] = useState<string>("month");
  const [startingDate, setStartingDate] = useState(dayjs().startOf("day").subtract(7, "day").unix());

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

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const handleChange = (varName: string, newVal: string) => {
    if (varName === "period") {
      setPeriod(newVal);
      setStartingDate(calculateStartingDate(newVal));
      router.push(pathname + "?" + createQueryString("period", newVal));
    }
  };

  if (isLoadingTotalDataBefore || isLoadingTotalDataNow) return <Loader />;
  if (errorTotalDataNow) return `Error! ${errorTotalDataNow.message}`;
  if (errorTotalDataBefore) return `Error! ${errorTotalDataBefore.message}`;

  return (
    <div className="max-w-xl">
      <TotalStats
        totalDataNow={totalDataNow?.totals?.[0]}
        totalDataBefore={totalDataBefore?.totals?.[0]}
        isLoadingTotalDataNow={isLoadingTotalDataNow}
        isLoadingTotalDataBefore={isLoadingTotalDataNow}
        period={period}
        handleChangePeriod={handleChange}
      />
    </div>
  );
};

export default Stats;
