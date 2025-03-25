import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Loader from "~~/components/Loader";
import { Chains } from "~~/types/chains";
import { Post } from "~~/types/zora";
import { getChainId } from "~~/utils/chains";
import { baseAddressPlatformReferrer } from "~~/utils/constants";
import { getFetchableUrl } from "~~/utils/ipfs";

const LazyImage: React.FC<{ uri: string; alt: string; width: number; height: number }> = ({
  uri,
  alt,
  width,
  height,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fetchMetadata = async () => {
    try {
      const url = getFetchableUrl(uri);
      const contractResponse = await fetch(url);
      const contractData = await contractResponse.json();
      return contractData.image;
    } catch (error) {
      console.error(`Failed to fetch contract data for URI: ${uri}`, error);
      return null;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(async entry => {
          if (entry.isIntersecting && !isLoaded) {
            const image = await fetchMetadata();
            setImageSrc(getFetchableUrl(image));
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
  }, [uri, isLoaded]);

  return (
    <div ref={imgRef} style={{ width, height }} className="rounded-lg bg-white">
      {imageSrc ? (
        <img src={imageSrc} alt={alt} width={width} height={height} className="rounded-lg" />
      ) : (
        <div className="skeleton w-full h-full"></div>
      )}
    </div>
  );
};

const ExploreZoraInks = () => {
  const chainId = getChainId(Chains.base);

  const [posts, setPosts] = useState<Post[]>([]);
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
        const postsResult = apiResult?.result?.[0].slice(1) || [];
        const postsObj = postsResult.map((post: any) => ({
          contractAddress: post[2],
          uri: post[3],
          name: post[4],
        }));
        setPosts(postsObj);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return <ZoraCollections isLoading={isLoading} posts={posts} />;
};

type ZoraCollectionsProps = {
  isLoading: boolean;
  posts: Post[];
};

const ZoraCollections: React.FC<ZoraCollectionsProps> = ({ isLoading, posts }) => {
  if (isLoading) {
    return <Loader />;
  }
  if (posts.length === 0) {
    return <p className="text-center text-lg">No collections were found on Zora on Base chain</p>;
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex items-center justify-center flex-col flex-grow">
        <ul className="">
          {posts.map((post, index) => {
            return (
              <li
                key={`${post.name}-${index}`}
                className={`inline-block border-2 border-gray-200 rounded-lg m-2 p-2 font-bold`}
              >
                <Link
                  href={`https://zora.co/coin/base:${post.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LazyImage uri={post?.uri} alt={post?.name as string} width={150} height={150} />
                  <div className="flex flex-col items-center">
                    <h3 className="my-2 text-md font-bold">
                      {post.name?.length > 18 ? post.name.slice(0, 15).concat("...") : post.name}
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
