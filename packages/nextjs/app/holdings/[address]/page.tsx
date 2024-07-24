"use client";

import { Divider, Select, Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { useAccount } from "wagmi";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import { GnosisChainInks } from "~~/app/_components/holdings/GnosisChainInks";
import { MainnetChainInks } from "~~/app/_components/holdings/MainnetChainInks";

const { Option } = Select;

const Holdings = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const { address: connectedAddress } = useAccount();

  return (
    <div className="flex justify-center">
      <div className="min-w-xl">
        <Profile address={address} />

        <Divider className="border-gray-300 min-w-4" />
        <Tabs defaultActiveKey="1" size="large" type="card" className="mt-5 flex items-center">
          <TabPane tab="Gnosis Chain" key="1">
            {connectedAddress && <GnosisChainInks address={address} connectedAddress={connectedAddress} />}
          </TabPane>
          <TabPane tab="Ethereum Mainnet" key="2">
            {connectedAddress && <MainnetChainInks address={address} connectedAddress={connectedAddress} />}
          </TabPane>
          <TabPane tab="🔍 Search collector" key="5">
            <SearchAddress redirectToPage="holdings" placeholderText="Search collector" />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Holdings;
