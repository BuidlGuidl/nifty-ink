"use client";

import { Divider, Select, Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { useAccount } from "wagmi";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import { GnosisChainInks } from "~~/app/_components/holdings/GnosisChainInks";

const { Option } = Select;

const Holdings = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const { address: connectedAddress } = useAccount();

  return (
    <div className="min-w-xl">
      <Profile address={address} />

      <Divider className="border-gray-300 min-w-4" />
      <Tabs defaultActiveKey="1" size="large" type="card" className="mt-5flex items-center">
        <TabPane tab="Gnosis Chain" key="1">
          {connectedAddress && <GnosisChainInks address={address} connectedAddress={connectedAddress} />}
          {/* <InkListArtist inks={inks} isInksLoading={false} onLoadMore={(skip: number) => undefined} /> */}
        </TabPane>
        <TabPane tab="Ethereum Mainnet" key="2"></TabPane>
        <TabPane tab="🔍 Search collector" key="5">
          <SearchAddress redirectToPage="holdings" placeholderText="Search collector" />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Holdings;
