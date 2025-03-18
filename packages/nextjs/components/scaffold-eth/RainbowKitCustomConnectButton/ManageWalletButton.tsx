import { useEffect, useState } from "react";
import { WalletIcon } from "@heroicons/react/24/outline";

export const ManageWalletButton = () => {
  const [pk, setPk] = useState<string | null>(null);

  useEffect(() => {
    const value = localStorage.getItem("burnerWallet.pk");
    setPk(value);
  }, []);

  return (
    <a
      target="_blank"
      href={`https://punkwallet.io/pk#${pk}`}
      rel="noopener noreferrer"
      className="btn-sm !rounded-xl flex gap-3 py-3"
    >
      <WalletIcon className="h-6 w-4 ml-2 sm:ml-0" />
      <span className="whitespace-nowrap">Manage at PunkWallet</span>
    </a>
  );
};
