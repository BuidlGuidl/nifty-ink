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
  ]);

  return multiUploader;
}

export async function uploadFileToIPFS(fileToUpload: any) {
  const multiUploader = createIPFSUploader();
  const fileResult = multiUploader.add.file(fileToUpload);
  console.log("fileResult", fileResult);
  return fileResult;
}

export async function uploadJsonToIPFS(fileToUpload: any) {
  const multiUploader = createIPFSUploader();
  const fileResult = multiUploader.add.json(fileToUpload);
  console.log("fileResult", fileResult);
  return fileResult;
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
