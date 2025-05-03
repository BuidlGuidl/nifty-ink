import { createUploader } from "ipfs-uploader";
import all from "it-all";
import { create } from "kubo-rpc-client";
import * as uint8arrays from "uint8arrays";

export function createIPFSUploader() {
  if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
    throw new Error("NEXT_PUBLIC_PINATA_JWT environment variable is not set");
  }

  if (!process.env.NEXT_PUBLIC_BGIPFS_API_KEY) {
    throw new Error("NEXT_PUBLIC_BGIPFS_API_KEY environment variable is not set");
  }

  const multiUploader = createUploader([
    {
      jwt: process.env.NEXT_PUBLIC_PINATA_JWT,
      gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
    },
    {
      id: "nifty-ipfs",
      options: {
        url: "https://ipfs.nifty.ink:3001",
      },
    },
    {
      url: "https://upload.bgipfs.com",
      headers: {
        "X-API-Key": process.env.NEXT_PUBLIC_BGIPFS_API_KEY,
      },
    },
  ]);

  return multiUploader;
}

export async function uploadToIPFS(fileToUpload: any, type: "file" | "json" | "buffer") {
  try {
    const multiUploader = createIPFSUploader();
    if (type === "json") {
      return await multiUploader.add.json(fileToUpload);
    } else if (type === "buffer") {
      return await multiUploader.add.buffer(fileToUpload);
    } else {
      return await multiUploader.add.file(fileToUpload);
    }
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

const ipfsConfig = {
  host: "ipfs.nifty.ink",
  port: 3001,
  protocol: "https",
  timeout: 250000,
};

export async function getFromIPFS(hashToGet: string, timeout: number) {
  const ipfs = create({ ...ipfsConfig, timeout });
  const data = uint8arrays.concat(await all(ipfs.cat(hashToGet)));
  return data;
}

export async function addToIPFS(fileToUpload: any) {
  const ipfs = create(ipfsConfig);
  const result = await ipfs.add(fileToUpload);
  return result;
}

export function getFetchableUrl(uri: string): string {
  if (uri.startsWith("http://")) return "";
  if (uri.startsWith("https://niftyink.bgipfs.com")) {
    const ipfsHash = uri.split("ipfs/").pop();
    const gatewayUrl = `https://${ipfsHash}.ipfs.niftyink.bgipfs.com`;
    return gatewayUrl;
  }
  if (uri.startsWith("https://")) return uri;

  const ipfsHash = uri.split("ipfs://").pop();
  const gatewayUrl = `https://gateway.nifty.ink:42069/ipfs/${ipfsHash}`;
  return gatewayUrl;
}
