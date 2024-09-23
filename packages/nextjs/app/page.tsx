"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InkList } from "./_components/InkList";
import { useQuery } from "@apollo/client";
import { DatePicker, Form, Radio, Row, Select } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { useDebounceValue } from "usehooks-ts";
import { useAccount } from "wagmi";
import { EXPLORE_QUERY, INK_LIKES_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { getMetadata } from "~~/utils/helpers";

const { Option } = Select;

const ITEMS_PER_PAGE = 15;

const HomeWithSuspense = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Home />
    </Suspense>
  );
};

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [layout, setLayout] = useState<string>("cards");

  // let [allInks, setAllInks] = useState<Ink[]>([]);
  const [inks, setInks] = useState<Record<number, Ink>>({});
  const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);
  const [firstLoading, setFirstLoading] = useState<boolean>(true);
  const [MoreInksLoading, setMoreInksLoading] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const debouncedScrollPosition = useDebounceValue<number>(scrollPosition, 300);

  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY + window.innerHeight);
  }, []);

  const [forSale, setForSale] = useState<string>(searchParams.get("forSale") || "all-inks");
  const [startDate, setStartDate] = useState(
    searchParams.has("startDate") ? dayjs(searchParams.get("startDate")) : dayjs("2020-08-03"),
  );
  const [endDate, setEndDate] = useState(searchParams.has("endDate") ? dayjs(searchParams.get("endDate")) : dayjs());
  const [orderBy, setOrderBy] = useState<string>(searchParams.get("orderBy") || "createdAt");
  const [orderDirection, setOrderDirection] = useState<string>(searchParams.get("orderDirection") || "desc");

  const [inkFilters, setInkFilters] = useState({
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

  const {
    loading: isInksLoading,
    data,
    fetchMore: fetchMoreInks,
  } = useQuery(EXPLORE_QUERY, {
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

  const {
    loading: likesLoading,
    error: likesError,
    data: likesData,
  } = useQuery(INK_LIKES_QUERY, {
    variables: {
      inks: debouncedInks,
      liker: connectedAddress ? connectedAddress.toLowerCase() : "",
    },
    pollInterval: 6000,
  });

  useEffect(() => {
    if (!MoreInksLoading && debouncedScrollPosition?.[0] >= document.body.scrollHeight - 300) {
      setMoreInksLoading(true);
      fetchMoreInks({
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
  }, [debouncedScrollPosition, fetchMoreInks]);

  const getInks = async (data: Ink[]) => {
    console.log("getting inks");
    const newInks: Record<number, Ink> = {};
    const newData = data.filter(ink => !inks[ink?.inkNumber]?.metadata);
    const hasMoreNewItems = newData?.length > ITEMS_PER_PAGE;
    if (!hasMoreNewItems) {
      setAllItemsLoaded(true);
    }

    for (const ink of newData.slice(0, ITEMS_PER_PAGE)) {
      if (inks[ink?.inkNumber]?.metadata) continue;
      const metadata = await getMetadata(ink.jsonUrl);
      const _ink = { ...ink, metadata };
      newInks[_ink.inkNumber] = _ink;
    }

    setInks(prevInks => ({ ...prevInks, ...newInks }));
    setMoreInksLoading(false);
    setFirstLoading(false);
  };

  useEffect(() => {
    if (data && data.inks) {
      getInks(data.inks);
    } else {
      console.log("loading");
    }
  }, [data]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="flex justify-center">
      <div className="max-w-screen-xl">
        <Row className="mt-5 mb-3 justify-center">
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
                      const _newFilters = {
                        createdAt_gt: dayjs(dateStrings[0]).unix(),
                        createdAt_lt: dayjs(dateStrings[1]).unix(),
                        burned: false,
                      };
                      setInks({});
                      setAllItemsLoaded(false);
                      setInkFilters(_newFilters);
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
                    <Option value={"for-sale"}>For sale</Option>
                    <Option value={"all-inks"}>All inks</Option>
                  </Select>
                </Form.Item>
              </>
            )}
          </Form>
        </Row>
        {firstLoading ? (
          <Loader />
        ) : (
          <InkList
            inks={inks}
            likesData={likesData?.inks}
            orderDirection={orderDirection}
            orderBy={orderBy as keyof Ink}
            layout={layout}
            connectedAddress={connectedAddress}
            MoreInksLoading={MoreInksLoading}
            // onLoadMore={onLoadMore}
            allItemsLoaded={allItemsLoaded}
          />
        )}
      </div>
    </div>
  );
};

export default HomeWithSuspense;
