/** @experimental Unstable prototype API. Not audited or intended for production use. */
import { MemoryBlockstore } from "blockstore-core";
import { importer } from "ipfs-unixfs-importer";

// Explicit import options make directory identity reproducible across the demo and fixtures.
export const importOptions = {
  cidVersion: 1,
  rawLeaves: true,
  wrapWithDirectory: true,
};

/** @param {Record<string, Uint8Array>} files Exact named file bytes. */
export async function directoryFor(files) {
  let root;
  const blockstore = new MemoryBlockstore();
  const source = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => ({ path, content: new Uint8Array(content) }));
  for await (const entry of importer(source, blockstore, importOptions))
    root = entry;
  if (!root || root.cid.code !== 0x70 || root.cid.multihash.code !== 0x12) {
    throw new Error("Expected dag-pb/sha2-256 directory root");
  }
  const chunks = [];
  for await (const chunk of blockstore.get(root.cid))
    chunks.push(Buffer.from(chunk));
  return {
    cid: root.cid.toString(),
    digest: `0x${Buffer.from(root.cid.multihash.digest).toString("hex")}`,
    rootBlock: Buffer.concat(chunks),
  };
}
