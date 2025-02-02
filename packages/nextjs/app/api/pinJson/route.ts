import { NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const json = JSON.parse(bodyText);
    const url = new URL(req.url);
    const filename = url.searchParams.get("filename") || "metadata.json";

    const data = JSON.stringify({
      pinataContent: json,
      pinataMetadata: {
        name: filename,
      },
    });

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error("Failed to pin JSON to IPFS");
    }

    const result = (await response.json()) as { IpfsHash: string };
    return NextResponse.json({ IpfsHash: result.IpfsHash });
  } catch (error) {
    console.error("Error pinning file:", error);
    return NextResponse.json({ error: (error as Error)?.message || "Internal Server Error" }, { status: 500 });
  }
}
