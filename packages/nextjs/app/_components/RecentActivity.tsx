"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkOutlined, SearchOutlined } from "@ant-design/icons";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Button, Typography } from "antd";
import dayjs from "dayjs";
import { formatEther } from "viem";
import { ARTIST_RECENT_ACTIVITY_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { AddressType } from "~~/types/abitype/abi";

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
  const [inputAddress, setInputAddress] = useState<AddressType>();
  const [activity, setActivity] = useState<Activity[]>([]);

  //   const [fetchRecentActivity, { data: dataActivity, fetchMore, error: dataError }] =
  // useLazyQuery(ARTIST_RECENT_ACTIVITY_QUERY);

  const {
    loading,
    error,
    data: dataActivity,
  } = useQuery(ARTIST_RECENT_ACTIVITY_QUERY, {
    variables: {
      address: address,
      createdAt: 1636802314,
      skipLikes: 0,
      skipSales: 0,
      skipTransfers: 0,
    },
  });

  useEffect(() => {
    const getActivity = (dataActivity: any) => {
      const activityArray = createActivityArray(dataActivity);
      setActivity(activityArray);
    };
    console.log(dataActivity);
    dataActivity !== undefined && dataActivity.artists.length && dataActivity.artists[0].createdAt !== "0"
      ? getActivity(dataActivity.artists[0])
      : console.log("loading activity");
  }, [dataActivity]);

  return (
    <div className="mt-5 mr-10 flex justify-end gap-14 text-black">
      {activity !== undefined && activity?.length > 0 ? (
        <div style={{ width: "450px", margin: "0 auto" }}>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              textAlign: "left",
              marginTop: "20px",
            }}
          >
            {activity
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((e, i) => (
                <li
                  key={i}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: "5px 0",
                    display: "flex",
                  }}
                >
                  <Link href={{ pathname: "/ink/" + e.inkId }}>
                    <div style={{ position: "relative", top: "0", left: "0" }}>
                      <img
                        src={`https://ipfs.nifty.ink/${e.inkId}`}
                        alt="ink"
                        style={{
                          width: "70px",
                          border: "1px solid #f0f0f0",
                          borderRadius: "5px",
                          padding: "5px",
                          position: "relative",
                          top: "0",
                          left: "0",
                        }}
                      ></img>
                      <span
                        style={{
                          position: "absolute",
                          top: "42px",
                          left: "0",
                          border: "2px solid #f0f0f0",
                          background: "white",
                          borderRadius: "5px",
                          padding: "1px",
                        }}
                      >
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
                        <img
                          src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                          alt="xdai"
                          style={{ marginLeft: 1, marginRight: 3 }}
                        />{" "}
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
            {/* <Row justify="center">
                  <span style={{ textAlign: "center" }}>
                    {`Since ${new Date(activityCreatedAt.current * 1000)
                      .toISOString()
                      .slice(0, 10)}`}
                  </span>
                </Row> */}
            {/* {Object.values(activity)[Object.values(activity).length - 1]
                  .createdAt <= userFirstActivity ? null : (
                  <Button
                    type="dashed"
                    size="large"
                    block
                    onClick={() => onLoadMore()}
                  >
                    Load more
                  </Button>
                )} */}
          </ul>
        </div>
      ) : (
        <Loader />
      )}
    </div>
  );
};
