import React from "react";
import Link from "next/link";
import Loader from "~~/components/Loader";
import { Collection } from "~~/types/zora";
import { getFetchableUrl } from "~~/utils/ipfs";

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
                  <img
                    src={getFetchableUrl(collection?.image)}
                    alt={collection?.name as string}
                    width={"150"}
                    height={"150"}
                    className={"border border-gray-200 rounded-lg"}
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

export default ZoraCollections;
