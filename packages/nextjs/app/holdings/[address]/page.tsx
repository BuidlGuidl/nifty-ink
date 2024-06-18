"use client";

import { useQuery } from "@apollo/client";
import { DatePicker, Divider, Form, Row, Select, Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { EXPLORE_QUERY, HOLDINGS_MAIN_INKS_QUERY, HOLDINGS_MAIN_QUERY, HOLDINGS_QUERY } from "~~/apollo/queries";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import { GnosisChainInks } from "~~/app/_components/holdings/GnosisChainInks";

const { Option } = Select;

interface Token {
  id: string;
  network?: string;
  ink: Ink;
}

const Holdings = ({ params }: { params: { address: string } }) => {
  const address = params?.address;

  return (
    <div className="min-w-xl">
      <Profile address={address} />

      <Divider className="border-gray-300 min-w-4" />
      <Tabs defaultActiveKey="1" size="large" type="card" className="mt-5flex items-center">
        <TabPane tab="Gnosis Chain" key="1">
          <GnosisChainInks address={address} />
          {/* <InkListArtist inks={inks} isInksLoading={false} onLoadMore={(skip: number) => undefined} /> */}
        </TabPane>
        <TabPane tab="Ethereum Mainnet" key="2"></TabPane>
        <TabPane tab="🔍 Search collector" key="5">
          <SearchAddress redirectToPage="artist" placeholderText="Search collector" />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Holdings;
