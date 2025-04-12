"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { emojifyTop3 } from "../utils";
import { useQuery } from "@apollo/client";
import { Col, Form, Row, Select } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { TOP_ARTISTS_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { Address } from "~~/components/scaffold-eth";
import "~~/styles/leaderboard.css";

const { Option } = Select;

const Home: NextPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  // const searchParams = useSearchParams();

  const [artists, setArtists] = useState<Artist[]>([]);
  // const [orderBy, setOrderBy] = useState<string>(searchParams.get("orderBy") || "earnings");
  // const [period, setPeriod] = useState<string>(searchParams.get("period") || "lastmonth");
  const [orderBy, setOrderBy] = useState<string>("inkCount");
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
    if (data) {
      period === "alltime" ? setArtists(data.artists) : updateArtistStats(data.artists);
    }
  }, [data, period]);

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

  const updateArtistStats = (_artists: any[]): void => {
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

  // const createQueryString = useCallback(
  //   (name: string, value: string) => {
  //     const params = new URLSearchParams(searchParams.toString());
  //     params.set(name, value);

  //     return params.toString();
  //   },
  //   [searchParams],
  // );

  const handleOrderByChange = (val: string) => {
    // router.push(pathname + "?" + createQueryString("orderBy", val));
    setArtists([]);
    setOrderBy(val);
  };

  const handlePeriodChange = (val: string) => {
    // router.push(pathname + "?" + createQueryString("period", val));
    setArtists([]);
    setPeriod(val);
  };

  if (error) return `Error! ${error.message}`;

  return (
    <div className="flex justify-center">
      <div className="max-w-screen-xl">
        <Row align="top" gutter={16} className="mt-5 text-center justify-center">
          <Col>
            <p className="text-2xl m-0">Artists</p>
          </Col>
          <Col>
            <Form layout={"inline"} initialValues={{ orderBy: orderBy, period: period }}>
              <Form.Item name="orderBy">
                <Select value={orderBy} size="large" className="min-w-28" onChange={handleOrderByChange}>
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
        {loading ? (
          <Loader />
        ) : (
          <div className="flex justify-center">
            <div className="artists-leaderboard">
              <ul>
                {artists.length > 0
                  ? artists.map((artist, i) => (
                      <li key={artist?.address} className="artists-leadboard-entry">
                        <div className="artists-leadboard-entry-rank">
                          <h3>{emojifyTop3(i + 1)}</h3>
                        </div>
                        <div className="artists-leadboard-entry-address">
                          <Link href={`/artist/${artist?.address}`}>
                            <Address key={artist?.address} address={artist.address} disableAddressLink={true} />
                          </Link>
                        </div>
                        <div className="artists-leadboard-entry-stats">
                          <p>💲 Earnings: ${parseFloat(formatUnits(artist?.earnings || 0n, 18)).toFixed(2)}</p>
                          <p>🖼️ Total Inks: {artist.inkCount}</p>
                          <p>👍 Total likes: {artist.likeCount}</p>
                        </div>
                      </li>
                    ))
                  : null}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
