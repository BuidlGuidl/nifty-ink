import React, { useEffect, useState } from "react";
import ZoraCollections from "./ZoraCollections";
import { Chains } from "~~/types/chains";
import { Collection } from "~~/types/zora";
import { getChainId } from "~~/utils/chains";
import { baseAddressPlatformReferrer } from "~~/utils/constants";
import { getFetchableUrl } from "~~/utils/ipfs";

type ZoraCollectionsContainerProps = {
  connectedAddress: string;
};

const ZoraCollectionsContainer: React.FC<ZoraCollectionsContainerProps> = ({ connectedAddress }) => {
  const chainId = getChainId(Chains.base);

  const [collections, setCollections] = useState<Collection[]>([]);
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
        const collectionsData = apiResult?.result?.[0].slice(1) || [];

        const collectionDetails = await Promise.all(
          collectionsData.map(async (collection: any) => {
            try {
              const url = getFetchableUrl(collection[3]);
              const contractResponse = await fetch(url);
              const contractData = await contractResponse.json();
              return { ...contractData, contractAddress: collection[2] };
            } catch (error) {
              console.error(`Failed to fetch contract data for URI: ${collection[1]}`, error);
              return null;
            }
          }),
        );

        setCollections(collectionDetails.filter((collection: any) => collection !== null));
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return <ZoraCollections isLoading={isLoading} collections={collections} />;
};

export default ZoraCollectionsContainer;
