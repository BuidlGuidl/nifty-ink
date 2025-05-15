"use server";

import { db } from "../db/drizzle";
import { funding } from "../db/schema";
import { COIN_FACTORY_ADDRESS } from "./coin";
import { getCoinCreateFromLogs } from "@zoralabs/coins-sdk";
import { and, desc, eq } from "drizzle-orm";
import { TransactionSerializedLegacy, formatEther, parseEther, parseTransaction } from "viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const MAX_FAUCET_AMOUNT = process.env.BASE_FAUCET_AMOUNT || "0.00005";
const GAS_MULTIPLIER = process.env.GAS_MULTIPLIER || 120;

const faucetWalletClient = createWalletClient({
  chain: base,
  account: privateKeyToAccount(process.env.FAUCET_ACCOUNT_PRIVATE_KEY! as `0x${string}`),
  transport: http(),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function fundIfRequired(sendToAddress: string, txCost: bigint) {
  if (process.env.FAUCET_ACCOUNT_ADDRESS !== faucetWalletClient.account.address) {
    return { error: "Faucet account address mismatch" };
  }

  const balance = await publicClient.getBalance({ address: sendToAddress });
  if (balance > txCost) {
    // wallet has enough balance
    return { success: "true" };
  }

  const gasNeeded = ((txCost - balance) * BigInt(GAS_MULTIPLIER)) / BigInt(100);
  if (gasNeeded > parseEther(MAX_FAUCET_AMOUNT)) {
    return { error: "Too much gas needed" };
  }

  //   Check if address has already received funding
  const existingFunding = await db
    .select()
    .from(funding)
    .where(and(eq(funding.address, sendToAddress as `0x${string}`), eq(funding.chain, "base")))
    .orderBy(desc(funding.createdAt))
    .limit(1);

  if (existingFunding.length > 0) {
    const lastFundingTime = new Date(existingFunding[0].createdAt).getTime();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (lastFundingTime > fifteenMinutesAgo) {
      console.log(`Address has already received funding recently: ${sendToAddress}`);
      return { success: "true" };
    }
  }

  try {
    console.log(`Sending funding from ${process.env.FAUCET_ACCOUNT_ADDRESS} to ${sendToAddress}`);
    const hash = await faucetWalletClient.sendTransaction({
      to: sendToAddress,
      value: gasNeeded,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}. Transaction Hash: ${receipt.transactionHash}`);

    // Record the funding in the database
    await db.insert(funding).values({
      address: sendToAddress,
      amount: formatEther(gasNeeded),
      chain: "base",
      transactionHash: receipt.transactionHash,
    });

    return { success: "true" };
  } catch (e) {
    console.log(e);
    return { error: "Failed to send funding" };
  }
}

export async function fundAndSignTransaction(
  signature: `0x02${string}` | `0x01${string}` | `0x03${string}` | `0x04${string}` | TransactionSerializedLegacy,
  burnerWalletAddress: string,
) {
  const transaction = parseTransaction(signature);

  if (transaction.to?.toLowerCase() !== COIN_FACTORY_ADDRESS.toLowerCase()) {
    return { error: "Invalid transaction" };
  }

  if (transaction.chainId !== base.id) {
    return { error: "Invalid chain" };
  }

  if (!transaction.gas || !transaction.maxFeePerGas) {
    return { error: "Missing gas parameters" };
  }

  const txCost = transaction.gas * transaction.maxFeePerGas;

  const fundingResult = await fundIfRequired(burnerWalletAddress, txCost);
  if (fundingResult.error) {
    console.log("Funding check result:", fundingResult.error);
    return { error: fundingResult.error };
  }

  try {
    const hash = await publicClient.sendRawTransaction({ serializedTransaction: signature });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const deployment = getCoinCreateFromLogs(receipt);
    const result = {
      hash,
      receipt,
      address: deployment?.coin,
      deployment,
    };
    return { success: "true", result };
  } catch (error) {
    console.log("error", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create coin";

    return { error: errorMessage };
  }
}
