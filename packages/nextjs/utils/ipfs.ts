import all from "it-all";
import { create } from "kubo-rpc-client";
import * as uint8arrays from "uint8arrays";

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
