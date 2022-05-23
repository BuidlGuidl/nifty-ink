# 🎨 Nifty Ink / a 🏗 scaffold-eth fork

NFT artwork created and sold on xDAI using meta transactions, burner wallets, and bridged to Ethereum.

```
git clone  https://github.com/BuidlGuidl/nifty-ink.git
```

Install dependencies:

```
cd nifty-ink
yarn install
```

### Running nifty.ink on xDai / Mainnet

_This will run the nifty.ink frontend on the production smart contracts on xDai / Mainnet._

Create a .env file with the following variables in `packages/react-app`

```
REACT_APP_NETWORK_NAME=xdai
REACT_APP_NETWORK_COLOR=#f6c343
REACT_APP_USE_GSN=true
REACT_APP_GRAPHQL_ENDPOINT=https://api.thegraph.com/subgraphs/name/azf20/nifty-ink
REACT_APP_GRAPHQL_ENDPOINT_MAINNET=https://api.thegraph.com/subgraphs/name/azf20/nifty-ink-main
REACT_APP_PAYMASTER_ADDRESS=0x9e59Ea5333cD4f402dAc320a04fafA023fe3810D
```

Get the react front-end up and running - http://localhost:3000

```
cd nifty-ink
yarn start
```

### Running nifty.ink locally

It is not currently possible to easily run cross-chain nifty.ink locally. Below are instructions for running the xDai portion of nifty.ink on a local chain ("sidechain") running on port=8456.

- The app will still look tokens on the mainchain, but it will refer to mainnet and bridge functionality will not be usable (there is a setup to test the bridge using Kovan <> Sokol)
- The instructions below do not use the GSN setup we have in the production app

Create a .env file with the following variables in `packages/react-app`

```
REACT_APP_NETWORK_COLOR=#f6c343
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:8000/subgraphs/name/azf20/nifty-ink
REACT_APP_GRAPHQL_ENDPOINT_MAINNET=https://api.thegraph.com/subgraphs/name/azf20/nifty-ink-main
```

_Terminal A:_ Get the react front-end up and running - http://localhost:3000

```
cd nifty-ink
yarn start
```

_Terminal B:_ Run the local chain

```
cd nifty-ink
yarn run sidechain
```

_Terminal C:_ Generate a deployment account

```
cd nifty-ink
yarn run generate
```

Take the address generated, and send it some funds using the faucet (at the bottom of the "Help" tab) in the react-app (this is necessary to deploy the contracts). If you lose this terminal, you can find the address (and the mnemonic!) in `/packages/buidler`
Then deploy the contracts:

```
yarn run sidechaindeploy
```

You will need the contract deployment addresses to update the subgraph configuration:
Update `packages/niftygraph/config/local.json` with the deployed addresses on the local chain (for NiftyInk, NiftyToken, Liker, NiftyMediator).

_Terminal D:_ Run a local graph node <- Requires docker

```
cd nifty-ink/docker/graph-node
docker-compose up
```

_Terminal E:_ Create and deploy the subgraph on your local graph node
NOTE: if you update the Nifty smart contracts, you will need to update the ABIs in `/packages/niftygraph/abis`

```
cd nifty-ink/packages/niftygraph
yarn prepare-local
yarn codegen
yarn build
yarn create-local
yarn deploy-local
```

Your local environment is up and running, get inking!

_We welcome and are eternally grateful for features and pull requests!_

---

### Contract architecture:

- NiftyRegistry - keeps track of all the other Contracts
- NiftyInk - creation of artworks
- NiftyToken - NFT Contract
- NiftyMediator - Passing Tokens across the Tokenbridge
- NiftyMain - MainChain NFT Contract (can only mint on the basis of Tokenbridge messages)
- Liker - generic "Likes" contract

Imported contracts:

- AMBMediator - generic AMB functionality
- SignatureChecker - verifying signatures (IERC1271 compatibility)

Note that some of the contracts in this repo are not the on-chain contracts, those which have been changed have their originals in /v1-contracts (the primary change is to emit an event on setting the price of an ink or a token)

### Subgraphs

Nifty Ink's subgraphs live in `packages/niftygraph`. There are three subgraphs:

