"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { emojifyTop3 } from "../utils";
import { useQuery } from "@apollo/client";
import { Col, Form, Row, Select } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { TOP_COLLECTORS_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { Address } from "~~/components/scaffold-eth";
import "~~/styles/leaderboard.css";

const { Option } = Select;

const Home: NextPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  // const searchParams = useSearchParams();

  const [collectors, setCollectors] = useState<User[]>([]);
  // const [orderBy, setOrderBy] = useState<string>(searchParams.get("orderBy") || "collectionCount");
  // const [period, setPeriod] = useState<string>(searchParams.get("period") || "lastmonth");

  const [orderBy, setOrderBy] = useState<string>("collectionCount");
  const [period, setPeriod] = useState<string>("lastmonth");
  const [createdAt, setCreatedAt] = useState<number>(1596240000);
  const [lastFilterAt, setLastFilterAt] = useState<{ [key: string]: number }>({ lastSaleAt_gt: 1596240000 });

  const { loading, error, data } = useQuery(TOP_COLLECTORS_QUERY, {
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
      period === "alltime" ? setCollectors(data.users) : updateCollectorStats(data.users);
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
    if (orderBy === "tokenCount") {
      _lastFilterAt = { lastTransferAt_gt: createdAt };
    } else if (orderBy === "saleCount") {
      _lastFilterAt = { lastSaleAt_gt: createdAt };
    } else if (orderBy === "purchaseCount") {
      _lastFilterAt = { lastPurchaseAt_gt: createdAt };
    } else if (orderBy === "collectionCount") {
      _lastFilterAt = { lastTransferAt_gt: createdAt };
    }
    setLastFilterAt(_lastFilterAt!);
  }, [createdAt, orderBy, setOrderBy]);

  const updateCollectorStats = (_collectors: any[]): void => {
    const collectorsPlaceholder = _collectors.map(collector => {
      return {
        address: collector.address,
        tokenCount: collector.tokens.length,
        saleCount: collector.sales.length,
        purchaseCount: collector.purchases.length,
        collectionCount: collector.collectedTokens.length,
      };
    });

    switch (orderBy) {
      case "saleCount":
        setCollectors(collectorsPlaceholder.sort((a, b) => a.saleCount - b.saleCount).reverse());
        break;
      case "purchaseCount":
        setCollectors(collectorsPlaceholder.sort((a, b) => a.purchaseCount - b.purchaseCount).reverse());
        break;
      case "tokenCount":
        setCollectors(collectorsPlaceholder.sort((a, b) => a.tokenCount - b.tokenCount).reverse());
        break;
      case "collectionCount":
        setCollectors(collectorsPlaceholder.sort((a, b) => a.collectionCount - b.collectionCount).reverse());
        break;
      default:
        setCollectors(collectorsPlaceholder.sort((a, b) => a.collectionCount - b.collectionCount).reverse());
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
    setCollectors([]);
    setOrderBy(val);
  };

  const handlePeriodChange = (val: string) => {
    // router.push(pathname + "?" + createQueryString("period", val));
    setCollectors([]);
    setPeriod(val);
  };

  if (error) return `Error! ${error.message}`;

  return (
    <div className="flex justify-center">
      <div className="max-w-screen-xl">
        <Row align="top" gutter={16} className="mt-5 text-center justify-center">
          <Col>
            <p className="text-2xl m-0">Collectors</p>
          </Col>
          <Col>
            <Form layout={"inline"} initialValues={{ orderBy: orderBy, period: period }}>
              <Form.Item name="orderBy">
                <Select value={orderBy} size="large" className="min-w-28" onChange={handleOrderByChange}>
                  <Option value="collectionCount">Collected</Option>
                  <Option value="saleCount">Sale count</Option>
                  <Option value="purchaseCount">Purchase count</Option>
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
                {collectors.length > 0
                  ? collectors
                      .filter(
                        collector =>
                          collector.address !== "0x000000000000000000000000000000000000dead" &&
                          collector.address !== "0xdead000000000000000042069420694206942069",
                      )
                      .map((artist, i) => (
                        <li key={artist.address} className="artists-leadboard-entry">
                          <div className="artists-leadboard-entry-rank">
                            <h3>{emojifyTop3(i + 1)}</h3>
                          </div>

                          <div className="artists-leadboard-entry-address">
                            <Link href={`/artist/${artist?.address}`}>
                              <Address key={artist?.address} address={artist.address} disableAddressLink={true} />
                            </Link>
                          </div>
                          <div className="artists-leadboard-entry-stats">
                            <p>
                              <span role="img" aria-label="Framed Picture">
                                🖼️
                              </span>{" "}
                              Total collected: {artist.collectionCount}
                            </p>
                            <p>
                              <span role="img" aria-label="Framed Picture">
                                💰
                              </span>{" "}
                              Sale count: {artist.saleCount}
                            </p>
                            <p>
                              <span role="img" aria-label="Framed Picture">
                                💸
                              </span>{" "}
                              Purchase count: {artist.purchaseCount}
                            </p>
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
