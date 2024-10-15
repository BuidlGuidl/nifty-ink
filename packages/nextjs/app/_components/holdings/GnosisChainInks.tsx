"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LoadMoreButton from "../LoadMoreButton";
import { NiftyShop } from "../NiftyShop";
import SendInkForm from "../SendInkForm";
import { SendOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Popover, Switch } from "antd";
import { FIRST_HOLDING_QUERY, HOLDINGS_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import useInfiniteScroll from "~~/hooks/useInfiniteScroll";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";
import { getMetadata } from "~~/utils/helpers";

export const GnosisChainInks = ({ address, connectedAddress }: { address: string; connectedAddress: string }) => {
  const [tokens, setTokens] = useState<Token[]>([]); // Object holding information about relevant tokens
  const [holderCreationOnly, setHolderCreationOnly] = useState<boolean>(false);
  const [moreInksLoading, setMoreInksLoading] = useState<boolean>(false);

  const {
    loading,
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

  const { data: firstHoldingActivity } = useQuery(FIRST_HOLDING_QUERY, {
    variables: {
      owner: address.toLowerCase(),
    },
  });

  const loadMoreInks = async () => {
    if (!moreInksLoading && tokens[tokens.length - 1]?.ink?.id !== firstHoldingActivity?.tokens?.[0]?.ink?.id) {
      setMoreInksLoading(true);
      await fetchMore({
        variables: {
          skip: tokens.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return fetchMoreResult;
        },
      });
    }
  };

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
          const tokenIds = new Set(tokens.map(token => token.id)); // avoid duplication of inks
          const filteredProcessedTokens = processedTokens.filter(token => !tokenIds.has(token.id));
          return [...tokens, ...filteredProcessedTokens];
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMoreInksLoading(false);
    }
  };

  useEffect(() => {
    dataRaw ? getTokens(dataRaw?.tokens) : console.log("loading tokens");
    if (dataRaw) console.log(dataRaw?.tokens);
  }, [dataRaw]);

  useInfiniteScroll(loadMoreInks, tokens.length, 500);

  if (loading) return <Loader />;

  return (
    <div className={`flex flex-col justify-center ${TEXT_PRIMARY_COLOR}`}>
      <div className="flex justify-center gap-8 text-center mb-5">
        <div>
          <b>All Holdings:</b> {dataRaw && dataRaw.user ? parseInt(dataRaw.user.tokenCount) : 0}
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
                    {tokens[id].network === "xDai" && (
                      <>
                        {address == connectedAddress && (
                          <>
                            <Popover
                              content={<SendInkForm connectedAddress={connectedAddress} tokenId={token.id} />}
                              placement="left"
                              title="Send Ink"
                            >
                              <Button size="small" icon={<SendOutlined />} className="m-1">
                                Send
                              </Button>
                            </Popover>
                            {/* <Button size="small" icon={<UploadOutlined />} disabled className="m-1">
                              Upgrade
                            </Button> */}
                            {/* <UpgradeInkButton
                                tokenId={tokens[id].id}
                                injectedProvider={props.injectedProvider}
                                gasPrice={props.gasPrice}
                                upgradePrice={props.upgradePrice}
                                transactionConfig={props.transactionConfig}
                                buttonSize="small"
                              /> */}{" "}
                            <NiftyShop
                              type="token"
                              price={token.price}
                              itemForSale={token.id}
                              placement="left"
                              connectedAddress={connectedAddress}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
        </ul>
        <LoadMoreButton
          allItemsLoaded={tokens[tokens.length - 1]?.ink?.id === firstHoldingActivity?.tokens?.[0]?.ink?.id}
          allItemsLoadedText={"All holdings were loaded."}
          moreInksLoading={moreInksLoading}
          loadMoreInks={loadMoreInks}
        />
      </div>
    </div>
  );
};
