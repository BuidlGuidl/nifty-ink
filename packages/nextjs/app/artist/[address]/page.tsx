"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { Divider, Tabs } from "antd";
import { formatEther } from "viem";
import { ARTISTS_QUERY } from "~~/apollo/queries";
import { InkListArtist } from "~~/app/_components/InkListArtist";
import { Profile } from "~~/app/_components/Profile";
import { RecentActivity } from "~~/app/_components/RecentActivity";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import StatCard from "~~/app/_components/StatCard";
import { getMetadata } from "~~/utils/helpers";

const { TabPane } = Tabs;

const Artist = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const [inks, setInks] = useState<Ink[]>([]);
  const { loading, error, data } = useQuery(ARTISTS_QUERY, {
    variables: { address: address },
  });

  useEffect(() => {
    const getInks = async (data: Ink[]) => {
      const metadataPromises = data.map(ink => getMetadata(ink.jsonUrl));
      const metadataResults = await Promise.all(metadataPromises);

      // Combine each ink with its metadata
      const updatedInks = data.map((ink, index) => ({
        ...ink,
        metadata: metadataResults[index],
      }));

      setInks(updatedInks);
    };
    data !== undefined && data.artists[0] && inks.length === 0 ? getInks(data.artists[0].inks) : console.log("loading");
    if (data !== undefined && data.artists[0]) {
      const { createdAt, lastLikeAt, lastSaleAt } = data.artists[0];
      // console.log(createdAt, lastLikeAt, lastSaleAt);
      //   let lastTransferAt = data.artists[0].tokenTransfers.length ? data.artists[0].tokenTransfers[0].createdAt : 0;
      //   let lastActivity = Math.max(...[lastLikeAt, lastSaleAt, lastTransferAt].map(e => parseInt(e)));

      //   if (!dataActivity) {
      //     activityCreatedAt.current = lastActivity - dateRange;
      //     fetchRecentActivity({
      //       variables: {
      //         address: address,
      //         createdAt: activityCreatedAt.current,
      //         skipLikes: 0,
      //         skipSales: 0,
      //         skipTransfers: 0,
      //       },
      //     });
      //   }
      //   //   setUserFirstActivity(parseInt(createdAt));
      // } else {
      //   console.log("loading");
    }
  }, [data]);

  return (
    <div className="max-w-3xl">
      <Profile address={address} />

      <Divider className="border-gray-300 min-w-4" />

      <Tabs defaultActiveKey="1" size="large" type="card" className="flex items-center" style={{ textAlign: "center" }}>
        <TabPane tab="🖼️ Inks" key="1">
          <InkListArtist inks={inks} isInksLoading={false} onLoadMore={(skip: number) => undefined} />
        </TabPane>
        <TabPane tab="📈 Statistics" key="3">
          <div className="flex flex-wrap justify-center p-0 my-0 mx-5">
            <StatCard name={"Inks created"} value={data?.artists.length ? data?.artists[0].inkCount : 0} emoji={"🖼️"} />
            <StatCard name={"Inks sold"} value={data?.artists.length ? data?.artists[0].saleCount : 0} emoji={"🖼️"} />
            <StatCard name={"Likes"} value={data?.artists.length ? data?.artists?.[0].likeCount : 0} emoji={"👍"} />
            <StatCard
              name={"Earnings"}
              value={`$${data?.artists.length ? parseFloat(formatEther(data?.artists[0].earnings)).toFixed(2) : 0}`}
              emoji={"💲"}
            />
          </div>
        </TabPane>
        <TabPane tab="🕗 Recent activity" key="4">
          <RecentActivity address={address} />
        </TabPane>
        <TabPane tab="🔍 Search artists" key="5">
          <SearchAddress redirectToPage="artist" placeholderText="Search artist" />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Artist;
