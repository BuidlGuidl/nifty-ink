import dayjs from "dayjs";

export const calculateStartingDate = (period: string) => {
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

export const createQueryString = (name: string, value: string, searchParams: URLSearchParams) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set(name, value);

  return params.toString();
};
