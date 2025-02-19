import { createUploader } from "ipfs-uploader";
import all from "it-all";
import { create } from "kubo-rpc-client";
import * as uint8arrays from "uint8arrays";

export function createIPFSUploader() {
  const multiUploader = createUploader([
    {
      jwt: process.env.NEXT_PUBLIC_PINATA_JWT || "",
      gateway: "http://azure-qualified-blackbird-912.mypinata.cloud",
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
        "X-API-Key": process.env.NEXT_PUBLIC_BGIPFS_API_KEY || "",
      },
    },
  ]);

  return multiUploader;
}

export async function uploadToIPFS(fileToUpload: any, type: "file" | "json" | "buffer") {
  const multiUploader = createIPFSUploader();
  if (type === "json") {
    return multiUploader.add.json(fileToUpload);
  } else if (type === "buffer") {
    return multiUploader.add.buffer(fileToUpload);
  } else {
    return multiUploader.add.file(fileToUpload);
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
