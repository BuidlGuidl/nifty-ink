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

function rewriteInkMetadataImage(data: InkMetadata): InkMetadata {
  const base = process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT;
  if (base && typeof data.image === "string") {
    data.image = data.image.replace("https://ipfs.io/ipfs/", `${base}/ipfs/`);
  }
  return data;
}

async function fetchInkMetadataFromIpfs(jsonURL: string, signal?: AbortSignal): Promise<InkMetadata> {
  const base = process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT;
  if (!base) throw new Error("Missing NEXT_PUBLIC_BGIPFS_ENDPOINT");
  const response = await fetch(`${base}/ipfs/${jsonURL}`, { signal });
  if (!response.ok) throw new Error(`IPFS metadata ${response.status}`);
  const data: InkMetadata = await response.json();
  return rewriteInkMetadataImage(data);
}

/** Same JSON as IPFS, but served from our app with HTTP + Next fetch caching (browser hits /api, not the gateway each time). */
async function fetchInkMetadataFromAppRoute(jsonURL: string, signal?: AbortSignal): Promise<InkMetadata> {
  const response = await fetch(`/api/ink-metadata?cid=${encodeURIComponent(jsonURL)}`, { signal });
  if (!response.ok) throw new Error(`Ink metadata API ${response.status}`);
  const data: InkMetadata = await response.json();
  return rewriteInkMetadataImage(data);
}

export const getMetadata = async (jsonURL: string): Promise<InkMetadata> => {
  const data =
    typeof window !== "undefined"
      ? await fetchInkMetadataFromAppRoute(jsonURL)
      : await fetchInkMetadataFromIpfs(jsonURL);
  return data;
};

export const getMetadataWithTimeout = async (jsonURL: string, timeout = 2000): Promise<InkMetadata> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const data =
      typeof window !== "undefined"
        ? await fetchInkMetadataFromAppRoute(jsonURL, controller.signal)
        : await fetchInkMetadataFromIpfs(jsonURL, controller.signal);
    return data;
  } finally {
    clearTimeout(timer);
  }
};

export const isGnosisChain = (chainId: number): boolean => {
  return chainId === 100;
};
