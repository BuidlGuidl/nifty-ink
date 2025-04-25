import { CreateCoinArgs } from "@zoralabs/coins-sdk";
import { Hex } from "viem";

const POOL_CONFIG =
  "0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc2f70fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcf2c0000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000b1a2bc2ec50000" as Hex;

export const COIN_FACTORY_ADDRESS = "0x777777751622c0d3258f214F9DF38E35BF45baF3";

export function customCreateCoinCall({
  name,
  symbol,
  uri,
  owners,
  payoutRecipient,
  initialPurchaseWei = 0n,
  platformReferrer = "0x0000000000000000000000000000000000000000",
}: CreateCoinArgs) {
  if (!owners) {
    owners = [payoutRecipient];
  }

  const orderSize: bigint = initialPurchaseWei;
  // The default pool config for
  const poolConfig = POOL_CONFIG;

  return {
    abi: zoraFactoryImplABI,
    functionName: "deploy",
    address: COIN_FACTORY_ADDRESS,
    args: [payoutRecipient, owners, uri, name, symbol, poolConfig, platformReferrer, orderSize],
    value: initialPurchaseWei,
  } as const;
}

export const zoraFactoryImplABI = [
  {
    type: "constructor",
    inputs: [{ name: "_coinImpl", internalType: "address", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "UPGRADE_INTERFACE_VERSION",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "coinImpl",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "payoutRecipient", internalType: "address", type: "address" },
      { name: "owners", internalType: "address[]", type: "address[]" },
      { name: "uri", internalType: "string", type: "string" },
      { name: "name", internalType: "string", type: "string" },
      { name: "symbol", internalType: "string", type: "string" },
      { name: "platformReferrer", internalType: "address", type: "address" },
      { name: "currency", internalType: "address", type: "address" },
      { name: "tickLower", internalType: "int24", type: "int24" },
      { name: "orderSize", internalType: "uint256", type: "uint256" },
    ],
    name: "deploy",
    outputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [
      { name: "payoutRecipient", internalType: "address", type: "address" },
      { name: "owners", internalType: "address[]", type: "address[]" },
      { name: "uri", internalType: "string", type: "string" },
      { name: "name", internalType: "string", type: "string" },
      { name: "symbol", internalType: "string", type: "string" },
      { name: "poolConfig", internalType: "bytes", type: "bytes" },
      { name: "platformReferrer", internalType: "address", type: "address" },
      { name: "orderSize", internalType: "uint256", type: "uint256" },
    ],
    name: "deploy",
    outputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [],
    name: "implementation",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "initialOwner", internalType: "address", type: "address" }],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "owner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "newOwner", internalType: "address", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "newImplementation", internalType: "address", type: "address" },
      { name: "data", internalType: "bytes", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "caller",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "payoutRecipient",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "platformReferrer",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "currency",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      { name: "uri", internalType: "string", type: "string", indexed: false },
      { name: "name", internalType: "string", type: "string", indexed: false },
      {
        name: "symbol",
        internalType: "string",
        type: "string",
        indexed: false,
      },
      {
        name: "coin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "pool",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "version",
        internalType: "string",
        type: "string",
        indexed: false,
      },
    ],
    name: "CoinCreated",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "version",
        internalType: "uint64",
        type: "uint64",
        indexed: false,
      },
    ],
    name: "Initialized",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferred",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "implementation",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "Upgraded",
  },
  {
    type: "error",
    inputs: [{ name: "target", internalType: "address", type: "address" }],
    name: "AddressEmptyCode",
  },
  {
    type: "error",
    inputs: [{ name: "account", internalType: "address", type: "address" }],
    name: "AddressInsufficientBalance",
  },
  { type: "error", inputs: [], name: "ERC1167FailedCreateClone" },
  {
    type: "error",
    inputs: [{ name: "implementation", internalType: "address", type: "address" }],
    name: "ERC1967InvalidImplementation",
  },
  { type: "error", inputs: [], name: "ERC1967NonPayable" },
  { type: "error", inputs: [], name: "ERC20TransferAmountMismatch" },
  { type: "error", inputs: [], name: "EthTransferInvalid" },
  { type: "error", inputs: [], name: "FailedInnerCall" },
  { type: "error", inputs: [], name: "InvalidInitialization" },
  { type: "error", inputs: [], name: "NotInitializing" },
  {
    type: "error",
    inputs: [{ name: "owner", internalType: "address", type: "address" }],
    name: "OwnableInvalidOwner",
  },
  {
    type: "error",
    inputs: [{ name: "account", internalType: "address", type: "address" }],
    name: "OwnableUnauthorizedAccount",
  },
  { type: "error", inputs: [], name: "ReentrancyGuardReentrantCall" },
  {
    type: "error",
    inputs: [{ name: "token", internalType: "address", type: "address" }],
    name: "SafeERC20FailedOperation",
  },
  { type: "error", inputs: [], name: "UUPSUnauthorizedCallContext" },
  {
    type: "error",
    inputs: [{ name: "slot", internalType: "bytes32", type: "bytes32" }],
    name: "UUPSUnsupportedProxiableUUID",
  },
] as const;
