import { getMetadata } from "~~/utils/helpers";

async function fetchInkJsonUrlFromSubgraph(inkId: string): Promise<string | null> {
  const uri = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (!uri) return null;

  const res = await fetch(uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_AUTH || "",
    },
    body: JSON.stringify({
      query: `query InkJsonUrl($id: String!) { ink(id: $id) { jsonUrl } }`,
      variables: { id: inkId },
    }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { ink?: { jsonUrl?: string } | null } };
  const jsonUrl = body.data?.ink?.jsonUrl;
  return typeof jsonUrl === "string" && jsonUrl.length > 0 ? jsonUrl : null;
}

/**
 * Subgraph ink `id` (URL segment) → `jsonUrl` → metadata JSON (same shape as `getMetadata`).
 * Used by `/api/ink/metadata-by-id` (HTTP cache) and ink `generateMetadata`.
 */
export async function loadInkMetadataByInkId(inkId: string): Promise<InkMetadata | null> {
  const jsonUrl = await fetchInkJsonUrlFromSubgraph(inkId);
  if (!jsonUrl) return null;
  try {
    return await getMetadata(jsonUrl);
  } catch {
    return null;
  }
}
