"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InkList } from "./InkList";
import { useQuery } from "@apollo/client";
import { DatePicker, Form, Radio, Row, Select } from "antd";
import dayjs from "dayjs";
import { useDebounceValue } from "usehooks-ts";
import { useAccount } from "wagmi";
import { EXPLORE_QUERY, INK_LIKES_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import useInfiniteScroll from "~~/hooks/useInfiniteScroll";
import { getMetadata } from "~~/utils/helpers";

const { Option } = Select;

const ITEMS_PER_PAGE = 15;

type QueryFilter = {
  createdAt_gt: number;
  createdAt_lt: number;
  burned: boolean;
  bestPrice_gt?: string;
};

const ExploreGnosisInks = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [layout, setLayout] = useState<string>("cards");

  // let [allInks, setAllInks] = useState<Ink[]>([]);
  const [inks, setInks] = useState<Record<number, Ink>>({});
  const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);
  const [firstLoading, setFirstLoading] = useState<boolean>(true);
  const [moreInksLoading, setMoreInksLoading] = useState<boolean>(false);

  const [forSale, setForSale] = useState<string>(searchParams.get("forSale") || "all-inks");
  const [startDate, setStartDate] = useState(
    searchParams.has("startDate") ? dayjs(searchParams.get("startDate")) : dayjs("2021-08-03"),
  );
  const [endDate, setEndDate] = useState(searchParams.has("endDate") ? dayjs(searchParams.get("endDate")) : dayjs());
  const [orderBy, setOrderBy] = useState<string>(searchParams.get("orderBy") || "createdAt");
  const [orderDirection, setOrderDirection] = useState<string>(searchParams.get("orderDirection") || "desc");

  const [inkFilters, setInkFilters] = useState<QueryFilter>({
    createdAt_gt: startDate.unix(),
    createdAt_lt: endDate.unix(),
    burned: false,
  });

  const updateSearchParams = (names: string[], values: string[]) => {
    router.push(`${pathname}?${createQueryString(names, values)}`);
    setInks({});
  };

  const createQueryString = useCallback(
    (names: string[], values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      names.map((name, index) => params.set(name, values[index]));
      return params.toString();
    },
    [searchParams],
  );

  const { data, fetchMore: fetchMoreInks } = useQuery(EXPLORE_QUERY, {
    variables: {
      first: ITEMS_PER_PAGE + 1,
      skip: 0,
      orderBy: orderBy,
      orderDirection: orderDirection,
      liker: connectedAddress ? connectedAddress.toLowerCase() : "",
      filters: inkFilters,
    },
  });

  const debouncedInks = useDebounceValue(
    Object.keys(inks).map(x => parseInt(x)),
    2000,
  );

  const { data: likesData } = useQuery(INK_LIKES_QUERY, {
    variables: {
      inks: debouncedInks?.[0],
      liker: connectedAddress ? connectedAddress.toLowerCase() : "",
    },
    pollInterval: 6000,
  });

  const getInks = async (data: Ink[]) => {
    console.log("Fetching new inks");

    // Timeout function that rejects after a set time
    const withTimeout = (promise: Promise<any>, ms: number) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
      ]);
    };

    try {
      // Filter out inks that already have metadata
      const inksToFetch = data.filter(ink => !inks[ink?.inkNumber]?.metadata);

      // Check if there are more items to load based on the limit
      if (inksToFetch.length <= ITEMS_PER_PAGE) {
        setAllItemsLoaded(true);
      }

      // Fetch metadata with a 5-second timeout for each ink
      const fetchedInks = await Promise.all(
        inksToFetch.slice(0, ITEMS_PER_PAGE).map(async ink => {
          try {
            const metadata = await withTimeout(getMetadata(ink.jsonUrl), 5000); // 5 seconds timeout
            return { ...ink, metadata };
          } catch (error) {
            console.error(`Error fetching metadata for ink ${ink.inkNumber}:`, error);
            return { ...ink, metadata: null }; // Handle failed fetch
          }
        }),
      );

      // Update the state with newly fetched inks
      setInks(prevInks => {
        const newInks = fetchedInks.reduce((acc, ink) => {
          acc[ink.inkNumber] = ink;
          return acc;
        }, {} as Record<number, Ink>);

        return { ...prevInks, ...newInks };
      });
    } catch (error) {
      console.error("Error fetching inks or metadata:", error);
    } finally {
      // Ensure loading states are updated even if there was an error
      setMoreInksLoading(false);
      setFirstLoading(false);
    }
  };

  const loadMoreInks = async () => {
    if (!moreInksLoading) {
      setMoreInksLoading(true);
      await fetchMoreInks({
        variables: {
          skip: Object.values(inks).length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            inks: [...prev?.inks, ...fetchMoreResult?.inks],
          };
        },
      });
    }
  };

  useEffect(() => {
    if (data && data.inks) {
      getInks(data.inks);
    } else {
      console.log("loading");
    }
  }, [data]);

  useEffect(() => {
    const newFilters: QueryFilter = {
      createdAt_gt: startDate.unix(),
      createdAt_lt: endDate.unix(),
      burned: false,
      ...(forSale === "for-sale" && { bestPrice_gt: "0" }), // Conditionally add the price filter
    };

    setInkFilters(newFilters);
  }, [forSale, startDate, endDate]);

  useInfiniteScroll(loadMoreInks, Object.values(inks).length);

  return (
    <div className="flex justify-center">
      <div className="max-w-screen-xl">
        {firstLoading ? (
          <Loader />
        ) : (
          <>
            <Row className="mt-2 mb-3 justify-center">
              <Form
                layout={"inline"}
                initialValues={{
                  layout: layout,
                  dateRange: [startDate, endDate],
                  orderBy: orderBy,
                  orderDirection: orderDirection,
                  forSale: forSale,
                }}
              >
                <Form.Item name="layout">
                  <Radio.Group
                    size="large"
                    value={layout}
                    onChange={v => {
                      setLayout(v.target.value);
                    }}
                  >
                    <Radio.Button value={"cards"}>Cards</Radio.Button>
                    <Radio.Button value={"tiles"}>Tiles</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                {layout == "cards" && (
                  <>
                    <Form.Item name="dateRange">
                      <DatePicker.RangePicker
                        size="large"
                        value={[startDate, endDate]}
                        onChange={(moments, dateStrings) => {
                          updateSearchParams(["startDate", "endDate"], [dateStrings[0], dateStrings[1]]);
                          setStartDate(dayjs(dateStrings[0]));
                          setEndDate(dayjs(dateStrings[1]));
                          setInks({});
                          setAllItemsLoaded(false);
                        }}
                      />
                    </Form.Item>
                    <Form.Item name="orderBy">
                      <Select
                        value={orderBy}
                        size="large"
                        onChange={val => {
                          updateSearchParams(["orderBy"], [val]);
                          setOrderBy(val);
                        }}
                      >
                        <Option value="createdAt">Created At</Option>
                        <Option value="bestPrice">Price</Option>
                        <Option value="likeCount">Likes</Option>
                        <Option value="count">Token Count</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="orderDirection">
                      <Select
                        value={orderDirection}
                        style={{ width: 120 }}
                        size="large"
                        onChange={val => {
                          updateSearchParams(["orderDirection"], [val]);
                          setOrderDirection(val);
                        }}
                      >
                        <Option value="desc">Descending</Option>
                        <Option value="asc">Ascending</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="forSale">
                      <Select
                        value={forSale}
                        style={{ width: 120 }}
                        size="large"
                        onChange={val => {
                          updateSearchParams(["forSale"], [val]);
                          setForSale(val);
                        }}
                      >
                        <Option value={"all-inks"}>All inks</Option>
                        <Option value={"for-sale"}>For sale</Option>
                      </Select>
                    </Form.Item>
                  </>
                )}
              </Form>
            </Row>
            <InkList
              inks={inks}
              likesData={likesData?.inks}
              orderDirection={orderDirection}
              orderBy={orderBy as keyof Ink}
              layout={layout}
              connectedAddress={connectedAddress}
              moreInksLoading={moreInksLoading}
              allItemsLoaded={allItemsLoaded}
              loadMoreInks={loadMoreInks}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ExploreGnosisInks;
