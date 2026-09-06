/** @experimental Unstable prototype API. Not audited or intended for production use. */
import { parseAbiItem, type Abi, type Address, type Hash, type PublicClient, type WalletClient } from "viem";
export type Contract = { address: Address; abi: Abi };
export type Contracts = { token: Contract; registry: Contract; renderer: Contract; controller: Contract };
export type Artwork = {
  id: bigint;
  name: string;
  artist: Address;
  cap: bigint;
  minted: bigint;
  price: bigint;
  enabled: boolean;
  balance: bigint;
  payout: Address;
  cid: string;
};
export async function loadArtworks(
  client: PublicClient,
  contracts: Contracts,
  account: Address,
  fromBlock = 0n
): Promise<Artwork[]> {
  const events = await client.getLogs({
    address: contracts.registry.address,
    event: parseAbiItem(
      "event InkRegistered(uint256 indexed id, address indexed artist, string name)"
    ),
    fromBlock,
    toBlock: "latest",
  });
  return Promise.all(
    events
      .slice()
      .reverse()
      .map(async (event) => {
        const id = event.args.id!;
        const [edition, sale, balance, payout, uri] = await Promise.all([
          client.readContract({
            ...contracts.token,
            functionName: "editions",
            args: [id],
          }),
          client.readContract({
            ...contracts.controller,
            functionName: "sales",
            args: [id],
          }),
          client.readContract({
            ...contracts.token,
            functionName: "balanceOf",
            args: [account, id],
          }),
          client.readContract({
            ...contracts.registry,
            functionName: "payoutOf",
            args: [id],
          }),
          client.readContract({
            ...contracts.token,
            functionName: "uri",
            args: [id],
          }),
        ]);
        const [cap, minted] = edition as [bigint, bigint, boolean];
        const [price, enabled] = sale as [bigint, boolean];
        const decoded = new TextDecoder().decode(
          Uint8Array.from(atob((uri as string).split(",")[1]), (c) =>
            c.charCodeAt(0)
          )
        );
        const metadata = JSON.parse(decoded);
        const cid = /^ipfs:\/\/([^/]+)\//.exec(metadata.image)?.[1] || "";
        return {
          id,
          name: event.args.name!,
          artist: event.args.artist!,
          cap,
          minted,
          price,
          enabled,
          balance: balance as bigint,
          payout: payout as Address,
          cid,
        };
      })
  );
}

export async function writeContract(
  client: PublicClient,
  wallet: WalletClient,
  contract: Contract,
  account: Address,
  functionName: string,
  args: readonly unknown[],
  value = 0n,
  onSubmitted?: (hash: Hash) => void
) {
  const simulation = await client.simulateContract({
    ...contract,
    account,
    functionName,
    args,
    value,
  });
  const hash = await wallet.writeContract(simulation.request);
  onSubmitted?.(hash);
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success")
    throw new Error("The transaction reverted; no changes were saved.");
  return receipt;
}


/** Buy primary-sale copies at a caller-approved maximum unit price and deadline. */
export async function buyCopies(client: PublicClient, wallet: WalletClient, controller: Contract, input: {
  account: Address; id: bigint; quantity: bigint; recipient: Address;
  unitPrice: bigint; deadline: bigint; onSubmitted?: (hash: Hash) => void;
}) {
  if (input.quantity <= 0n || input.quantity > (1n << 64n) - 1n) throw new Error("Invalid quantity");
  if (input.unitPrice < 0n || input.unitPrice > (1n << 128n) - 1n) throw new Error("Invalid price");
  return writeContract(client, wallet, controller, input.account, "buy",
    [input.id, input.quantity, input.recipient, input.unitPrice, input.deadline],
    input.unitPrice * input.quantity, input.onSubmitted);
}
