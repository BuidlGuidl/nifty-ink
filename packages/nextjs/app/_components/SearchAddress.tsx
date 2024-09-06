"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "~~/components/scaffold-eth";
import { AddressType } from "~~/types/abitype/abi";

interface SearchAddressProps {
  redirectToPage: string;
  placeholderText: string;
}

export const SearchAddress: React.FC<SearchAddressProps> = ({ redirectToPage, placeholderText }) => {
  const router = useRouter();
  const [inputAddress, setInputAddress] = useState<AddressType>();

  return (
    <div className="flex justify-center gap-5">
      <AddressInput
        placeholder={placeholderText}
        value={inputAddress ?? ""}
        onChange={value => setInputAddress(value as AddressType)}
      />
      <button
        className="h-10 btn btn-primary btn-sm px-2 rounded-full"
        onClick={() => router.push(`/${redirectToPage}/${inputAddress}`)}
      >
        Search
      </button>
    </div>
  );
};
