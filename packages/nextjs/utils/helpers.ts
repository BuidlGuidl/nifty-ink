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

export const getMetadata = async (jsonURL: string): Promise<InkMetadata> => {
  const response = await fetch(`https://gateway.nifty.ink:42069/ipfs/${jsonURL}`);
  const data: InkMetadata = await response.json();
  data.image = data.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/");
  return data;
};
