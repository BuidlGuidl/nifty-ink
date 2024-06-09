"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InkList } from "../../_components/InkList";
import { useQuery } from "@apollo/client";
import { Col, DatePicker, Divider, Form, Row, Select, Tabs } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { EXPLORE_QUERY, HOLDINGS_MAIN_INKS_QUERY, HOLDINGS_MAIN_QUERY, HOLDINGS_QUERY } from "~~/apollo/queries";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";
import { AddressInput } from "~~/components/scaffold-eth";

const { TabPane } = Tabs;

const Artist = ({ params }: { params: { address: string } }) => {
  const router = useRouter();

  const address = params?.address;
  console.log(address);

  // console.log(dataMainInks);

  // const {
  //   loading: isInksLoading,
  //   data,
  //   fetchMore: fetchMoreInks,
  // } = useQuery(EXPLORE_QUERY, {
  //   variables: {
  //     first: 5,
  //     skip: 0,
  //     orderBy: orderBy,
  //     orderDirection: orderDirection,
  //     liker: address ? address.toLowerCase() : "",
  //     // filters: inkFilters
  //   },
  // });

  const getMetadata = async (jsonURL: string): Promise<InkMetadata> => {
    const response = await fetch(`https://gateway.nifty.ink:42069/ipfs/${jsonURL}`);
    const data: InkMetadata = await response.json();
    console.log(data);
    data.image = data.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/");
    return data;
  };

  // const onLoadMore = (skip: number) => {
  //   fetchMoreInks({
  //     variables: {
  //       skip: skip,
  //     },
  //     updateQuery: (prev, { fetchMoreResult }) => {
  //       if (!fetchMoreResult) return prev;
  //       return fetchMoreResult;
  //     },
  //   });
  // };

  return (
    <div className="max-w-screen-xl">
      <Profile address={address} />

      <Divider className="border-gray-300" />

      <Tabs defaultActiveKey="1" size="large" type="card" style={{ textAlign: "center" }}>
        <TabPane tab="🖼️ Inks" key="1">
          {/* <div className="inks-grid">
            <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
              {inks ? (
                inks
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map(ink => (
                    <li
                      key={ink.id}
                      style={{
                        display: "inline-block",
                        verticalAlign: "top",
                        margin: 10,
                        padding: 10,
                        border: "1px solid #e5e5e6",
                        borderRadius: "10px",
                        fontWeight: "bold"
                      }}
                    >
                      <Link
                        to={{ pathname: "/ink/" + ink.id }}
                        style={{ color: "black" }}
                      >
                        <img
                          src={ink.metadata.image}
                          alt={ink.metadata.name}
                          width="150"
                          style={{
                            border: "1px solid #e5e5e6",
                            borderRadius: "10px"
                          }}
                        />
                        <h3
                          style={{
                            margin: "10px 0px 5px 0px",
                            fontWeight: "700"
                          }}
                        >
                          {ink.metadata.name.length > 18
                            ? ink.metadata.name.slice(0, 15).concat("...")
                            : ink.metadata.name}
                        </h3>

                        <Row
                          align="middle"
                          style={{
                            textAlign: "center",
                            justifyContent: "center"
                          }}
                        >
                          {ink.bestPrice > 0 ? (
                            <>
                              <p
                                style={{
                                  color: "#5e5e5e",
                                  margin: "0"
                                }}
                              >
                                <b>
                                  {ethers.utils.formatEther(ink.bestPrice)}{" "}
                                </b>
                              </p>

                              <img
                                src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                                alt="xdai"
                                style={{ marginLeft: 5 }}
                              />
                            </>
                          ) : (
                            <>
                              <img
                                src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                                alt="xdai"
                                style={{
                                  marginLeft: 5,
                                  visibility: "hidden"
                                }}
                              />
                            </>
                          )}
                        </Row>
                        <Divider style={{ margin: "8px 0px" }} />
                        <p style={{ color: "#5e5e5e", margin: "0", zoom: 0.8 }}>
                          {"Edition: " +
                            ink.count +
                            (ink.limit > 0 ? "/" + ink.limit : "")}
                        </p>
                      </Link>
                    </li>
                  ))
              ) : (
                <Loader />
              )}
            </ul>
          </div> */}
        </TabPane>
        <TabPane tab="📈 Statistics" key="3">
          {/* <div style={{ marginTop: "20px" }}>
            <Row gutter={16}>
              <ul
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  padding: "0",
                  margin: "0 20px"
                }}
              >
                <StatCard
                  name={"Inks created"}
                  value={data.artists.length ? data.artists[0].inkCount : 0}
                  emoji={"🖼️"}
                />
                <StatCard
                  name={"Inks sold"}
                  value={data.artists.length ? data.artists[0].saleCount : 0}
                  emoji={"🖼️"}
                />
                <StatCard
                  name={"Likes"}
                  value={data.artists.length ? data.artists[0].likeCount : 0}
                  emoji={"👍"}
                />
                <StatCard
                  name={"Earnings"}
                  value={`$${
                    data.artists.length
                      ? parseInt(
                          ethers.utils.formatEther(data.artists[0].earnings)
                        ).toFixed(2)
                      : 0
                  }`}
                  emoji={"💲"}
                />
              </ul>
            </Row>
          </div> */}
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
