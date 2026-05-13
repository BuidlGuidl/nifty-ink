import { NextRequest, NextResponse } from "next/server";

/**
 * Subgraph `jsonUrl` is always a raw IPFS CID: CIDv0 (`Qm` + base58) or CIDv1 (`baf…` + base32).
 * Reject anything else to avoid open redirects / SSRF.
 */
function isLikelyContentAddressedCid(cid: string): boolean {
  const c = cid.trim();
  if (c.length > 256) return false;

  // CIDv0: exactly `Qm` + 44 base58 characters (no 0, O, I, l).
  if (c.startsWith("Qm")) {
    return c.length === 46 && /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(c);
  }

  // CIDv1 (base32 multibase): `bafy…`, `bafkrei…`, etc. — lowercase a–z and 2–7 only.
  if (c.startsWith("baf")) {
    return c.length >= 52 && c.length <= 120 && c === c.toLowerCase() && /^baf[a-z2-7]+$/.test(c);
  }

  return false;
}

function rewriteImageGateway(image: string, gatewayBase: string): string {
  return image.replace("https://ipfs.io/ipfs/", `${gatewayBase}/ipfs/`);
}

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  if (!cid || !isLikelyContentAddressedCid(cid)) {
    return NextResponse.json({ error: "Invalid cid" }, { status: 400 });
  }

  const gatewayBase = process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT;
  if (!gatewayBase) {
    return NextResponse.json({ error: "Missing gateway configuration" }, { status: 500 });
  }

  try {
    const upstream = await fetch(`${gatewayBase}/ipfs/${cid}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 365 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream IPFS error" }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const data = (await upstream.json()) as { image?: string };
    if (typeof data.image === "string") {
      data.image = rewriteImageGateway(data.image, gatewayBase);
    }

    return NextResponse.json(data, {
      headers: {
        // CID content is immutable; browsers and CDNs can cache aggressively.
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load metadata" }, { status: 502 });
  }
}
