"use server";

import { ethers, formatEther } from "ethers";
import deployedContracts from "~~/contracts/deployedContracts";

export async function faucetWithdraw(sendToAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_API);
  const balance = Number(formatEther(await provider.getBalance(sendToAddress)));

  if (balance && sendToAddress && balance > 0.002) {
    console.log("You have enough funding.");
    return { error: "You have enough funding." };
  }

  try {
    const signer = new ethers.Wallet(process.env.FAUCET_ACCOUNT_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS as string,
      deployedContracts[100]["Faucet"]["abi"],
      signer,
    );

    const response = await contract.withdraw(sendToAddress);
    const receipt = await response.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}. Transaction Hash: ${receipt.transactionHash}`);
    return { success: "true" };
  } catch (e) {
    console.log(e);
    return { error: "Something wrong with faucet" };
  }
}
