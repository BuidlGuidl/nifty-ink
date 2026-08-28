# Nifty Ink contracts (archival)

Source for the Nifty Ink smart contracts deployed on Gnosis Chain (formerly xDai) and Ethereum mainnet.

**This package is not buildable.** The contracts were originally deployed with Buidler (Hardhat's predecessor) in 2020 and the toolchain has been removed. The files are kept here as the reference source for the on-chain code; the ABIs the app uses live in `packages/nextjs/contracts/externalContracts.ts`, and the subgraph ABIs in `packages/niftygraph/abis`.

- `contracts/` – the deployed sidechain/mainnet contracts, plus `Faucet.sol` (the Gnosis gas faucet used by the app's create flow).
- `v1-contracts/` – originals of contracts that were later changed (primarily to emit an event on setting the price of an ink or token). The on-chain code is the v1 version; the subgraph uses call handlers to work around the missing events.
- `scripts/` – the original Buidler deploy/publish scripts, kept for reference.

### Architecture

- NiftyRegistry - keeps track of all the other Contracts
- NiftyInk - creation of artworks
- NiftyToken - NFT Contract
- NiftyMediator - Passing Tokens across the Tokenbridge
- NiftyMain - MainChain NFT Contract (can only mint on the basis of Tokenbridge messages)
- Liker - generic "Likes" contract
- SimplePaymaster - GSN paymaster (no longer used by the app)

Imported contracts:

- AMBMediator - generic AMB functionality
- SignatureChecker - verifying signatures (IERC1271 compatibility)

### Deployed addresses

Gnosis Chain (100):

| Contract | Address |
| --- | --- |
| NiftyInk | `0x49dE55fbA08af88f55EB797a456fdf76B151c8b0` |
| NiftyToken | `0xCF964c89f509a8c0Ac36391c5460dF94B91daba5` |
| Liker | `0xBD0621dcb64e1EEd503f709422b019B2fA197aF6` |
| NiftyMediator | `0x73cA9C4e72fF109259cf7374F038faf950949C51` |

Ethereum mainnet (1):

| Contract | Address |
| --- | --- |
| NiftyMain | `0xc02697c417DdAcfbe5EdbF23eDad956BC883F4fb` |
