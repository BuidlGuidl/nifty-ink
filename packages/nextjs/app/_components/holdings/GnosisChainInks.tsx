"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Popover, Row } from "antd";
import { FIRST_HOLDING_QUERY, HOLDINGS_MAIN_QUERY, HOLDINGS_QUERY } from "~~/apollo/queries";
import { Address } from "~~/components/scaffold-eth";
import { getMetadata } from "~~/utils/helpers";

interface Token {
  id: string;
  network?: string;
  ink: Ink;
  owner: { id: string; __typename: string };
}

export const GnosisChainInks = ({ address }: { address: string }) => {
  const [data, setData] = useState<any>(); // Data filtered for latest block update that we have seen
  const [tokens, setTokens] = useState<Token[]>([]); // Object holding information about relevant tokens

  const {
    loading,
    error,
    data: dataRaw,
    fetchMore,
  } = useQuery(HOLDINGS_QUERY, {
    variables: {
      first: 15,
      skip: 0,
      orderBy: "createdAt",
      orderDirection: "desc",
      owner: address.toLowerCase(),
    },
  });

  const {
    loading: loadingFirst,
    error: errorFirst,
    data: firstActivity,
  } = useQuery(FIRST_HOLDING_QUERY, {
    variables: {
      owner: address.toLowerCase(),
    },
  });

  console.log(firstActivity);

  useEffect(() => {
    const getHoldings = async (_data: any) => {
      const _blockNumber = parseInt(_data.metaData.value);
      console.log(_blockNumber);
      //   if (_blockNumber >= blockNumber) {
      setData(_data);
      //   setBlockNumber(_blockNumber);
      //   }
    };

    dataRaw ? getHoldings(dataRaw) : console.log("loading data");
  }, [dataRaw]);

  const getTokens = async (data: Token[]): Promise<void> => {
    try {
      const processedTokens: Token[] = await Promise.all(
        data.map(async token => {
          const updatedToken = {
            ...token,
            network: "xDai",
            ink: {
              ...token.ink,
              metadata: await getMetadata(token.ink.jsonUrl),
            },
          };

          return updatedToken;
        }),
      );

      if (processedTokens.length > 0) {
        setTokens(tokens => [...tokens, ...processedTokens]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    data ? getTokens(data?.tokens) : console.log("loading tokens");
    if (data) console.log(data?.tokens);
  }, [data]);

  console.log(dataRaw);
  console.log(data);
  console.log(tokens);
  return (
    <div className="flex justify-center ">
      <div className="inks-grid max-w-xl">
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {tokens
            ? tokens
                .sort(function (a, b) {
                  return Number(b.id) - Number(a.id);
                })
                // .filter(id => id in tokens)
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
                    <Link href={{ pathname: "/ink/" + token.ink.id }} style={{ color: "black" }}>
                      <img
                        src={token?.ink?.metadata?.image}
                        alt={token?.ink?.metadata?.name}
                        width="150"
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

                      <p style={{ color: "#5e5e5e", margin: "0", zoom: 0.8 }}>
                        Edition: {token.ink.count}/{token.ink.limit}
                      </p>
                    </Link>
                    {/* <Row justify={"center"}>
                      {tokens[id].network === "xDai" ? (
                        <>
                          {address == props.address && (
                            <>
                              <Popover
                                content={
                                  <SendInkForm
                                    tokenId={tokens[id].id}
                                    address={props.address}
                                    mainnetProvider={props.mainnetProvider}
                                    injectedProvider={props.injectedProvider}
                                    transactionConfig={props.transactionConfig}
                                  />
                                }
                                title="Send Ink"
                              >
                                <Button size="small" type="secondary" style={{ margin: 4, marginBottom: 12 }}>
                                  <SendOutlined /> Send
                                </Button>
                              </Popover>
                              <UpgradeInkButton
                                tokenId={tokens[id].id}
                                injectedProvider={props.injectedProvider}
                                gasPrice={props.gasPrice}
                                upgradePrice={props.upgradePrice}
                                transactionConfig={props.transactionConfig}
                                buttonSize="small"
                              />
                            </>
                          )}
                          <NiftyShop
                            injectedProvider={props.injectedProvider}
                            metaProvider={props.metaProvider}
                            type={"token"}
                            ink={tokens[id].ink.id}
                            itemForSale={tokens[id].id}
                            gasPrice={props.gasPrice}
                            address={props.address ? props.address.toLowerCase() : null}
                            ownerAddress={address.toLowerCase()}
                            price={tokens[id].price}
                            visible={true}
                            transactionConfig={props.transactionConfig}
                            buttonSize="small"
                          />
                        </>
                      ) : (
                        <Button
                          type="primary"
                          style={{
                            margin: 8,
                            background: "#722ed1",
                            borderColor: "#722ed1",
                          }}
                          onClick={() => {
                            console.log("item", id);
                            window.open("https://opensea.io/assets/0xc02697c417ddacfbe5edbf23edad956bc883f4fb/" + id);
                          }}
                        >
                          <RocketOutlined /> View on OpenSea
                        </Button>
                      )}
                    </Row> */}
                  </li>
                ))
            : null}
        </ul>
      </div>
    </div>
  );
};
