import { NextRequest, NextResponse } from "next/server";
import { loadInkMetadataByInkId } from "~~/utils/loadInkMetadataByInkId";

function isPlausibleInkId(id: string): boolean {
  const s = id.trim();
  if (s.length < 8 || s.length > 256) return false;
  if (s.includes("..") || s.includes("/") || s.includes("\\")) return false;
  return /^[A-Za-z0-9]+$/.test(s);
}

/**
 * One hop for clients: drawing ink id → full metadata JSON (subgraph + IPFS JSON inside).
 * Cacheable by CDN/browser; same content as chaining subgraph + `/api/ink-metadata`.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !isPlausibleInkId(id)) {
    return NextResponse.json({ error: "Invalid or missing id" }, { status: 400 });
  }

  const meta = await loadInkMetadataByInkId(id);
  if (!meta) {
    return NextResponse.json({ error: "Ink not found or metadata unavailable" }, { status: 404 });
  }

  return NextResponse.json(meta, {
    headers: {
      "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
