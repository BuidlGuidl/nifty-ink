"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LikeButton } from "./_components/LikeButton";
import { useQuery } from "@apollo/client";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { EXPLORE_QUERY } from "~~/apollo/queries";

interface InkMetadata {
  attributes: InkMetadataAttribute[];
  description: string;
  drawing: string;
  external_url: string;
  image: string;
  name: string;
}

interface InkMetadataAttribute {
  trait_type: string;
  value: string;
}

interface Artist {
  __typename: string;
  address: string;
  id: string;
}

interface Ink {
  __typename: string;
  artist: Artist;
  bestPrice: number;
  bestPrceSetAt?: string;
  bestPriceSource?: string;
  count: string;
  createdAt: string;
  id: string;
  inkNumber: number;
  jsonUrl: string;
  likeCount?: number;
  likes: any[];
  limit: number;
  metadata?: InkMetadata;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const layout = "cards";
  // let [allInks, setAllInks] = useState<Ink[]>([]);
  const [inks, setInks] = useState<Record<number, Ink>>({});

  const [orderBy] = useState("createdAt");
  const [orderDirection] = useState("desc");

  const { data } = useQuery(EXPLORE_QUERY, {
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
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="inks-grid">
          <ul className="p-0 text-center list-none">
            {inks
              ? Object.keys(inks)
                  // .sort((a, b) =>
                  //   orderDirection === "desc"
                  //     ? inks[b][orderBy] - inks[a][orderBy]
                  //     : inks[a][orderBy] - inks[b][orderBy],
                  // )
                  .map(inkKey => {
                    const ink = Number(inkKey);
                    // let likeInfo =
                    //   likes.length > 0 &&
                    //   likes.find((element) => element?.inkNumber === inks[ink].inkNumber);
                    return (
                      <li
                        key={inks[ink].id}
                        className={`inline-block border border-gray-200 rounded-lg ${
                          layout === "cards" ? "m-2 p-2 font-bold" : ""
                        }`}
                      >
                        <Link href={{ pathname: "/ink/" + inks[ink].id }} className="text-black">
                          <img
                            src={inks[ink]?.metadata?.image}
                            alt={inks[ink]?.metadata?.name}
                            width={layout === "cards" ? "180" : "150"}
                            className={`${layout === "cards" ? "border border-gray-200 rounded-lg" : ""}`}
                          />
                          {layout === "cards" && (
                            <>
                              <div className="flex flex-col items-center w-44">
                                <h3 className="my-2 text-lg font-bold">
                                  {inks[ink]?.metadata?.name?.length ?? 0 > 18 // review for zero
                                    ? inks[ink]?.metadata?.name.slice(0, 15).concat("...")
                                    : inks[ink]?.metadata?.name}
                                </h3>
                                <div className="flex items-center justify-center w-44">
                                  {inks[ink]?.bestPrice > 0 ? (
                                    <>
                                      <p className="text-gray-600 m-0">
                                        <b>{parseFloat(formatEther(BigInt(inks[ink]?.bestPrice)))} </b>
                                      </p>
                                      <img
                                        src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                                        alt="xdai"
                                        className="ml-1"
                                      />
                                    </>
                                  ) : (
                                    <img
                                      src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                                      alt="xdai"
                                      className="ml-1 invisible"
                                    />
                                  )}
                                  <div className="mx-2">
                                    <LikeButton
                                      // metaProvider={props.metaProvider}
                                      // metaSigner={props.metaSigner}
                                      // injectedGsnSigner={props.injectedGsnSigner}
                                      // signingProvider={props.injectedProvider}
                                      // localProvider={props.kovanProvider}
                                      // contractAddress={props.contractAddress}
                                      targetId={inks[ink].inkNumber}
                                      likerAddress={connectedAddress}
                                      // transactionConfig={props.transactionConfig}
                                      likeCount={inks[ink]?.likeCount || 0}
                                      hasLiked={false}
                                      // hasLiked={(likeInfo && likeInfo.likes.length > 0) || false}
                                      // marginBottom="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  })
              : null}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Home;
