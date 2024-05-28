import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useParams, Link, useHistory } from "react-router-dom";
import { useQuery, useLazyQuery } from "react-apollo";
import { ARTISTS_QUERY, ARTIST_RECENT_ACTIVITY_QUERY } from "./apollo/queries";
import { isBlocklisted } from "./helpers";
import StatCard from './StatCard.js'

import {
  Row,
  Col,
  Divider,
  Button,
  Form,
  notification,
  Tabs,
  Typography
} from "antd";
import { SearchOutlined, LinkOutlined } from "@ant-design/icons";
import Blockies from "react-blockies";
import { AddressInput, Loader, Address } from "./components";

const dayjs = require("dayjs");
const { TabPane } = Tabs;

export default function Artist(props) {
  const { address } = useParams();
  const [inks, setInks] = useState([]);
  const [searchArtist] = Form.useForm();
  const history = useHistory();

  const [activity, setActivity] = useState({});
  const activityCreatedAt = useRef(dayjs().unix());
  const [userFirstActivity, setUserFirstActivity] = useState();

  let burnAddress = "0x000000000000000000000000000000000000dead";
  let zeroAddress = "0x0000000000000000000000000000000000000000";

  const { loading, error, data } = useQuery(ARTISTS_QUERY, {
    variables: { address: address }
  });

  const dateRange = 2592000;

  const [
    fetchRecentActivity,
    { data: dataActivity, fetchMore, error: dataError }
  ] = useLazyQuery(ARTIST_RECENT_ACTIVITY_QUERY);

  const search = async values => {
    try {
      const newAddress = ethers.utils.getAddress(values["address"]);
      setInks([]);
      setActivity({});
      setUserFirstActivity();
      activityCreatedAt.current = dayjs().unix();
      history.push("/artist/" + newAddress);
    } catch (e) {
      console.log("not an address");
      notification.open({
        message: "📛 Not a valid address!",
        description: "Please try again"
      });
    }
  };

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const SearchForm = () => {
    return (
      <Row style={{ justifyContent: "center" }}>
        <Form
          form={searchArtist}
          layout={"inline"}
          name="searchArtist"
          onFinish={search}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name="address"
            rules={[
              { required: true, message: "Search for an Address or ENS" }
            ]}
          >
            <AddressInput
              ensProvider={props.mainnetProvider}
              placeholder={"Search artist"}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" disabled={loading}>
              <SearchOutlined />
            </Button>
          </Form.Item>
        </Form>
      </Row>
    );
  };

  const createActivityArray = user => {
    let activities = [];

    user.likes.forEach(like => {
      activities.push({
        type: "like",
        emoji: "👍",
        createdAt: like.createdAt,
        inkId: like.ink.id,
        jsonUrl: like.ink.jsonUrl,
        liker: like.liker.id,
        id: "like-" + like.id
      });
    });

    user.sales.forEach(sale => {
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
        txHash: sale.transactionHash
      });
    });

    /*
    if (user.artist !== null) {
      user.inks.forEach(ink => {
        activities.push({
          type: "create",
          emoji: "🖌️",
          createdAt: ink.createdAt,
          inkId: ink.id,
          jsonUrl: ink.jsonUrl,
          id: "ink-" + ink.id
        });
      });
    }
    */

    user.tokenTransfers.forEach(transfer => {
      activities.push({
        type:
          transfer.token.id === transfer.ink.tokens[0].id &&
          transfer.from.address === zeroAddress
            ? "create"
            : transfer.to.address === burnAddress
            ? "burn"
            : transfer.from.address === zeroAddress
            ? "mint"
            : "send",
        emoji:
          transfer.token.id === transfer.ink.tokens[0].id &&
          transfer.from.address === zeroAddress
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
        from: transfer.from.address
      });
    });

    return activities;
  };

  useEffect(() => {
    const getMetadata = async jsonURL => {
      //const response = await fetch("https://ipfs.io/ipfs/" + jsonURL);
      const response = await fetch(
        "https://gateway.nifty.ink:42069/ipfs/" + jsonURL
      );
      const data = await response.json();
      data.image = data.image.replace(
        "https://ipfs.io/ipfs/",
        "https://gateway.nifty.ink:42069/ipfs/"
      );
      return data;
    };

    const getInks = async data => {
      setInks([]);
      let blocklist;
      if (props.supabase) {
        let { data: supabaseBlocklist } = await props.supabase
          .from("blocklist")
          .select("jsonUrl");
        blocklist = supabaseBlocklist;
      }
      data.forEach(async ink => {
        if (isBlocklisted(ink.jsonUrl)) return;
        if (blocklist && blocklist.find(el => el.jsonUrl === ink.jsonUrl)) {
          return;
        }
        let _ink = ink;
        _ink.metadata = await getMetadata(ink.jsonUrl);
        setInks(inks => [...inks, _ink]);
      });
    };

    data !== undefined && data.artists[0] && inks.length === 0
      ? getInks(data.artists[0].inks)
      : console.log("loading");

    if (data !== undefined && data.artists[0]) {
      let { createdAt, lastLikeAt, lastSaleAt } = data.artists[0];
      let lastTransferAt = data.artists[0].tokenTransfers.length
        ? data.artists[0].tokenTransfers[0].createdAt
        : 0;
      let lastActivity = Math.max(
        ...[lastLikeAt, lastSaleAt, lastTransferAt].map(e => parseInt(e))
      );

      if (!dataActivity) {
        activityCreatedAt.current = lastActivity - dateRange;
        fetchRecentActivity({
          variables: {
            address: address,
            createdAt: activityCreatedAt.current,
            skipLikes: 0,
            skipSales: 0,
            skipTransfers: 0
          }
        });
      }
      setUserFirstActivity(parseInt(createdAt));
    } else {
      console.log("loading");
    }
  }, [data]);

  useEffect(() => {
    const getActivity = dataActivity => {
      let activityArray = createActivityArray(dataActivity);

      activityArray.forEach(async activity => {
        let _activity = activity;
        //_activity.artwork = await getArtworkURL(activity.jsonUrl);
        let _activityObject = {};
        _activityObject[_activity.id] = _activity;
        setActivity(activity => ({ ...activity, ..._activityObject }));
      });
    };

    dataActivity !== undefined &&
    dataActivity.artists.length &&
    dataActivity.artists[0].createdAt !== "0"
      ? getActivity(dataActivity.artists[0])
      : console.log("loading activity");
  }, [dataActivity]);

  const onLoadMore = useCallback(() => {
    let newCutoff = parseInt(activityCreatedAt.current - dateRange);
    fetchMore({
      variables: {
        createdAt: newCutoff,
        skipLikes: 0,
        skipSales: 0,
        skipTransfers: 0
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return fetchMoreResult;
      }
    });

    activityCreatedAt.current = newCutoff;
  }, [fetchMore]);

  if (loading) return <Loader />;
  if (error) return `Error! ${error.message}`;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: "15px" }}>
        <Row style={{ textAlign: "center" }}>
          <Col span={12} offset={6}>
            <Blockies
              seed={address.toLowerCase()}
              size={12}
              scale={6}
              className="artist_blockie"
            />
            <br />
            <Address
              value={address}
              ensProvider={props.mainnetProvider}
              blockie={false}
            />
          </Col>
        </Row>
      </div>

      <Tabs
        defaultActiveKey="1"
        size="large"
        type="card"
        style={{ textAlign: "center" }}
      >
        <TabPane tab="🖼️ Inks" key="1">
          <div className="inks-grid">
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
          </div>
        </TabPane>
        <TabPane tab="📈 Statistics" key="3">
          <div style={{ marginTop: "20px" }}>
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
          </div>
        </TabPane>
        <TabPane tab="🕗 Recent activity" key="4">
          {activity !== undefined && Object.values(activity).length > 0 ? (
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
          )}
        </TabPane>
        <TabPane tab="🔍 Search artists" key="5">
          <Row style={{ margin: 20 }}>
            <Col span={24}>
              <SearchForm />
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
