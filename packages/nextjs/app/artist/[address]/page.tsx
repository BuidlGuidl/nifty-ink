"use client";

import { useEffect, useState } from "react";
import { RecentActivity } from "./RecentActivity";
import { useQuery } from "@apollo/client";
import { Tabs, TabsProps } from "antd";
import { formatEther } from "viem";
import { ARTISTS_QUERY } from "~~/apollo/queries";
import { InkListArtist } from "~~/app/_components/InkListArtist";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import StatCard from "~~/app/_components/StatCard";
import Loader from "~~/components/Loader";
import useInfiniteScroll from "~~/hooks/useInfiniteScroll";
import { getMetadata } from "~~/utils/helpers";

const ITEMS_PER_PAGE = 15;

const Artist = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  const [inks, setInks] = useState<Ink[]>([]);
  const { loading, data, fetchMore } = useQuery(ARTISTS_QUERY, {
    variables: { address: address, first: ITEMS_PER_PAGE + 1, skip: 0 },
  });
  const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(true);
  const [moreInksLoading, setMoreInksLoading] = useState<boolean>(false);

  useEffect(() => {
    const getInks = async (data: Ink[]) => {
      const metadataPromises = data.slice(0, ITEMS_PER_PAGE).map(ink => getMetadata(ink.jsonUrl));
      const hasMoreNewItems = data?.length > ITEMS_PER_PAGE;
      if (!hasMoreNewItems) {
        setAllItemsLoaded(true);
      } else {
        setAllItemsLoaded(false);
      }
      try {
        const metadataResults = await Promise.all(metadataPromises);

        // Combine each ink with its metadata
        const updatedInks = data.slice(0, ITEMS_PER_PAGE).map((ink, index) => ({
          ...ink,
          metadata: metadataResults[index],
        }));

        setInks([...inks, ...updatedInks]);
      } catch (error) {
        console.error("Error fetching inks or metadata:", error);
      } finally {
        // Ensure loading states are updated even if there was an error
        setMoreInksLoading(false);
      }
    };
    data !== undefined && data.artists[0] ? getInks(data.artists[0].inks) : console.log("loading");
  }, [data]);

  useInfiniteScroll(async () => {
    if (!moreInksLoading && !allItemsLoaded) {
      setMoreInksLoading(true);
      await fetchMore({
        variables: {
          skip: inks.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;
          return fetchMoreResult;
        },
      });
    }
  }, inks.length);

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "🖼️ Inks",
      children: (
        <>
          {loading ? (
            <Loader />
          ) : (
            <InkListArtist inks={inks} isInksLoading={moreInksLoading} allItemsLoaded={allItemsLoaded} />
          )}
        </>
      ),
    },
    {
      key: "2",
      label: "📈 Statistics",
      children: (
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
      ),
    },
    {
      key: "3",
      label: "🕗 Recent activity",
      children: <RecentActivity address={address} />,
    },

    {
      key: "4",
      label: "🔍 Search artists",
      children: <SearchAddress redirectToPage="artist" placeholderText="Search artist" />,
    },
  ];

  return (
    <div className="mx-auto flex flex-col justify-center">
      <Profile address={address} />

      <Tabs defaultActiveKey="1" type="card" centered items={items}></Tabs>
    </div>
  );
};

export default Artist;
