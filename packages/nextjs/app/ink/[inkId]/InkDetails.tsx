"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MintButton from "./MintButton";
import { LinkOutlined, RocketOutlined, SendOutlined, SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { ApolloClient, InMemoryCache, useQuery } from "@apollo/client";
import { Button, List, Popover, Row, Space, Typography } from "antd";
import { INK_MAIN_QUERY } from "~~/apollo/queries";
import { NiftyShop } from "~~/app/_components/NiftyShop";
import { NiftyShopBuy } from "~~/app/_components/NiftyShopBuy";
import SendInkForm from "~~/app/_components/SendInkForm";
import { Address } from "~~/components/scaffold-eth";

const mainClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_MAINNET,
  cache: new InMemoryCache(),
});

export const InkDetails = ({
  ink,
  inkId,
  connectedAddress,
  inkJson,
}: {
  ink: Ink;
  inkId: string;
  connectedAddress: string;
  inkJson: any;
}) => {
  const isConnectedAddressArtist = connectedAddress.toLowerCase() === ink.artist.id;
  const isBuyButtonVisible =
    ink?.count && ink?.limit && (parseInt(ink.count) < parseInt(ink.limit) || ink.limit === "0");
  const [mainnetTokens, setMainnetTokens] = useState<Record<string, string>>({});

  const {
    loading: loadingMain,
    error: errorMain,
    data: dataMain,
  } = useQuery(INK_MAIN_QUERY, {
    variables: { inkUrl: inkId },
    client: mainClient,
  });

  useEffect(() => {
    if (dataMain) {
      const tempMainnetTokens: Record<string, string> = {};
      dataMain.tokens.forEach((token: { id: string; owner: string }) => {
        tempMainnetTokens[token.id] = token.owner;
      });

      setMainnetTokens(tempMainnetTokens);
    }
  }, [dataMain]);

  let mintDescription;
  if (ink && ink?.limit === "0") {
    mintDescription = (ink.count ? ink.count : "0") + " minted";
  } else if (ink) {
    mintDescription = (ink.count ? ink.count : "0") + "/" + ink.limit + " minted";
  }

  const sendInkButton = (tokenOwnerAddress: string, tokenId: string) => {
    if (connectedAddress && tokenOwnerAddress.toLowerCase() === connectedAddress.toLowerCase()) {
      return (
        <Popover content={<SendInkForm tokenId={tokenId} connectedAddress={connectedAddress} />} title="Send Ink">
          <Button icon={<SendOutlined />} size="small">
            Send
          </Button>
        </Popover>
      );
    }
  };

  const relayTokenButton = (relayed: boolean, tokenOwnerAddress: string, tokenId: string) => {
    if (connectedAddress && tokenOwnerAddress.toLowerCase() === connectedAddress.toLowerCase() && relayed === false) {
      return (
        <Button size="small" icon={<UploadOutlined />} disabled className="m-1">
          Upgrade
        </Button>
      );
    }
  };

  return (
    <>
      <Row style={{ justifyContent: "center" }}>
        <List
          header={
            <Row
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {" "}
              <Space>
                <Typography.Title level={3} style={{ marginBottom: "0px" }}>
                  {mintDescription}
                </Typography.Title>{" "}
                {isConnectedAddressArtist && <MintButton inkId={inkId} />}
                {isConnectedAddressArtist && isBuyButtonVisible ? (
                  <NiftyShop
                    type={"ink"}
                    price={ink.mintPrice || 0}
                    itemForSale={inkId}
                    placement="top"
                    connectedAddress={connectedAddress}
                  />
                ) : (
                  <NiftyShopBuy type={"ink"} price={ink.mintPrice || 0} itemForSale={inkId} inkName={inkJson.name} />
                )}
              </Space>
            </Row>
          }
          itemLayout="horizontal"
          dataSource={ink.tokens}
          renderItem={item => {
            const isConnectedAddressOwner =
              connectedAddress && item?.owner?.id && connectedAddress.toLowerCase() === item?.owner?.id;
            const openseaButton = (
              <Button
                type="primary"
                style={{
                  margin: 8,
                  background: "#722ed1",
                  borderColor: "#722ed1",
                }}
                onClick={() => {
                  console.log("item", item);
                  window.open("https://opensea.io/assets/0xc02697c417ddacfbe5edbf23edad956bc883f4fb/" + item.id);
                }}
              >
                <RocketOutlined /> View on OpenSea
              </Button>
            );

            return (
              <List.Item>
                <Link href={`/holdings/${mainnetTokens[item.id] ?? item.owner.id}`}>
                  <Address address={mainnetTokens[item.id] ?? item.owner.id} size="sm" disableAddressLink />
                </Link>
                <a
                  href={
                    "https://blockscout.com/poa/xdai/tokens/0xCF964c89f509a8c0Ac36391c5460dF94B91daba5/instance/" +
                    item.id
                  }
                  target="_blank"
                >
                  <LinkOutlined className="mx-1 text-md" />
                </a>
                {mainnetTokens[item.id] ? (
                  openseaButton
                ) : item.network === "mainnet" ? (
                  <Typography.Title level={4} style={{ marginLeft: 16 }}>
                    Upgrading to Ethereum <SyncOutlined spin />
                  </Typography.Title>
                ) : (
                  <></>
                )}
                {sendInkButton(item.owner.id, item.id)}
                {/* {relayTokenButton(item.network === "mainnet", item.owner.id, item.id)} */}
                {item.network !== "mainnet" &&
                  (isConnectedAddressOwner ? (
                    <NiftyShop
                      type={"token"}
                      price={item.price}
                      itemForSale={item.id}
                      placement="top"
                      connectedAddress={connectedAddress}
                    />
                  ) : (
                    <NiftyShopBuy type={"token"} price={item.price} itemForSale={item.id} inkName={inkJson.name} />
                  ))}
              </List.Item>
            );
          }}
        />
      </Row>
    </>
  );
};
