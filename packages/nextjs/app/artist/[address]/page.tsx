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
import Loader from "~~/components/Loader";
import { getMetadata } from "~~/utils/helpers";

const { TabPane } = Tabs;

const ITEMS_PER_PAGE = 20;

const Artist = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const [inks, setInks] = useState<Ink[]>([]);
  const { loading, error, data, fetchMore } = useQuery(ARTISTS_QUERY, {
    variables: { address: address, first: ITEMS_PER_PAGE + 1, skip: 0 },
  });
  const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const getInks = async (data: Ink[]) => {
      const metadataPromises = data.slice(0, ITEMS_PER_PAGE).map(ink => getMetadata(ink.jsonUrl));
      const hasMoreNewItems = data?.length > ITEMS_PER_PAGE;
      if (!hasMoreNewItems) {
        setAllItemsLoaded(true);
      }
      const metadataResults = await Promise.all(metadataPromises);

      // Combine each ink with its metadata
      const updatedInks = data.slice(0, ITEMS_PER_PAGE).map((ink, index) => ({
        ...ink,
        metadata: metadataResults[index],
      }));

      setInks([...inks, ...updatedInks]);
    };
    data !== undefined && data.artists[0] ? getInks(data.artists[0].inks) : console.log("loading");
  }, [data]);

  const onLoadMore = () => {
    fetchMore({
      variables: {
        skip: inks.length,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;
        return fetchMoreResult;
      },
    });
  };

  return (
    <div className="flex justify-center">
      <div className="max-w-3xl">
        <Profile address={address} />

        <Divider className="border-gray-300 min-w-4" />

        <Tabs
          defaultActiveKey="1"
          size="large"
          type="card"
          className="flex items-center"
          style={{ textAlign: "center" }}
        >
          <TabPane tab="🖼️ Inks" key="1">
            {loading ? (
              <Loader />
            ) : (
              <InkListArtist
                inks={inks}
                isInksLoading={false}
                onLoadMore={onLoadMore}
                allItemsLoaded={allItemsLoaded}
              />
            )}
          </TabPane>
          <TabPane tab="📈 Statistics" key="3">
            <div className="flex flex-wrap justify-center p-0 my-0 mx-5">
              <StatCard
                name={"Inks created"}
                value={data?.artists.length ? data?.artists[0].inkCount : 0}
                emoji={"🖼️"}
              />
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
    </div>
  );
};

export default Artist;
