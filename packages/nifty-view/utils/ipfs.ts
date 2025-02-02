// const ipfsConfig = {
//   host: "azure-qualified-blackbird-912.mypinata.cloud/ipfs/",
//   port: 3001,
//   protocol: "https",
//   timeout: 250000,
// };
// https://azure-qualified-blackbird-912.mypinata.cloud/ipfs/QmSuBnLBcQVfqL3ykhzfAYvCn5Tg6r22StGpVuJQ2cc75p

export async function getFromIPFS(hashToGet: string, timeout: number) {
  const url = `https://azure-qualified-blackbird-912.mypinata.cloud/ipfs/${hashToGet}`;
  const response = await fetch(url);
  console.log(timeout);

  if (!response.ok) {
    throw new Error(`Failed to fetch file from gateway: ${response.statusText}`);
  }
  const data = await response.arrayBuffer();
  const uint8Data = new Uint8Array(data); // Convert to Uint8Array

  console.log(data);
  // const ipfs = create({ ...ipfsConfig, timeout });
  // console.log(ipfs.cat("QmSuBnLBcQVfqL3ykhzfAYvCn5Tg6r22StGpVuJQ2cc75p"))
  // const data = uint8arrays.concat(await all(ipfs.cat("QmSuBnLBcQVfqL3ykhzfAYvCn5Tg6r22StGpVuJQ2cc75p")));
  // fs.writeFileSync('here', Buffer.from(data));
  // console.log(`File saved to ${'here'}`);
  return uint8Data;
}
