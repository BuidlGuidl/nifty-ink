"use server";

import { db } from "../db/drizzle";
import { funding } from "../db/schema";
import { CreateCoinArgs, createCoinCall, getCoinCreateFromLogs } from "@zoralabs/coins-sdk";
import { eq } from "drizzle-orm";
import { formatEther, parseEther } from "viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || "0.00003";

const walletClient = createWalletClient({
  chain: base,
  account: privateKeyToAccount(process.env.FAUCET_ACCOUNT_PRIVATE_KEY! as `0x${string}`),
  transport: http(),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function fundIfRequired(sendToAddress: string) {
  if (process.env.FAUCET_ACCOUNT_ADDRESS !== walletClient.account.address) {
    return { error: "Faucet account address mismatch" };
  }

  const balance = Number(formatEther(await publicClient.getBalance({ address: sendToAddress })));

  if (balance && sendToAddress && balance >= Number(FAUCET_AMOUNT)) {
    console.log(`Address has enough funding: ${sendToAddress}`);
    return { success: "true" };
  }

  // Check if address has already received funding
  const existingFunding = await db.select().from(funding).where(eq(funding.address, sendToAddress));
  if (existingFunding.length > 0) {
    console.log(`Address has already received funding: ${sendToAddress}`);
    return { success: "true" };
  }

  try {
    console.log(`Sending funding from ${process.env.FAUCET_ACCOUNT_ADDRESS} to ${sendToAddress}`);
    const hash = await walletClient.sendTransaction({
      to: sendToAddress,
      value: parseEther(FAUCET_AMOUNT),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}. Transaction Hash: ${receipt.transactionHash}`);

    // Record the funding in the database
    await db.insert(funding).values({
      address: sendToAddress,
      amount: FAUCET_AMOUNT,
      transactionHash: receipt.transactionHash,
    });

    return { success: "true" };
  } catch (e) {
    console.log(e);
    return { error: "Failed to send funding" };
  }
}

export async function signTransaction(
  createCoinParams: CreateCoinArgs,
  burnerWalletAddress: string,
  burnerWalletPK: string,
) {
  const burnerWalletClient = createWalletClient({
    chain: base,
    account: privateKeyToAccount(burnerWalletPK as `0x${string}`),
    transport: http(),
  });

  if (burnerWalletClient.account.address !== burnerWalletAddress) {
    return { error: "Burner wallet address mismatch" };
  }

  let createCoinRequest;
  try {
    createCoinRequest = await createCoinCall(createCoinParams);
  } catch (error) {
    // If first attempt fails, try one more time
    try {
      createCoinRequest = await createCoinCall(createCoinParams);
    } catch (retryError) {
      return { error: "Failed to create coin request. Please try again." };
    }
  }
  const { request } = await publicClient.simulateContract({
    ...(createCoinRequest as any),
    account: burnerWalletClient.account,
  });

  const fundingResult = await fundIfRequired(burnerWalletAddress);
  if (fundingResult.error) {
    console.log("Funding check result:", fundingResult.error);
    return { error: fundingResult.error };
  }

  try {
    // Add a 2/5th buffer on gas.
    const GAS_MULTIPLIER = 150;
    if (request.gas) {
      // Gas limit multiplier is a percentage argument.
      request.gas = (request.gas * BigInt(GAS_MULTIPLIER)) / 100n;
    }
    const hash = await walletClient.writeContract(request);
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
    const errorMessage = error instanceof Error ? error.message : "Failed to create coin";

    return { error: errorMessage.length > 150 ? "Failed to create coin" : errorMessage };
  }
}
