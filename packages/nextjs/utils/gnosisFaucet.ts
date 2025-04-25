"use server";

import { db } from "../db/drizzle";
import { funding } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TransactionSerializedLegacy, formatEther, parseEther, parseTransaction } from "viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { gnosis } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

const GNOSIS_FAUCET_AMOUNT = process.env.GNOSIS_FAUCET_AMOUNT || "0.003";

const walletClient = createWalletClient({
  chain: gnosis,
  account: privateKeyToAccount(process.env.FAUCET_ACCOUNT_PRIVATE_KEY! as `0x${string}`),
  transport: http(),
});

const publicClient = createPublicClient({
  chain: gnosis,
  transport: http(),
});

export async function fundIfRequired(sendToAddress: string) {
  if (process.env.FAUCET_ACCOUNT_ADDRESS !== walletClient.account.address) {
    return { error: "Faucet account address mismatch" };
  }

  const balance = Number(formatEther(await publicClient.getBalance({ address: sendToAddress })));

  console.log(`Balance: ${balance}`);
  if (balance && sendToAddress && balance >= Number(GNOSIS_FAUCET_AMOUNT)) {
    console.log(`Address has enough funding: ${sendToAddress} ${balance}`);
    return { success: "true" };
  }

  //   Check if address has already received funding
  const existingFunding = await db
    .select()
    .from(funding)
    .where(and(eq(funding.address, sendToAddress as `0x${string}`), eq(funding.chain, "gnosis")))
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
    const hash = await walletClient.sendTransaction({
      to: sendToAddress,
      value: parseEther(GNOSIS_FAUCET_AMOUNT),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}. Transaction Hash: ${receipt.transactionHash}`);

    // Record the funding in the database
    await db.insert(funding).values({
      address: sendToAddress,
      amount: GNOSIS_FAUCET_AMOUNT,
      chain: "gnosis",
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
  if (transaction.to?.toLowerCase() !== deployedContracts[100].NiftyInk.address.toLowerCase()) {
    return { error: "Invalid transaction" };
  }

  if (transaction.chainId !== gnosis.id) {
    return { error: "Invalid chain" };
  }

  const fundingResult = await fundIfRequired(burnerWalletAddress);
  if (fundingResult.error) {
    console.log("Funding error:", fundingResult.error);
    return { error: fundingResult.error };
  }

  try {
    const hash = await publicClient.sendRawTransaction({ serializedTransaction: signature });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { success: "true", receipt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create ink";

    return { error: errorMessage.length > 150 ? "Failed to create ink" : errorMessage };
  }
}
