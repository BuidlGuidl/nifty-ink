"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "~~/components/scaffold-eth";
import { AddressType } from "~~/types/abitype/abi";

interface SearchAddressProps {
  redirectToPage: string;
}

export const SearchAddress: React.FC<SearchAddressProps> = ({ redirectToPage }) => {
  const router = useRouter();
  const [inputAddress, setInputAddress] = useState<AddressType>();

  return (
    <div className="mt-5 mr-10 flex justify-end gap-14 text-black">
      <AddressInput
        placeholder="Search artist"
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
