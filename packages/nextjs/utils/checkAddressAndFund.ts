import { faucetWithdraw } from "./faucetWithdraw";

export async function checkAddressAndFund(sendToAddress?: string) {
  if (sendToAddress) {
    const response = await faucetWithdraw(sendToAddress);
    if (response?.error) {
      console.log(response?.error);
    }
  }
}
