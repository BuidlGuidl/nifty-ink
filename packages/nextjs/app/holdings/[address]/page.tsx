"use client";

import { useQuery } from "@apollo/client";
import { DatePicker, Divider, Form, Row, Select, Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { EXPLORE_QUERY, HOLDINGS_MAIN_INKS_QUERY, HOLDINGS_MAIN_QUERY, HOLDINGS_QUERY } from "~~/apollo/queries";
import { Profile } from "~~/app/_components/Profile";
import { SearchAddress } from "~~/app/_components/SearchAddress";

const { Option } = Select;

interface Token {
  id: string;
  network?: string;
  ink: Ink;
}

const Holdings = ({ params }: { params: { address: string } }) => {
  const address = params?.address;
  console.log(address);

  const {
    loading: loadingMain,
    error: errorMain,
    data: dataMain,
  } = useQuery(HOLDINGS_MAIN_QUERY, {
    variables: { owner: address },
    // client: mainClient,
    pollInterval: 15000,
  });

  // const [
  //   mainInksQuery,
  //   { loading: loadingMainInks, error: errorMainInks, data: dataMainInks }
  // ] = useLazyQuery(HOLDINGS_MAIN_INKS_QUERY);

  const {
    loading,
    error,
    data: dataRaw,
    fetchMore,
  } = useQuery(HOLDINGS_QUERY, {
    variables: {
      first: 16,
      skip: 0,
      orderBy: "createdAt",
      orderDirection: "desc",
      owner: address.toLowerCase(),
    },
    pollInterval: 4000,
  });

  console.log(dataRaw);
  console.log(dataMain);
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

  const getTokens = async (_data: Token[]): Promise<void> => {
    const chunkedData: Token[][] = [];
    const size = 10;

    for (let i = 0; i < _data.length; i += size) {
      const chunk = _data.slice(i, i + size);
      chunkedData.push(chunk);
    }

    for (const _dataChunk of chunkedData) {
      try {
        console.log(`running chunk ${chunkedData.indexOf(_dataChunk)}`);
        // await Promise.all(
        //   _dataChunk.map(async (token) => {
        //     if (!tokens[token.id]) {
        //       skipper.current += 1;
        //     }
        //     if (isBlocklisted(token.ink.jsonUrl)) return;
        //     token.network = 'xDai';
        //     token.ink.metadata = await getMetadata(token.ink.jsonUrl);

        //     const _newToken: { [key: string]: Token } = { [token.id]: token };
        //     setTokens((prevTokens) => ({ ...prevTokens, ..._newToken }));
        //   })
        // );
      } catch (e) {
        console.log(e);
      }
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const getMainInks = async (_data: any[]): Promise<void> => {
    // const _inkList: Ink[] = _data.map((a) => a.ink);
    // const mainInks = await mainInksQuery({
    //   variables: { inkList: _inkList }
    // });
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
    <div className="min-w-xl">
      <Profile address={address} />

      <Divider className="border-gray-300 min-w-4" />

      <SearchAddress redirectToPage="artist" />

      <Tabs defaultActiveKey="1" size="large" type="card" className="flex items-center mt-5">
        <TabPane tab="Gnosis Chain" key="1">
          {/* <InkListArtist inks={inks} isInksLoading={false} onLoadMore={(skip: number) => undefined} /> */}
        </TabPane>
        <TabPane tab="Ethereum Mainnet" key="2"></TabPane>
      </Tabs>
    </div>
  );
};

export default Holdings;
