import { Suspense } from "react";
import { query } from "../../apollo/ApolloClient";
import HistoryStats from "../_components/stats/HistoryStats";
import TotalStats from "../_components/stats/TotalStats";
import { LAST_30_DAILY_TOTALS } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { calculateStartingDate } from "~~/utils/helpers";

const Stats = async () => {
  const { data: lastMonthData } = await query({
    query: LAST_30_DAILY_TOTALS,
    variables: {
      date: calculateStartingDate("month"),
    },
  });

  return (
    <div className="flex justify-center">
      <div className="max-w-screen-xl">
        <Suspense fallback={<Loader />}>
          {lastMonthData && lastMonthData?.dailyTotals && <HistoryStats lastMonthData={lastMonthData?.dailyTotals} />}
          <TotalStats />
        </Suspense>
      </div>
    </div>
  );
};

export default Stats;
