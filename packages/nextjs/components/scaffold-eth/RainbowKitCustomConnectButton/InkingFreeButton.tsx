import { BanknotesIcon } from "@heroicons/react/24/outline";

export const InkingFreeButton = () => {
  return (
    <div className="dropdown dropdown-hover dropdown-end">
      <div tabIndex={0} role="button" className="bg-secondary shadow-md p-2 rounded-full ml-2">
        <BanknotesIcon className="h-4 w-4" />
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-200 mt-5 rounded-lg z-[1] w-36 shadow">
        🎨 Inking is free for burner wallets! 🎉
      </ul>
    </div>
  );
};
