"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { Col, Form, Row, Select, Typography } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { TOP_ARTISTS_QUERY } from "~~/apollo/queries";
import { Address } from "~~/components/scaffold-eth";

const { Option } = Select;

const Home: NextPage = () => {
  const router = useRouter();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [orderBy, setOrderBy] = useState<string>("earnings");
  const [period, setPeriod] = useState<string>("lastmonth");
  const [createdAt, setCreatedAt] = useState<number>(1596240000);
  const [lastFilterAt, setLastFilterAt] = useState<{ [key: string]: number }>({ lastSaleAt_gt: 1596240000 });

  const { loading, error, data } = useQuery(TOP_ARTISTS_QUERY, {
    variables: {
      first: 50,
      skip: 0,
      orderBy: orderBy,
      orderDirection: "desc",
      createdAt: createdAt,
      filters: lastFilterAt,
    },
  });

  useEffect(() => {
    console.log("HI");
    if (data) {
      console.log("HI");
      if (period === "alltime") {
        console.log("HI");
        setArtists(data.artists);
      } else {
        console.log("HI");
        artistStats(data.artists);
      }
    }
  }, [data]);

  useEffect(() => {
    if (period === "alltime") {
      setCreatedAt(1596240000);
    } else if (period === "lastmonth") {
      setCreatedAt(dayjs().subtract(30, "days").unix());
    } else if (period === "lastweek") {
      setCreatedAt(dayjs().subtract(7, "days").unix());
    }
  }, [period, setPeriod]);

  useEffect(() => {
    let _lastFilterAt;
    if (orderBy === "earnings") {
      _lastFilterAt = { lastSaleAt_gt: createdAt };
    } else if (orderBy === "likeCount") {
      _lastFilterAt = { lastLikeAt_gt: createdAt };
    } else if (orderBy === "inkCount") {
      _lastFilterAt = { lastInkAt_gt: createdAt };
    }
    setLastFilterAt(_lastFilterAt!);
  }, [createdAt, orderBy, setOrderBy]);

  const emojifyTop3 = (rank: number): string => {
    if (rank === 1) {
      return rank + " 🏆";
    } else if (rank === 2) {
      return rank + " 🥈";
    } else if (rank === 3) {
      return rank + " 🥉";
    } else {
      return rank.toString();
    }
  };

  const artistStats = (_artists: any[]): void => {
    const artistsPlaceholder = _artists.map(artist => {
      return {
        address: artist.address,
        earnings: artist.sales.map((e: any) => parseInt(e.price)).reduce((a: any, b: any) => a + b, 0),
        likeCount: artist.likes.length,
        inkCount: artist.inks.length,
      };
    });

    switch (orderBy) {
      case "earnings":
        setArtists(artistsPlaceholder.sort((a, b) => a.earnings - b.earnings).reverse() as Artist[]);
        break;
      case "likeCount":
        setArtists(artistsPlaceholder.sort((a, b) => a.likeCount - b.likeCount).reverse() as Artist[]);
        break;
      case "inkCount":
        setArtists(artistsPlaceholder.sort((a, b) => a.inkCount - b.inkCount).reverse() as Artist[]);
        break;
      default:
        setArtists(artistsPlaceholder.sort((a, b) => a.earnings - b.earnings).reverse() as Artist[]);
    }
  };

  const handleOrderByChange = (val: string) => {
    // searchParams.set("orderBy", val);
    // history.push(`${location.pathname}?${searchParams.toString()}`);
    setArtists([]);
    setOrderBy(val);
  };

  const handlePeriodChange = (val: string) => {
    // searchParams.set("period", val);
    // history.push(`${location.pathname}?${searchParams.toString()}`);
    setArtists([]);
    setPeriod(val);
  };

  //   if (loading) return <Loader />;
  if (error) return `Error! ${error.message}`;

  return (
    <div className="max-w-screen-xl">
      <Row align="top" gutter={16} className="mt-5 text-center justify-center">
        <Col>
          <Typography.Title level={3}>Artists</Typography.Title>
        </Col>
        <Col>
          <Form layout={"inline"} initialValues={{ orderBy: orderBy, period: period }}>
            <Form.Item name="orderBy">
              <Select value={orderBy} size="large" onChange={handleOrderByChange}>
                <Option value="earnings">Sales</Option>
                <Option value="likeCount">Likes</Option>
                <Option value="inkCount">Inks count</Option>
              </Select>
            </Form.Item>
            <Form.Item name="period">
              <Select value={period} size="large" onChange={handlePeriodChange}>
                <Option value="alltime">All-time</Option>
                <Option value="lastmonth">Last 30 days</Option>
                <Option value="lastweek">Last 7 days</Option>
              </Select>
            </Form.Item>
          </Form>
        </Col>
      </Row>
      <Row justify="center">
        <div className="py-4 px-2.5">
          <ul>
            {artists.length > 0
              ? artists.map((artist, i) => (
                  <li key={artist?.address} className="flex items-center border border-gray-200 rounded-lg mb-1.5">
                    <div className="w-16 py-3 px-2.5 mx-2.5">
                      <h3 className="font-bold">{emojifyTop3(i + 1)}</h3>
                    </div>

                    <div className="w-52 transform scale-60">
                      <Link href={`/artist/${artist?.address}`}>
                        <Address address={artist.address} disableAddressLink={true} />
                      </Link>
                    </div>
                    <div className="text-xs py-1.5 px-5">
                      <p className="m-0">
                        💲 Earnings: ${parseFloat(formatUnits(artist?.earnings || 0n, 18)).toFixed(2)}
                      </p>
                      <p className="m-0">🖼️ Total Inks: {artist.inkCount}</p>
                      <p className="m-0">👍 Total likes: {artist.likeCount}</p>
                    </div>
                  </li>
                ))
              : null}
          </ul>
        </div>
      </Row>
    </div>
  );
};

export default Home;
