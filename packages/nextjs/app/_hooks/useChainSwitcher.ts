import { Chain } from "viem";
import { useSwitchChain } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

export const useChainSwitcher = () => {
  const { switchChainAsync } = useSwitchChain();

  const switchTo = async (targetChain: Chain): Promise<boolean> => {
    try {
      await switchChainAsync({ chainId: targetChain.id });
      notification.success(`Switched to ${targetChain.name}`);
      return true;
    } catch (err) {
      console.error("Chain switch failed:", err);
      notification.error(`Failed to switch to ${targetChain.name}`);
      return false;
    }
  };

  return { switchTo };
};
