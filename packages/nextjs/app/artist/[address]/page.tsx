"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InkList } from "../../_components/InkList";
import { useQuery } from "@apollo/client";
import { Col, DatePicker, Divider, Form, Row, Select, Tabs } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ARTISTS_QUERY } from "~~/apollo/queries";
import { InkListArtist } from "~~/app/_components/InkListArtist";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import StatCard from "~~/app/_components/StatCard";
import { AddressInput } from "~~/components/scaffold-eth";

const { TabPane } = Tabs;

const Artist = ({ params }: { params: { address: string } }) => {
  const router = useRouter();

  const address = params?.address;
  const [inks, setInks] = useState<Ink[]>([]);
  const { loading, error, data } = useQuery(ARTISTS_QUERY, {
    variables: { address: address },
  });

  useEffect(() => {
    const getInks = async (data: Ink[]) => {
      const updatedInks: Ink[] = [];
      for (const ink of data) {
        const metadata = await getMetadata(ink.jsonUrl);
        updatedInks.push({ ...ink, metadata });
      }
      setInks(updatedInks);
    };
    data !== undefined && data.artists[0] && inks.length === 0 ? getInks(data.artists[0].inks) : console.log("loading");

    // if (data !== undefined && data.artists[0]) {
    //   let { createdAt, lastLikeAt, lastSaleAt } = data.artists[0];
    //   let lastTransferAt = data.artists[0].tokenTransfers.length ? data.artists[0].tokenTransfers[0].createdAt : 0;
    //   let lastActivity = Math.max(...[lastLikeAt, lastSaleAt, lastTransferAt].map(e => parseInt(e)));

    //   if (!dataActivity) {
    //     activityCreatedAt.current = lastActivity - dateRange;
    //     fetchRecentActivity({
    //       variables: {
    //         address: address,
    //         createdAt: activityCreatedAt.current,
    //         skipLikes: 0,
    //         skipSales: 0,
    //         skipTransfers: 0,
    //       },
    //     });
    //   }
    //   //   setUserFirstActivity(parseInt(createdAt));
    // } else {
    //   console.log("loading");
    // }
  }, [data]);

  const getMetadata = async (jsonURL: string): Promise<InkMetadata> => {
    const response = await fetch(`https://gateway.nifty.ink:42069/ipfs/${jsonURL}`);
    const data: InkMetadata = await response.json();
    data.image = data.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/");
    return data;
  };

  return (
    <div className="max-w-3xl">
      <Profile address={address} />

      <Divider className="border-gray-300 min-w-4" />

      <Tabs defaultActiveKey="1" size="large" type="card" className="flex items-center" style={{ textAlign: "center" }}>
        <TabPane tab="🖼️ Inks" key="1">
          <InkListArtist inks={inks} isInksLoading={false} onLoadMore={(skip: number) => undefined} />
        </TabPane>
        <TabPane tab="📈 Statistics" key="3">
          <div className="flex flex-wrap justify-center p-0 my-0 mx-5">
            <StatCard name={"Inks created"} value={data?.artists.length ? data?.artists[0].inkCount : 0} emoji={"🖼️"} />
            <StatCard name={"Inks sold"} value={data?.artists.length ? data?.artists[0].saleCount : 0} emoji={"🖼️"} />
            <StatCard name={"Likes"} value={data?.artists.length ? data?.artists?.[0].likeCount : 0} emoji={"👍"} />
            <StatCard
              name={"Earnings"}
              value={`$${data?.artists.length ? parseFloat(formatEther(data?.artists[0].earnings)).toFixed(2) : 0}`}
              emoji={"💲"}
            />
          </div>
        </TabPane>
        <TabPane tab="🕗 Recent activity" key="4">
          {/* {activity !== undefined && Object.values(activity).length > 0 ? (
            <div style={{ width: "450px", margin: "0 auto" }}>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  textAlign: "left",
                  marginTop: "20px"
                }}
              >
                {Object.values(activity)
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((e, i) => (
                    <li
                      key={i}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        padding: "5px 0",
                        display: "flex"
                      }}
                    >
                      <Link to={{ pathname: "/ink/" + e.inkId }}>
                        <div
                          style={{ position: "relative", top: "0", left: "0" }}
                        >
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
                              left: "0"
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
                              padding: "1px"
                            }}
                          >
                            {e.emoji}
                          </span>
                        </div>
                      </Link>

                      <div style={{ margin: "10px 12px", color: "#525252" }}>
                        {e.type === "like" ? (
                          <Typography.Text style={{ margin: 0 }}>
                            <Link to={{ pathname: "/holdings/" + e.liker }}>
                              <Address
                                value={e.liker}
                                ensProvider={props.mainnetProvider}
                                clickable={false}
                                fontSize={"14px"}
                                notCopyable={true}
                                blockie={false}
                                justText={true}
                              />
                            </Link>{" "}
                            liked this ink
                          </Typography.Text>
                        ) : e.type === "sale" ? (
                          <Typography.Text style={{ margin: 0 }}>
                            Bought by{" "}
                            <Link to={{ pathname: "/holdings/" + e.buyer }}>
                              <Address
                                value={e.buyer}
                                ensProvider={props.mainnetProvider}
                                clickable={false}
                                fontSize={"14px"}
                                notCopyable={true}
                                blockie={false}
                                justText={true}
                              />
                            </Link>{" "}
                            for {ethers.utils.formatEther(e.price)}{" "}
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
                          <span style={{ display: "flex" }}>
                            <Typography.Text
                              style={{ margin: 0, verticalAlign: "middle" }}
                            >
                              <Link to={{ pathname: "/holdings/" + e.from }}>
                                <Address
                                  value={e.from}
                                  ensProvider={props.mainnetProvider}
                                  clickable={false}
                                  fontSize={"14px"}
                                  notCopyable={true}
                                  blockie={false}
                                  justText={true}
                                />
                              </Link>{" "}
                              sent to{" "}
                              <Link to={{ pathname: "/holdings/" + e.to }}>
                                <Address
                                  value={e.to}
                                  ensProvider={props.mainnetProvider}
                                  clickable={false}
                                  fontSize={"14px"}
                                  notCopyable={true}
                                  blockie={false}
                                  justText={true}
                                />
                              </Link>{" "}
                              <a
                                href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <LinkOutlined />
                              </a>
                            </Typography.Text>
                          </span>
                        ) : e.type === "burn" ? (
                          <>
                            <span
                              style={{ margin: 0 }}
                            >{`Ink burned by `}</span>
                            <Address
                              value={e.from === zeroAddress ? address : e.from}
                              ensProvider={props.mainnetProvider}
                              clickable={false}
                              fontSize={"14px"}
                              notCopyable={true}
                              blockie={false}
                              justText={true}
                            />{" "}
                            <a
                              href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkOutlined />
                            </a>
                          </>
                        ) : e.type === "create" ? (
                          <Link to={{ pathname: "/ink/" + e.inkId }}>
                            <span style={{ margin: 0 }}>Created a new ink</span>
                          </Link>
                        ) : (
                          <>
                            <span style={{ margin: 0 }}>Ink minted</span>{" "}
                            <a
                              href={`https://blockscout.com/xdai/mainnet/tx/${e.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkOutlined />
                            </a>
                          </>
                        )}
                        <p
                          style={{
                            margin: 0,
                            color: "#8c8c8c",
                            fontSize: "0.8rem",
                            marginTop: "2px"
                          }}
                        >
                          {dayjs
                            .unix(e.createdAt)
                            .format("DD MMM YYYY, HH:mma")}
                        </p>
                      </div>
                    </li>
                  ))}
                <Row justify="center">
                  <span style={{ textAlign: "center" }}>
                    {`Since ${new Date(activityCreatedAt.current * 1000)
                      .toISOString()
                      .slice(0, 10)}`}
                  </span>
                </Row>
                {Object.values(activity)[Object.values(activity).length - 1]
                  .createdAt <= userFirstActivity ? null : (
                  <Button
                    type="dashed"
                    size="large"
                    block
                    onClick={() => onLoadMore()}
                  >
                    Load more
                  </Button>
                )}
              </ul>
            </div>
          ) : (
            <Loader />
          )} */}
        </TabPane>
        <TabPane tab="🔍 Search artists" key="5">
          <SearchAddress redirectToPage="artist" />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Artist;
