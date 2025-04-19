"use server";

import { db } from "../db/drizzle";
import { funding } from "../db/schema";
import { eq } from "drizzle-orm";
import { formatEther, parseEther } from "viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { gnosis } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

const FAUCET_AMOUNT = "0.003";

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
  if (balance && sendToAddress && balance >= Number(FAUCET_AMOUNT)) {
    console.log(`Address has enough funding: ${sendToAddress} ${balance}`);
    return { success: "true" };
  }

  // Check if address has already received funding
  //   const existingFunding = await db.select().from(funding).where(eq(funding.address, sendToAddress));
  //   if (existingFunding.length > 0) {
  //     console.log(`Address has already received funding: ${sendToAddress}`);
  //     return { success: "true" };
  //   }

  try {
    console.log(`Sending funding from ${process.env.FAUCET_ACCOUNT_ADDRESS} to ${sendToAddress}`);
    const hash = await walletClient.sendTransaction({
      to: sendToAddress,
      value: parseEther(FAUCET_AMOUNT),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}. Transaction Hash: ${receipt.transactionHash}`);

    // Record the funding in the database
    // await db.insert(funding).values({
    //   address: sendToAddress,
    //   amount: FAUCET_AMOUNT,
    //   transactionHash: receipt.transactionHash,
    // });

    return { success: "true" };
  } catch (e) {
    console.log(e);
    return { error: "Failed to send funding" };
  }
}

export async function fundAndSignTransaction(
  functionArgs: [string, string, bigint],
  burnerWalletAddress: string,
  burnerWalletPK: string,
) {
  const burnerWalletClient = createWalletClient({
    chain: gnosis,
    account: privateKeyToAccount(burnerWalletPK as `0x${string}`),
    transport: http(),
  });

  if (burnerWalletClient.account.address !== burnerWalletAddress) {
    return { error: "Burner wallet address mismatch" };
  }

  const { request } = await publicClient.simulateContract({
    address: deployedContracts?.[100].NiftyInk.address,
    abi: deployedContracts?.[100].NiftyInk.abi,
    functionName: "createInk",
    args: functionArgs,
    account: burnerWalletClient.account,
  });

  const fundingResult = await fundIfRequired(burnerWalletAddress);
  if (fundingResult.error) {
    console.log("Funding error:", fundingResult.error);
    return { error: fundingResult.error };
  }

  try {
    console.log("Signing transaction...");
    const hash = await burnerWalletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { success: "true", receipt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create ink";

    return { error: errorMessage.length > 150 ? "Failed to create ink" : errorMessage };
  }
}
