import React, { useEffect, useState } from "react";
import ZoraPosts from "~~/app/_components/ZoraPosts";
import { Chains } from "~~/types/chains";
import { Post } from "~~/types/zora";
import { getChainId } from "~~/utils/chains";
import { baseAddressPlatformReferrer } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

type ZoraPostsContainerProps = {
  connectedAddress: string;
};

const ZoraPostsContainer: React.FC<ZoraPostsContainerProps> = ({ connectedAddress }) => {
  const chainId = getChainId(Chains.base);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!connectedAddress || !chainId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`https://api.indexsupply.net/query?chain=${chainId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              event_signatures: [
                "CoinCreated (address indexed caller, address indexed payoutRecipient, address indexed platformReferrer, address currency, string uri, string name, string symbol, address coin, address pool, string version)",
              ],
              query: `select caller, platformReferrer, coin, uri, name
                      from coincreated
                      where caller = ${connectedAddress} 
                      and 
                      platformReferrer = ${baseAddressPlatformReferrer}`,
            },
          ]),
          method: "POST",
        });

        const apiResult = await response.json();
        const postsResult = apiResult?.result?.[0].slice(1) || [];
        const postsObj = postsResult
          .map((post: string[]) => ({
            contractAddress: post[2],
            uri: post[3],
            name: post[4],
          }))
          .reverse();
        setPosts(postsObj);
      } catch (error) {
        notification.error("Failed to fetch posts");
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return <ZoraPosts isLoading={isLoading} posts={posts} />;
};

export default ZoraPostsContainer;
