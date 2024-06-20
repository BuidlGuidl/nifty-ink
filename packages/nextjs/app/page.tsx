"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InkList } from "./_components/InkList";
import { useQuery } from "@apollo/client";
import { DatePicker, Form, Radio, Row, Select } from "antd";
import dayjs from "dayjs";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { EXPLORE_QUERY } from "~~/apollo/queries";

const { Option } = Select;

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [layout, setLayout] = useState<string>("cards");

  // let [allInks, setAllInks] = useState<Ink[]>([]);
  const [inks, setInks] = useState<Record<number, Ink>>({});

  const [forSale, setForSale] = useState<string>(searchParams.get("forSale") || "all-inks");
  const [startDate, setStartDate] = useState(
    searchParams.has("startDate") ? dayjs(searchParams.get("startDate")) : dayjs().subtract(29, "days"),
  );
  const [endDate, setEndDate] = useState(searchParams.has("endDate") ? dayjs(searchParams.get("endDate")) : dayjs());
  const [orderBy, setOrderBy] = useState<string>(searchParams.get("orderBy") || "createdAt");
  const [orderDirection, setOrderDirection] = useState<string>(searchParams.get("orderDirection") || "desc");

  const updateSearchParams = (names: string[], values: string[]) => {
    router.push(`${pathname}?${createQueryString(names, values)}`);
    // setInks({});
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
      first: 20,
      skip: 0,
      orderBy: orderBy,
      orderDirection: orderDirection,
      liker: connectedAddress ? connectedAddress.toLowerCase() : "",
      // filters: inkFilters
    },
  });

  const getMetadata = async (jsonURL: string): Promise<InkMetadata> => {
    const response = await fetch(`https://gateway.nifty.ink:42069/ipfs/${jsonURL}`);
    const data: InkMetadata = await response.json();
    console.log(data);
    data.image = data.image.replace("https://ipfs.io/ipfs/", "https://gateway.nifty.ink:42069/ipfs/");
    return data;
  };

  const onLoadMore = (skip: number) => {
    fetchMoreInks({
      variables: {
        first: 10,
        skip: skip,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return fetchMoreResult;
      },
    });
  };

  const getInks = async (data: Ink[]) => {
    // setAllInks(prevAllInks => [...prevAllInks, ...data]);
    // let blocklist;
    // if (props.supabase) {
    //   let { data: supabaseBlocklist } = await props.supabase
    //     .from("blocklist")
    //     .select("jsonUrl");
    //   blocklist = supabaseBlocklist;
    // }
    const newInks: Record<number, Ink> = {};
    for (const ink of data) {
      // if (isBlocklisted(ink.jsonUrl)) return;
      // if (blocklist && blocklist.find(el => el.jsonUrl === ink.jsonUrl)) {
      //   return;
      // }
      const metadata = await getMetadata(ink.jsonUrl);
      const _ink = { ...ink, metadata };
      newInks[_ink.inkNumber] = _ink;
    }
    setInks(prevInks => ({ ...prevInks, ...newInks }));
  };

  useEffect(() => {
    if (data && data.inks) {
      getInks(data.inks);
    } else {
      console.log("loading");
    }
  }, [data]);

  console.log(inks);

  return (
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

      <InkList
        inks={inks}
        orderDirection={orderDirection}
        orderBy={orderBy as keyof Ink}
        layout={layout}
        connectedAddress={connectedAddress}
        isInksLoading={isInksLoading}
        onLoadMore={onLoadMore}
      />
    </div>
  );
};

export default Home;
