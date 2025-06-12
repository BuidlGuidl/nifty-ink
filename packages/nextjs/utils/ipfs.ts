import { createUploader } from "ipfs-uploader";

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

export async function getFromIPFS(hashToGet: string, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`https://niftyink.bgipfs.com/ipfs/${hashToGet}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getFetchableUrl(uri: string): string {
  if (uri.startsWith("http://")) return "";
  if (uri.startsWith("https://niftyink.bgipfs.com")) {
    const ipfsHash = uri.split("ipfs/").pop();
    const gatewayUrl = `https://niftyink.bgipfs.com/ipfs/${ipfsHash}`;
    return gatewayUrl;
  }
  if (uri.startsWith("https://")) return uri;

  const ipfsHash = uri.split("ipfs://").pop();
  const gatewayUrl = `https://niftyink.bgipfs.com/ipfs/${ipfsHash}`;
  return gatewayUrl;
}
