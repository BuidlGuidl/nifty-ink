export async function getFromIPFS(hashToGet: string, timeout: number) {
  const url = `${process.env.NEXT_PUBLIC_IPFS_LINK}/ipfs/${hashToGet}`;
  const response = await fetch(url);
  console.log(timeout);

  if (!response.ok) {
    throw new Error(`Failed to fetch file from gateway: ${response.statusText}`);
  }
  const data = await response.arrayBuffer();
  const uint8Data = new Uint8Array(data);
  return uint8Data;
}
