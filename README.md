# 🎨 Nifty Ink

NFT artwork created and sold on Gnosis Chain, with a one-way bridge to Ethereum mainnet.

https://nifty.ink

## Repo layout

| Package | What it is |
| --- | --- |
| [`packages/nextjs`](packages/nextjs) | The nifty.ink app (Next.js 14, scaffold-eth 2 based). Deployed on Vercel. |
| [`packages/nifty-view`](packages/nifty-view) | Standalone canvas replayer – renders an ink's drawing from its IPFS CID. Deployed separately on Vercel. |
| [`packages/niftygraph`](packages/niftygraph) | The subgraphs (Gnosis + mainnet) that the app reads from. |
| [`packages/contracts`](packages/contracts) | Archival source of the deployed smart contracts. Not buildable – see its README. |

## Running the app

Requires Node 24 and Yarn 3 (bundled via `.yarn/releases`).

```
git clone https://github.com/BuidlGuidl/nifty-ink.git
cd nifty-ink
yarn install
```

Create `packages/nextjs/.env` with:

```
# Subgraphs
NEXT_PUBLIC_GRAPHQL_ENDPOINT=            # Gnosis subgraph endpoint
NEXT_PUBLIC_GRAPHQL_ENDPOINT_AUTH=       # optional Authorization header for the above
NEXT_PUBLIC_GRAPHQL_ENDPOINT_MAINNET=    # mainnet subgraph endpoint

# RPC / wallets
NEXT_PUBLIC_ALCHEMY_API_KEY=
NEXT_PUBLIC_ALCHEMY_API=                 # full Gnosis RPC URL, used by the faucet
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

# IPFS
NEXT_PUBLIC_BGIPFS_ENDPOINT=
NEXT_PUBLIC_BGIPFS_API_KEY=
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY=

# Gas faucet for new users (server-side only)
FAUCET_ACCOUNT_PRIVATE_KEY=
FAUCET_ACCOUNT_ADDRESS=
NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS=
GNOSIS_FAUCET_AMOUNT=0.003

# Postgres (Neon) – used to record faucet funding
DATABASE_URL=
```

Then:

```
yarn start            # nifty.ink app on http://localhost:3000
yarn start-nifty-view # canvas viewer (needs NEXT_PUBLIC_IPFS_LINK in packages/nifty-view/.env)
```

Checks: `yarn next:lint`, `yarn next:check-types`, `yarn next:build`. A pre-commit hook runs lint + type-check on staged `packages/nextjs` files.

## Subgraphs

Nifty Ink's subgraphs live in `packages/niftygraph` (not part of the Yarn workspace – it has its own `yarn.lock`). There are three configurations, all generated from `template.subgraph.yaml` via a `prepare-*` step:

- **xdai** (`config/xdai.json`): indexes the deployed contracts on Gnosis Chain. Uses call handlers for price changes because the original contracts don't emit those events.
- **mainnet** (`config/mainnet.json`): indexes the mainnet NiftyMain token contract.
- **local** (`config/local.json`): for a local graph-node against a local deployment; relies purely on event handlers.

```
cd packages/niftygraph
yarn prepare-xdai   # or prepare-mainnet / prepare-local
yarn codegen
yarn build
```

The subgraphs are hosted on [Goldsky](https://goldsky.com). To deploy, install the Goldsky CLI (`npm i -g @goldskycom/cli`), `goldsky login`, then after `yarn build`:

```
yarn deploy-xdai      # goldsky subgraph deploy nifty-ink/<version> --path .
yarn deploy-mainnet   # goldsky subgraph deploy nifty-ink-main/<version> --path .
```

Bump the version in `package.json` for each new deployment. The app reads from the resulting endpoints via the `NEXT_PUBLIC_GRAPHQL_ENDPOINT*` env vars.

If you update the contracts' ABIs, update `packages/niftygraph/abis` and `packages/nextjs/contracts/externalContracts.ts`.

## Contracts

See [`packages/contracts`](packages/contracts) for the architecture and deployed addresses.

### Actions

| Action          | Description                                                                            | Signature supported? | Payable? |
| --------------- | -------------------------------------------------------------------------------------- | -------------------- | -------- |
| Create          | Creates an ink & mints the first token copy to the artist                              | y                    | n        |
| Mint            | Creates a copy to the specified address                                                | y                    | n        |
| Set ink price   | Set the price for non-artists to buy tokens                                            | y                    | n        |
| Set token price | Set the price for an individual token                                                  | n                    | n        |
| Buy Ink         | Buy a new token copy at the artist-specified price                                     | n                    | y        |
| Buy Token       | Buy a specific token at the token-owner specified price                                | n                    | y        |
| Send            | Send an individual token to an address                                                 | n                    | n        |
| Upgrade         | Transfer an individual token from Gnosis to mainnet, paying the relayPrice if applicable | y                  | y        |
| Like            | "Like" an individual ink                                                               | y                    | n        |

### The upgrade path

nifty.ink lets users upgrade their Gnosis ink NFTs to Ethereum mainnet. This is a one-way door! Once you upgrade you cannot bring your inks back. The Gnosis token is locked in the Mediator contract, and a matching token is minted on mainnet on the basis of the tokenbridge relay. The upgrade fee covers the cost of minting on mainnet and is controlled by a [price oracle bot](https://gnosisscan.io/address/0xa2197a282967dAc145e85D15e7960Aa30b86b771).

Housekeeping: keep the mainnet bridge ETH topped up at [0x87533bfd390c6d11afd8df1a8c095657e0eeed0d](https://etherscan.io/address/0x87533bfd390c6d11afd8df1a8c095657e0eeed0d).

## Sources

- [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2)
- [React Canvas Draw](https://github.com/embiem/react-canvas-draw) for the drawing
- [IPFS](https://ipfs.io/) for storing the drawing and meta-information
- [Gnosis Chain](https://www.gnosis.io/) for the sidechain
- [Tokenbridge](https://tokenbridge.net) for the bridge to mainnet
- [The Graph](https://thegraph.com) / [Goldsky](https://goldsky.com) for the subgraphs
- [antd](https://ant.design/) for the design library
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts) for the boilerplate contracts

_We welcome and are eternally grateful for features and pull requests!_
