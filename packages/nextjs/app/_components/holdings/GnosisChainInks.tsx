"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RocketOutlined, SendOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Popover, Row } from "antd";
import { FIRST_HOLDING_QUERY, HOLDINGS_QUERY } from "~~/apollo/queries";
import { getMetadata } from "~~/utils/helpers";

interface Token {
  id: string;
  network?: string;
  ink: Ink;
  owner: { id: string; __typename: string };
}

export const GnosisChainInks = ({ address }: { address: string }) => {
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
    data: firstHoldingActivity,
  } = useQuery(FIRST_HOLDING_QUERY, {
    variables: {
      owner: address.toLowerCase(),
    },
  });

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
    dataRaw ? getTokens(dataRaw?.tokens) : console.log("loading tokens");
    if (dataRaw) console.log(dataRaw?.tokens);
  }, [dataRaw]);

  const onLoadMore = () => {
    fetchMore({
      variables: {
        skip: tokens.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return fetchMoreResult;
      },
    });
  };

  return (
    <div className="flex justify-center ">
      <div className="inks-grid max-w-xl">
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {tokens
            ? tokens
                .sort(function (a, b) {
                  return Number(b.id) - Number(a.id);
                })
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
                    <Row justify={"center"}>
                      {tokens[id].network === "xDai" ? (
                        <>
                          {address == address && (
                            <>
                              <Popover
                                // content={
                                //   <SendInkForm
                                //     tokenId={tokens[id].id}
                                //     address={props.address}
                                //     mainnetProvider={props.mainnetProvider}
                                //     injectedProvider={props.injectedProvider}
                                //     transactionConfig={props.transactionConfig}
                                //   />
                                // }
                                placement="left"
                                title="Send Ink"
                              >
                                <Button size="small" icon={<SendOutlined />} className="m-1 mb-2">
                                  Send
                                </Button>
                              </Popover>
                              <Button size="small" disabled className="m-1 mb-2">
                                Upgrade
                              </Button>
                              {/* <UpgradeInkButton
                                tokenId={tokens[id].id}
                                injectedProvider={props.injectedProvider}
                                gasPrice={props.gasPrice}
                                upgradePrice={props.upgradePrice}
                                transactionConfig={props.transactionConfig}
                                buttonSize="small"
                              /> */}
                            </>
                          )}
                          {/* <NiftyShop
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
                          /> */}
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
                    </Row>
                  </li>
                ))
            : null}
        </ul>
        {tokens[tokens.length - 1]?.ink?.id !== firstHoldingActivity?.tokens?.[0]?.ink?.id && (
          <Button type="dashed" size="large" block className="mt-5 flex items-center" onClick={() => onLoadMore()}>
            Load more
          </Button>
        )}
      </div>
    </div>
  );
};
