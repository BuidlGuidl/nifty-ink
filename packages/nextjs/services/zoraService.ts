import { getCoin } from "@zoralabs/coins-sdk";
import LZ from "lz-string";
import { base } from "viem/chains";
import { Metadata } from "~~/types/zora";
import { getFetchableUrl } from "~~/utils/ipfs";

export const fetchCoinData = async (coinAddress: string) => {
  const coinResponse = await getCoin({
    address: coinAddress,
    chain: base.id,
  });

  if (!coinResponse?.data?.zora20Token) {
    throw new Error("No Zora token data found");
  }

  return coinResponse.data.zora20Token;
};

export const fetchMetadata = async (tokenUri: string): Promise<Metadata> => {
  let inkId = tokenUri.split("/ipfs/").pop();
  inkId = inkId?.split("ipfs://").pop();
  if (!inkId) {
    throw new Error("Invalid token URI format");
  }

  const url = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${inkId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }

  return response.json();
};

export const fetchDrawingContent = async (link: string): Promise<string> => {
  const inkCID = link.split("/ink/").pop();
  if (!inkCID) {
    throw new Error("Invalid ink URI format");
  }

  let inkUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${inkCID}`;
  // Special case handling should be moved to a config file
  if (inkCID === "bafybeiaxw4zkw57lsc7iueyxpzwalb2rxdr5dx4vervynjhwgxagbbdeli") {
    inkUrl = "https://bafkreifhnbmjsb4c4cobi2bk4x2vikityhqcwzv6nprs3sd3i2qk5xlqne.ipfs.community.bgipfs.com/";
  }
  let response = await fetch(inkUrl);

  if (!response.ok) {
    const niftyInkUrl = getFetchableUrl(inkCID);
    response = await fetch(niftyInkUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch drawing content: ${response.statusText}`);
    }
  }

  const drawingContent = await response.arrayBuffer();
  const decompressed = LZ.decompressFromUint8Array(new Uint8Array(drawingContent));

  if (!decompressed) {
    throw new Error("Failed to decompress drawing data");
  }

  return decompressed;
};
