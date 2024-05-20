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

  const { loading: isInksLoading, data } = useQuery(EXPLORE_QUERY, {
    variables: {
      first: 5,
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
    setInks(prevInks => ({ ...prevInks, ...newInks }));
  };

  useEffect(() => {
    data ? getInks(data.inks) : console.log("loading");
  }, [data]);

  console.log(inks);

  return (
    <>
      <InkList
        inks={inks}
        orderDirection={orderDirection}
        orderBy={orderBy}
        layout={layout}
        connectedAddress={connectedAddress}
        isInksLoading={isInksLoading}
      />
    </>
  );
};

export default Home;
