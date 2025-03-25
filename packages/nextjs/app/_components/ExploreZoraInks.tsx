import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Loader from "~~/components/Loader";
import { Chains } from "~~/types/chains";
import { Collection } from "~~/types/zora";
import { getChainId } from "~~/utils/chains";
import { baseAddressPlatformReferrer } from "~~/utils/constants";
import { getFetchableUrl } from "~~/utils/ipfs";

// LazyImage component for handling image loading
const LazyImage: React.FC<{ src: string; alt: string; width: number; height: number }> = ({
  src,
  alt,
  width,
  height,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLoaded) {
            setImageSrc(src);
            setIsLoaded(true);
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, isLoaded]);

  return (
    <div ref={imgRef} style={{ width, height }} className="border border-gray-200 rounded-lg bg-white">
      {imageSrc && (
        <img src={imageSrc} alt={alt} width={width} height={height} className="border border-gray-200 rounded-lg" />
      )}
    </div>
  );
};

const ExploreZoraInks = () => {
  const chainId = getChainId(Chains.base);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
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
                      where platformReferrer = ${baseAddressPlatformReferrer}`,
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

type ZoraCollectionsProps = {
  isLoading: boolean;
  collections: Collection[];
};

const ZoraCollections: React.FC<ZoraCollectionsProps> = ({ isLoading, collections }) => {
  if (isLoading) {
    return <Loader />;
  }
  if (collections.length === 0) {
    return <p className="text-center text-lg">No collections were found on Zora on Base chain</p>;
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex items-center justify-center flex-col flex-grow">
        <ul className="">
          {collections.map((collection, index) => {
            return (
              <li
                key={`${collection.name}-${index}`}
                className={`inline-block border-2 border-gray-200 rounded-lg m-2 p-2 font-bold`}
              >
                <Link
                  href={`https://zora.co/coin/base:${collection.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LazyImage
                    src={getFetchableUrl(collection?.image)}
                    alt={collection?.name as string}
                    width={150}
                    height={150}
                  />
                  <div className="flex flex-col items-center">
                    <h3 className="my-2 text-md font-bold">
                      {collection.name?.length > 18 ? collection.name.slice(0, 15).concat("...") : collection.name}
                    </h3>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ExploreZoraInks;
