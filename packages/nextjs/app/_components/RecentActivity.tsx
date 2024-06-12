"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Typography } from "antd";
import dayjs from "dayjs";
import { formatEther } from "viem";
import { ARTIST_RECENT_ACTIVITY_QUERY, FIRST_ARTIST_ACTIVITY_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { Address } from "~~/components/scaffold-eth";
import xDai from "~~/public/xDAI.png";
import { calculateStartingDate } from "~~/utils/helpers";

interface SearchAddressProps {
  address: string;
}

type Activity = {
  type: string;
  emoji: string;
  createdAt: number;
  inkId: string;
  jsonUrL: string;
  liker: string;
  id: string;

  buyer?: string;
  seller?: string;
  price?: string;
  txHash?: string;
  from: string;
  to: string;
};

const burnAddress = "0x000000000000000000000000000000000000dead";
const zeroAddress = "0x0000000000000000000000000000000000000000";

const createActivityArray = (user: any) => {
  const activities: any[] = [];

  user.likes.forEach((like: any) => {
    activities.push({
      type: "like",
      emoji: "👍",
      createdAt: like.createdAt,
      inkId: like.ink.id,
      jsonUrl: like.ink.jsonUrl,
      liker: like.liker.id,
      id: "like-" + like.id,
    });
  });

  user.sales.forEach((sale: any) => {
    activities.push({
      type: "sale",
      emoji: "💲",
      createdAt: sale.createdAt,
      inkId: sale.ink.id,
      jsonUrl: sale.ink.jsonUrl,
      id: "sale-" + sale.id,
      buyer: sale.buyer.id,
      seller: sale.seller.id,
      price: sale.price,
      txHash: sale.transactionHash,
    });
  });

  user.tokenTransfers.forEach((transfer: any) => {
    activities.push({
      type:
        transfer.token.id === transfer.ink.tokens[0].id && transfer.from.address === zeroAddress
          ? "create"
          : transfer.to.address === burnAddress
          ? "burn"
          : transfer.from.address === zeroAddress
          ? "mint"
          : "send",
      emoji:
        transfer.token.id === transfer.ink.tokens[0].id && transfer.from.address === zeroAddress
          ? "🖌️"
          : transfer.to.address === burnAddress
          ? "🔥"
          : transfer.from.address === zeroAddress
          ? "✨"
          : "✉️",
      createdAt: transfer.createdAt,
      inkId: transfer.ink.id,
      jsonUrl: transfer.ink.jsonUrl,
      to: transfer.to.address,
      id: "transfer-" + transfer.id,
      txHash: transfer.transactionHash,
      from: transfer.from.address,
    });
  });

  return activities;
};

export const RecentActivity: React.FC<SearchAddressProps> = ({ address }) => {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [startFrom, setStartFrom] = useState<number>(calculateStartingDate("threemonth"));
  const dateRange = 7776000; // three months
  const [userFirstActivity, setUserFirstActivity] = useState<number>(calculateStartingDate("threemonth"));

  const {
    loading: isLoadingDataActivity,
    error: errorDataActivity,
    data: dataActivity,
  } = useQuery(ARTIST_RECENT_ACTIVITY_QUERY, {
    variables: {
      address: address,
      createdAt: startFrom,
      skipLikes: 0,
      skipSales: 0,
      skipTransfers: 0,
    },
  });

  const {
    loading: isLoadingDataFirstActivity,
    error: errorFirstActivity,
    data: dataFirstActivity,
  } = useQuery(FIRST_ARTIST_ACTIVITY_QUERY, {
    variables: {
      address: address,
    },
  });

  useEffect(() => {
    setUserFirstActivity(
      Math.min(
        Number(dataFirstActivity?.artists[0]?.lastInkAt),
        Number(dataFirstActivity?.artists[0]?.lastSaleAt),
        Number(dataFirstActivity?.artists[0]?.lastLikeAt),
        Number(dataFirstActivity?.artists[0]?.createdAt),
      ),
    );
  }, [dataFirstActivity]);

  useEffect(() => {
    const getActivity = (dataActivity: any) => {
      const activityArray = createActivityArray(dataActivity);
      setActivity(activityArray);
    };
    dataActivity !== undefined && dataActivity.artists.length && dataActivity.artists[0].createdAt !== "0"
      ? getActivity(dataActivity.artists[0])
      : console.log("loading activity");
  }, [dataActivity]);

  const onLoadMore = () => {
    setStartFrom(startFrom - dateRange);
  };

  return (
    <div className="ml-10 flex justify-end gap-14 text-black">
      {activity !== undefined && activity?.length > 0 ? (
        <div className="">
          <ul className="list-none p-0 text-left mt-5">
            {activity
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((e, i) => (
                <li key={i} className="border-b border-gray-200 py-1.5 flex">
                  <Link href={{ pathname: "/ink/" + e.inkId }}>
                    <div className="relative top-0 left-0">
                      <img
                        src={`https://ipfs.nifty.ink/${e.inkId}`}
                        alt="ink"
                        className="w-[70px] border border-gray-300 rounded-[5px] p-[5px] relative top-0 left-0"
                      ></img>
                      <span className="absolute top-[42px] left-0 border-2 border-gray-200 bg-white rounded-[5px] p-[1px]">
                        {e.emoji}
                      </span>
                    </div>
                  </Link>

                  <div style={{ margin: "10px 12px", color: "#525252" }}>
                    {e.type === "like" ? (
                      <Typography.Text className="inline-flex">
                        <Address address={e.liker} disableAddressLink={true} format="short" size="xs" /> liked this ink
                      </Typography.Text>
                    ) : e.type === "sale" ? (
                      <Typography.Text className="inline-flex">
                        Bought by <Address address={e.buyer} disableAddressLink={true} format="short" size="xs" />
                        for {formatEther(BigInt(e.price!))}{" "}
                        <img src={xDai.src} alt="xdai" className="ml-[1px] mr-[3px]" />{" "}
                        <a
                          href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkOutlined />
                        </a>
                      </Typography.Text>
                    ) : e.type === "send" ? (
                      <Typography.Text className="inline-flex">
                        <Address address={e.from} disableAddressLink={true} format="short" size="xs" />
                        sent to <Address address={e.to} disableAddressLink={true} format="short" size="xs" />
                        <a
                          href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkOutlined />
                        </a>
                      </Typography.Text>
                    ) : e.type === "burn" ? (
                      <Typography.Text className="inline-flex">
                        Ink burned by
                        <Address
                          address={e.from === zeroAddress ? address : e.from}
                          disableAddressLink={true}
                          format="short"
                          size="xs"
                        />
                        <a
                          href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkOutlined />
                        </a>
                      </Typography.Text>
                    ) : e.type === "create" ? (
                      <Link href={{ pathname: "/ink/" + e.inkId }}>Created a new ink</Link>
                    ) : (
                      <Typography.Text className="inline-flex">
                        Ink minted
                        <a
                          href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkOutlined />
                        </a>
                      </Typography.Text>
                    )}
                    <p className="m-0 text-gray-500 text-xs mt-0.5">
                      {dayjs.unix(e.createdAt).format("DD MMM YYYY, HH:mma")}
                    </p>
                  </div>
                </li>
              ))}
            <div className="flex justify-center text-gray-600">
              {`Since ${new Date(startFrom * 1000).toISOString().slice(0, 10)}`}
            </div>
            {activity[activity.length - 1].createdAt > userFirstActivity && (
              <Button type="dashed" size="large" block onClick={() => onLoadMore()}>
                Load more
              </Button>
            )}
          </ul>
        </div>
      ) : (
        <Loader />
      )}
    </div>
  );
};
