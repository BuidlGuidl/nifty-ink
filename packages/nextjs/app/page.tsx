"use client";

import { useEffect, useState } from "react";
import { InkList } from "./_components/InkList";
import { useQuery } from "@apollo/client";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { EXPLORE_QUERY } from "~~/apollo/queries";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const layout = "cards";
  // let [allInks, setAllInks] = useState<Ink[]>([]);
  const [inks, setInks] = useState<Record<number, Ink>>({});

  const [orderBy] = useState<keyof Ink>("createdAt");
  const [orderDirection] = useState("desc");

  const {
    loading: isInksLoading,
    data,
    fetchMore: fetchMoreInks,
  } = useQuery(EXPLORE_QUERY, {
    variables: {
      first: 10,
      skip: 0,
      orderBy: orderBy,
      orderDirection: orderDirection,
      liker: connectedAddress ? connectedAddress.toLowerCase() : "",
      // filters: inkFilters
    },
  });

  const getMetadata = async (jsonURL: string): Promise<InkMetadata> => {
    const response = await fetch(`https://nifty-ink.mypinata.cloud/ipfs/${jsonURL}`);
    const data: InkMetadata = await response.json();
    console.log(data);
    data.image = data.image.replace("https://ipfs.io/ipfs/", "https://nifty-ink.mypinata.cloud/ipfs/");
    return data;
  };

  const onLoadMore = (skip: number) => {
    fetchMoreInks({
      variables: {
        skip: skip,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return fetchMoreResult;
      },
    });
  };

  const getInks = async (data: Ink[]) => {
    // setAllInks(prevAllInks => [...prevAllInks, ...data]);
    // let blocklist;
    // if (props.supabase) {
    //   let { data: supabaseBlocklist } = await props.supabase
    //     .from("blocklist")
    //     .select("jsonUrl");
    //   blocklist = supabaseBlocklist;
    // }
    const newInks: Record<number, Ink> = {};
    for (const ink of data) {
      // if (isBlocklisted(ink.jsonUrl)) return;
      // if (blocklist && blocklist.find(el => el.jsonUrl === ink.jsonUrl)) {
      //   return;
      // }
      const metadata = await getMetadata(ink.jsonUrl);
      const _ink = { ...ink, metadata };
      newInks[_ink.inkNumber] = _ink;
    }
    console.log("HI");
    setInks(prevInks => ({ ...prevInks, ...newInks }));
  };

  useEffect(() => {
    if (data && data.inks) {
      getInks(data.inks);
    } else {
      console.log("loading");
    }
  }, [data]);

  console.log(inks);

  return (
    <div className="max-w-screen-xl">
      <InkList
        inks={inks}
        orderDirection={orderDirection}
        orderBy={orderBy}
        layout={layout}
        connectedAddress={connectedAddress}
        isInksLoading={isInksLoading}
        onLoadMore={onLoadMore}
      />
    </div>
  );
};

export default Home;