- xDai: this subgraph indexes the deployed contracts on xDai ([deployed here](https://thegraph.com/hosted-service/subgraph/azf20/nifty-ink))
- mainnet: this subgraph indexes the mainnet Nifty Token contract ([deployed here](https://thegraph.com/hosted-service/subgraph/azf20/nifty-ink-main))
- local: this subgraph indexes a local hardhat chain with the latest sidechain contracts. Note that this subgraph relies purely on event handlers, unlike the xDai deployment, which relies on callhandlers where some events were omitted in the original contracts

There are three key elements to any subgraph:

- manifest (subgraph.yaml)
- schema (schema.graphql)
- Assemblyscript mapping files

Preparing and deploying a subgraph depends on which one you are deploying. The first step in all cases is a "prepare" step, which takes the `template.subgraph.yaml`, and generates a `subgraph.yaml` file for the relevant subgraph.

xDai subgraph, deployed to thegraph.com's hosted service (requires the deployment key to azf20/nifty-ink):

```
yarn prepare-xdai
yarn codegen
yarn build
yarn deploy-xdai
```

mainnet subgraph, deployed to thegraph.com's hosted service (requires the deployment key to azf20/nifty-ink-main):

```
yarn prepare-mainnet
yarn codegen
yarn build
yarn deploy-mainnet
```

local subgraph, deployed to a local graph-node (requires a local docker image and hardhat blockchain):

> Before running this process, ensure that ``/packages/niftygraph/config/local.json` has the correct contract addresses specified

```
yarn prepare-local
yarn codegen
yarn build
yarn create-local # only required the first time
yarn deploy-local
```

### Actions:

| Action          | Description                                                                            | Signature supported? | GSN supported? | Payable? |
| --------------- | -------------------------------------------------------------------------------------- | -------------------- | -------------- | -------- |
| Create          | Creates an ink & mints the first token copy to the artist                              | y                    | y              | n        |
| Mint            | Creates a copy to the specified address                                                | y                    | y              | n        |
| Set ink price   | Set the price for non-artists to buy tokens                                            | y                    | y              | n        |
| Set token price | Set the price for an individual token                                                  | n                    | n              | n        |
| Buy Ink         | Buy a new token copy at the artist-specified price                                     | n                    | n              | y        |
| Buy Token       | Buy a specific token at the token-owner specified price                                | n                    | n              | y        |
| Send            | Send an individual token to an address                                                 | n                    | n              | n        |
| Upgrade         | Transfer an individual token from xDai to mainnet, paying the relayPrice if applicable | y                    | n              | y        |
| Like            | "Like" an individual ink                                                               | y                    | y              | n        |

### The upgrade path

nifty.ink lets users upgrade their xDai ink NFTs to the Ethereum mainnet. This is a one-way door! Once you upgrade you cannot bring your inks back to xDai. The xDai token is locked in the Mediator contract, and a new matching token is minted on Mainnet on the basis of the tokenbridge relay
When you upgrade, you have to pay a fee - this is to cover the costs of minting a token on mainnet, and is controlled by a [price Oracle bot](https://blockscout.com/poa/xdai/address/0xa2197a282967dAc145e85D15e7960Aa30b86b771/transactions).

### Housekeeping

- we are running a GSN relay on xDai at https://baton.tokenizationofeverything.com/gsn1/getaddr (manager address at `0xa4a0df5105f5f54e59b7fd4f150259d60aa81ef1`)
- we need to keep the xDai GSN Paymaster topped up at `0x4734356359c48ba2Cb50BA048B1404A78678e5C2`
  Ensure the mainnet bridge ETH topped up: [0x87533bfd390c6d11afd8df1a8c095657e0eeed0d](https://etherscan.io/address/0x87533bfd390c6d11afd8df1a8c095657e0eeed0d)

### Sources

- [Scaffold ETH](https://github.com/austintgriffith/scaffold-eth)
- [React Canvas Draw](https://github.com/embiem/react-canvas-draw) for the drawing
- [IPFS](https://ipfs.io/) for storing the drawing and meta-information
- [xDai](https://www.xdaichain.com/) for the sidechain
- [Tokenbridge](tokenbridge.net) for the bridge to mainnet
- [TheGraph](https://thegraph.com) for the subgraph
- [antd](https://ant.design/) for the design library
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts) for the boilerplate contracts
- [OpenGSN](http://opengsn.org/) for the metatransactions
- [Supabase](https://supabase.io/docs/guides/database)

---
