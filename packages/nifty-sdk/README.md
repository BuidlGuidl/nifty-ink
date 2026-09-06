# nifty-sdk

> **Experimental — not production-ready.** APIs, types, and artifact formats may change without backward compatibility. This package is for prototyping and evaluation, has not undergone a security audit, and should not be used with real funds or relied on for permanent artwork storage. It is a private workspace package, not a supported published SDK.

Shared primitives for Nifty Ink's v2 prototype. This is a private workspace package while its API settles; it is not published. The drawing app uses its shared surface and exports. Chain and storage helpers target the v2 prototype contract interfaces.

| Import | Primitives | Environment |
| --- | --- | --- |
| `nifty-sdk` / `nifty-sdk/chain` | `loadArtworks`, `writeContract`, `buyCopies`, contract/artwork types | Node or browser; caller supplies viem clients and contracts |
| `nifty-sdk/drawing` | `toSvg`, `toAnimatedSvg`, `svgToPng`, stroke/board types | SVG exports work in Node or browser; PNG requires browser DOM |
| `nifty-sdk/react` | `DrawSurface`, `useDrawing`, surface/tool types | React |
| `nifty-sdk/artifacts` | `directoryFor`, `importOptions` | Node; exact UnixFS identity from file bytes |
| `nifty-sdk/uploads` | `uploadArtifact`, `uploadDirectory`, `createBgipfsProvider`, `fetchArtifactData`, `artifactReference` | Node or browser; persistent provider keys stay on the server |

Build from the repo root with `yarn sdk:build`. Run focused tests with `yarn sdk:test`. App build/dev scripts build the SDK first; rebuild it after editing SDK source during an existing dev session. The package emits ESM and TypeScript declarations into `dist/`.

## Drawing

```tsx
import { DrawSurface, useDrawing } from 'nifty-sdk/react';
import { toSvg, toAnimatedSvg, svgToPng } from 'nifty-sdk/drawing';

// Inside a component:
const drawing = useDrawing();
const board = { w: 800, h: 800 };
const svg = toSvg(drawing.strokes, board.w, board.h, '#ffffff');
const replay = toAnimatedSvg(drawing.strokes, board.w, board.h, '#ffffff');
// await svgToPng(svg, board.w, board.h) in a browser event handler.
```

The surface includes the existing pointer-cancel behavior from the prototype. Toolbar, colors, samples, wallet selector, and transaction UI belong to the app.

## Server-side directory upload

```ts
import { directoryFor } from 'nifty-sdk/artifacts';
import { createBgipfsProvider, uploadDirectory } from 'nifty-sdk/uploads';

// Exact saved bytes; serialization and filenames affect identity.
const files = { 'data.json': dataBytes, 'image.png': pngBytes, 'animation.svg': svgBytes };
const expected = await directoryFor(files);
const result = await uploadDirectory(
  Object.entries(files).map(([path, content]) => ({ path, content })),
  expected.cid,
  [createBgipfsProvider({
    id: 'bgipfs', url: 'https://upload.bgipfs.com', apiKey: process.env.BGIPFS_API_KEY!,
  })],
);
// Inspect result.success and result.results before continuing.
```

Provider IDs must be unique. Each successful response must match the expected CID. A failing or mismatched destination does not discard other results. `UploadProvider` permits additional adapters without changing the artifact format. Upload completion does not establish durable pin status. Pinata replication, pin polling, durable retry queues, and quorum policy remain future work. Applications choose when to enable public uploads; this package does not upload automatically.

`fetchArtifactData(cid, ['https://community.bgipfs.com/ipfs/'])` fetches JSON with per-gateway timeout and fallback. It returns `unknown`; consumers validate their chosen schema. Gateway JSON is not independently block-verified by this helper.

## Reads and buying

```ts
import { loadArtworks, buyCopies } from 'nifty-sdk/chain';

const artworks = await loadArtworks(publicClient, contracts, account, deploymentBlock);
const receipt = await buyCopies(publicClient, walletClient, contracts.controller, {
  account, recipient: account, id, quantity: 2n, unitPrice: approvedPrice,
  deadline: latestBlock.timestamp + 300n,
});
```

Clients must target the same chain/deployment. Transactions simulate before wallet submission and reject reverted receipts. `buyCopies` uses the explicitly approved price as its maximum price and computes payment; it does not silently refresh price or retry a signature. The generic `writeContract` supports existing create, gift, sale, payout, and withdrawal operations; dedicated typed helpers can follow.

Reads currently scan InkRegistered logs from the supplied start block (default zero), then read contract state. This suits the prototype; production histories need bounded log ranges/indexing and pagination. Metadata decoding targets the current v2 renderer. No local RPC URL, test persona, provider credential, or deployment address is embedded in the SDK.
