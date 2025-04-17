"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RocketOutlined } from "@ant-design/icons";
import { ApolloClient, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Button, Switch } from "antd";
import { HOLDINGS_MAIN_INKS_QUERY, HOLDINGS_MAIN_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";
import { getMetadata } from "~~/utils/helpers";

const mainClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_MAINNET,
  headers: {
    Authorization: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_AUTH || "",
  },
  cache: new InMemoryCache(),
});

export const MainnetChainInks = ({ address, connectedAddress }: { address: string; connectedAddress: string }) => {
  const [tokens, setTokens] = useState<Token[]>([]); // Object holding information about relevant tokens
  const [holderCreationOnly, setHolderCreationOnly] = useState<boolean>(false);

  const {
    loading: loadingMain,
    error: errorMain,
    data: dataRaw,
  } = useQuery(HOLDINGS_MAIN_QUERY, {
    variables: { owner: address },
    client: mainClient,
    pollInterval: 15000,
  });

  const [mainInksQuery, { loading: loadingMainInks, error: errorMainInks, data: dataMainInks }] =
    useLazyQuery(HOLDINGS_MAIN_INKS_QUERY);

  const getTokens = async (data: Token[], inks: Ink[]): Promise<void> => {
    try {
      const processedTokens: Token[] = await Promise.all(
        data.map(async token => {
          const _token = Object.assign({}, token);
          const _tokenInk = inks.filter(ink => ink.id === (token.ink as unknown as string));
          _token.ink = _tokenInk[0];

          const updatedToken = {
            ..._token,
            network: "mainnet",
            ink: {
              ..._token.ink,
              metadata: await getMetadata(_token.ink.jsonUrl),
            },
          };

          return updatedToken;
        }),
      );

      if (processedTokens.length > 0) {
        setTokens(tokens => {
          const tokenIds = new Set(tokens.map(token => token.id));
          const filteredProcessedTokens = processedTokens.filter(token => !tokenIds.has(token.id));
          return [...tokens, ...filteredProcessedTokens];
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    dataRaw ? getMainInks(dataRaw.tokens) : console.log("loading main inks");
  }, [dataRaw]);

  useEffect(() => {
    dataRaw && dataMainInks ? getTokens(dataRaw?.tokens, dataMainInks.inks) : console.log("loading tokens");
    if (dataRaw) console.log(dataRaw?.tokens);
  }, [dataMainInks]);

  const getMainInks = async (_data: Token[]) => {
    const _inkList = _data.map(a => a.ink);
    await mainInksQuery({
      variables: { inkList: _inkList },
    });
  };

  if (loadingMain || loadingMainInks) return <Loader />;

  return (
    <div className={`flex flex-col justify-center ${TEXT_PRIMARY_COLOR}`}>
      <div className="flex justify-center gap-8 text-center mb-5">
        <div>
          <b>All Holdings:</b> {dataRaw && dataRaw.tokens ? parseInt(dataRaw.tokens.length) : 0}
        </div>
        <div>
          {`Created by ${connectedAddress == address ? "me" : "holder"}:  `}
          <Switch
            defaultChecked={holderCreationOnly}
            onChange={() => {
              setHolderCreationOnly(!holderCreationOnly);
            }}
          />
        </div>
      </div>

      <div className="max-w-xl">
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {tokens &&
            tokens
              .sort(function (a, b) {
                return Number(b.id) - Number(a.id);
              })
              .filter(token => !holderCreationOnly || token.ink.artist.address === address.toLowerCase())
              .map((token, id) => (
                <li
                  key={id}
                  style={{
                    display: "inline-block",
                    verticalAlign: "top",
                    margin: 4,
                    padding: 5,
                    border: "1px solid #e5e5e6",
                    borderRadius: "10px",
                    fontWeight: "bold",
                  }}
                >
                  <Link href={{ pathname: "/ink/" + token.ink.id }} className={`${TEXT_PRIMARY_COLOR}`}>
                    <Image
                      src={token?.ink?.metadata?.image as string}
                      alt={token?.ink?.metadata?.name as string}
                      width="150"
                      height="150"
                      style={{
                        border: "1px solid #e5e5e6",
                        borderRadius: "10px",
                      }}
                    />
                    <h3
                      style={{
                        margin: "10px 0px 5px 0px",
                        fontWeight: "700",
                      }}
                    >
                      {token?.ink?.metadata && token?.ink?.metadata?.name?.length > 18
                        ? token.ink.metadata?.name.slice(0, 15).concat("...")
                        : token.ink.metadata?.name}
                    </h3>

                    <p className="m-0 scale-90">
                      Edition: {token.ink.count}/{token.ink.limit}
                    </p>
                  </Link>
                  <div className="flex flex-col gap-0">
                    {tokens[id].network === "mainnet" && (
                      <Button
                        type="primary"
                        size="small"
                        style={{
                          margin: 8,
                          background: "#722ed1",
                          borderColor: "#722ed1",
                        }}
                        onClick={() => {
                          window.open(
                            "https://opensea.io/assets/0xc02697c417ddacfbe5edbf23edad956bc883f4fb/" + token.id,
                          );
                        }}
                        icon={<RocketOutlined />}
                      >
                        View on OpenSea
                      </Button>
                    )}
                  </div>
                </li>
              ))}
        </ul>
      </div>
    </div>
  );
};
