"use client";

import { Address } from "~~/components/scaffold-eth";

export const Profile = ({ address }: { address: string }) => {
  return (
    <div className="mt-10 mb-5 flex justify-center ">
      <Address address={address} size="2xl" disableAddressLink showCopy={true} />
    </div>
  );
};
