import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Parse the form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Prepare the data to send to Pinata
    const data = new FormData();
    data.append("file", file);

    // Send the request to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to pin file: ${errorText}`);
    }

    const result = (await response.json()) as { IpfsHash: string };

    // Return the IPFS hash
    // return NextResponse.json({ IpfsHash: "TEST" });
    return NextResponse.json({ IpfsHash: result.IpfsHash });
  } catch (error: any) {
    console.error("Error pinning file:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
