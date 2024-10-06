"use client";

import { Tabs, TabsProps } from "antd";
import { useAccount } from "wagmi";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import { GnosisChainInks } from "~~/app/_components/holdings/GnosisChainInks";
import { MainnetChainInks } from "~~/app/_components/holdings/MainnetChainInks";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";

const Holdings = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const { address: connectedAddress } = useAccount();

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: <p className={`${TEXT_PRIMARY_COLOR} my-0`}>Gnosis Chain</p>,
      children: connectedAddress && <GnosisChainInks address={address} connectedAddress={connectedAddress} />,
    },
    {
      key: "2",
      label: <p className={`${TEXT_PRIMARY_COLOR} my-0`}>Ethereum Mainnet</p>,
      children: connectedAddress && <MainnetChainInks address={address} connectedAddress={connectedAddress} />,
    },
    {
      key: "3",
      label: <p className={`${TEXT_PRIMARY_COLOR} my-0`}>🔍 Search artists</p>,
      children: <SearchAddress redirectToPage="holdings" placeholderText="Search collector" />,
    },
  ];

  return (
    <div className="flex justify-center">
      <div className="min-w-xl">
        <Profile address={address} />

        <Tabs defaultActiveKey="1" type="line" centered items={items} />
      </div>
    </div>
  );
};

export default Holdings;
