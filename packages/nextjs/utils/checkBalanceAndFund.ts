import { faucetWithdraw } from "./faucetWithdraw";
import { notification } from "./scaffold-eth";
import { formatEther } from "viem";

export async function checkBalanceAndFund(balance?: any, sendToAddress?: string) {
  if (balance && sendToAddress) {
    const balanceVal = Number(formatEther(balance?.value));
    if (balanceVal < 0.002) {
      const response = await faucetWithdraw(sendToAddress);
      if (response?.error) {
        console.log(response?.error);
        if (balanceVal < 0.0001) {
          notification.error("Something wrong with faucet");
          return;
        }
      }
    }
  }
}
