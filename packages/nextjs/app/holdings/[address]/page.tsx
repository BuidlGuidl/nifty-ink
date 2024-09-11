"use client";

import { Tabs, TabsProps } from "antd";
import { useAccount } from "wagmi";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import { GnosisChainInks } from "~~/app/_components/holdings/GnosisChainInks";
import { MainnetChainInks } from "~~/app/_components/holdings/MainnetChainInks";

const Holdings = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const { address: connectedAddress } = useAccount();

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Gnosis Chain",
      children: connectedAddress && <GnosisChainInks address={address} connectedAddress={connectedAddress} />,
    },
    {
      key: "2",
      label: "Ethereum Mainnet",
      children: connectedAddress && <MainnetChainInks address={address} connectedAddress={connectedAddress} />,
    },
    {
      key: "3",
      label: "🔍 Search artists",
      children: <SearchAddress redirectToPage="holdings" placeholderText="Search collector" />,
    },
  ];

  return (
    <div className="flex justify-center">
      <div className="min-w-xl">
        <Profile address={address} />

        <Tabs defaultActiveKey="1" type="card" centered items={items} />
      </div>
    </div>
  );
};

export default Holdings;
