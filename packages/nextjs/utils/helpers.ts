import dayjs from "dayjs";

export const calculateStartingDate = (period: string) => {
  const startOfDay = dayjs().startOf("day");
  switch (period) {
    case "year":
      return startOfDay.subtract(1, "year").unix();
    case "sixmonth":
      return startOfDay.subtract(6, "month").unix();
    case "threemonth":
      return startOfDay.subtract(3, "month").unix();
    case "month":
      return startOfDay.subtract(1, "month").unix();
    case "week":
      return startOfDay.subtract(1, "week").unix();
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

export const getMetadataWithTimeout = async (jsonURL: string, timeout = 2000): Promise<InkMetadata> => {
  const fetchPromise = (async () => {
    const response = await fetch(`https://gateway.nifty.ink:42069/ipfs/${jsonURL}`);
    const data: InkMetadata = await response.json();
    data.image = data.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/");
    return data;
  })();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeout),
  );

  return Promise.race([fetchPromise, timeoutPromise]);
};

export const isGnosisChain = (chainId: number): boolean => {
  return chainId === 100;
};
