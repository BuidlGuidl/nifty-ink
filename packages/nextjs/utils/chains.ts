import { Chains } from "~~/types/chains";

export function getChainId(chain: Chains): number {
  switch (chain) {
    case Chains.gnosis:
      return 100;
    case Chains.base:
      return 8453;
    default:
      return 100;
  }
}
