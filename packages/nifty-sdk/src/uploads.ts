/** @experimental Unstable prototype API. Not audited or intended for production use. */
import { CID } from "multiformats/cid";

export type ArtifactReference = { cid: string; digest: `0x${string}` };
export type ArtifactUpload = { data: unknown; image: string; animation: string };
export type ArtifactFile = { path: string; content: Uint8Array };
export type UploadProvider = {
  id: string;
  upload: (files: readonly ArtifactFile[]) => Promise<{ cid: string }>;
};

/** An artwork ID is the SHA-256 digest of a UnixFS directory root. */
export function artifactReference(value: string): ArtifactReference {
  const cid = CID.parse(value).toV1();
  if (cid.code !== 0x70 || cid.multihash.code !== 0x12 || cid.multihash.digest.length !== 32)
    throw new Error("Expected a dag-pb/SHA-256 artifact directory CID");
  const digest = `0x${Array.from(cid.multihash.digest, b => b.toString(16).padStart(2, "0")).join("")}` as const;
  return { cid: cid.toString(), digest };
}

/** Save through an app-owned endpoint. Credentials and provider policy belong on its server. */
export async function uploadArtifact(endpoint: string, artifact: ArtifactUpload, signal?: AbortSignal): Promise<ArtifactReference> {
  const response = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artifact), signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Artifact upload failed (${response.status})`);
  const reference = artifactReference(result.cid);
  if (reference.digest !== result.digest) throw new Error("Artifact CID and digest disagree");
  return reference;
}

/** Configure on the server when using a persistent API key. */
export function createBgipfsProvider(options: { id: string; url: string; apiKey: string; timeout?: number }): UploadProvider {
  return {
    id: options.id,
    async upload(files) {
      const url = new URL("/api/v0/add", options.url);
      url.search = new URLSearchParams({ "cid-version": "1", "raw-leaves": "true", "wrap-with-directory": "true", pin: "true" }).toString();
      const body = new FormData();
      for (const file of files) body.append("file", new Blob([new Uint8Array(file.content)]), file.path);
      const response = await fetch(url, {
        method: "POST", headers: { "X-API-Key": options.apiKey }, body,
        signal: AbortSignal.timeout(options.timeout ?? 60_000),
      });
      if (!response.ok) throw new Error(`BGIPFS upload failed (${response.status})`);
      let cid: string | undefined;
      for (const line of (await response.text()).split("\n")) {
        if (!line.trim()) continue;
        const entry = JSON.parse(line);
        if (entry.Error || entry.Message) throw new Error(entry.Error || entry.Message);
        if (entry.Hash) cid = entry.Hash;
      }
      if (!cid) throw new Error("Directory upload returned no CID");
      return { cid };
    },
  };
}

/** Upload completion is not an independent confirmation of durable pin status. */
export async function uploadDirectory(files: readonly ArtifactFile[], expectedCid: string, providers: readonly UploadProvider[]) {
  const expected = artifactReference(expectedCid);
  if (!providers.length) throw new Error("At least one upload provider is required");
  if (providers.some(p => !p.id) || new Set(providers.map(p => p.id)).size !== providers.length)
    throw new Error("Upload provider IDs must be nonempty and unique");
  if (!files.length || new Set(files.map(f => f.path)).size !== files.length)
    throw new Error("Provide nonempty files with unique paths");
  for (const file of files) {
    if (!file.path || file.path.split("/").some(part => !part || part === "." || part === "..") || file.path.includes("\\"))
      throw new Error("Invalid artifact path");
  }
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const results = await Promise.all(providers.map(async provider => {
    try {
      const result = await provider.upload(sorted);
      if (!CID.parse(result.cid).toV1().equals(CID.parse(expected.cid))) throw new Error("Provider returned a different CID");
      return { id: provider.id, success: true as const, cid: expected.cid };
    } catch (error) {
      return { id: provider.id, success: false as const, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  return { ...expected, success: results.every(r => r.success), results };
}

/** Fetch data.json via gateway bases such as https://example.com/ipfs/. */
export async function fetchArtifactData(cid: string, gateways: readonly string[], options: { signal?: AbortSignal; timeout?: number } = {}): Promise<unknown> {
  const root = artifactReference(cid).cid;
  const errors: string[] = [];
  for (const gateway of gateways) {
    options.signal?.throwIfAborted();
    try {
      const timeout = AbortSignal.timeout(options.timeout ?? 15_000);
      const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
      const response = await fetch(`${gateway.replace(/\/$/, "")}/${root}/data.json`, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      options.signal?.throwIfAborted();
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(`Artifact retrieval failed: ${errors.join("; ") || "no gateways configured"}`);
}
