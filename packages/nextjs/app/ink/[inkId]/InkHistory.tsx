"use client";

import Link from "next/link";
import { Address } from "~~/components/scaffold-eth";

export const InkHistory = ({ inkTokenTransfers }: { inkTokenTransfers: any }) => {
  console.log(inkTokenTransfers);
  return (
    <div className="h-full w-full">
      {inkTokenTransfers && inkTokenTransfers.length > 0 ? (
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "left" }}>
          <ul style={{ listStyle: "none", padding: "5px", margin: "0" }}>
            <li
              style={{
                padding: "2px 6px",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                background: "#f5f5f5",
              }}
            >
              <span
                style={{
                  flexBasis: "10%",
                  flexGrow: "1",
                  fontWeight: "bold",
                }}
              >
                Edition
              </span>
              <span
                style={{
                  flexBasis: "10%",
                  flexGrow: "1",
                  fontWeight: "bold",
                }}
              >
                Action
              </span>
              <span
                style={{
                  flexBasis: "25%",
                  flexGrow: "1",
                  fontWeight: "bold",
                }}
              >
                From
              </span>
              <span
                style={{
                  flexBasis: "25%",
                  flexGrow: "1",
                  fontWeight: "bold",
                }}
              >
                To
              </span>
              <span style={{ flexBasis: "8%", flexGrow: "1", fontWeight: "bold" }}>Price</span>
              <span
                style={{
                  flexBasis: "12%",
                  flexGrow: "1",
                  fontWeight: "bold",
                }}
              >
                Date
              </span>
            </li>
          </ul>
          {inkTokenTransfers.map((transfer: any) => (
            <li
              key={transfer.id}
              style={{
                padding: "2px 6px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  flexBasis: "10%",
                  flexGrow: "1",
                  fontWeight: "bold",
                }}
              >
                {transfer.token.edition}
              </span>
              <span style={{ flexBasis: "10%", flexGrow: "1" }}>
                <Link
                  href={{
                    pathname: `https://blockscout.com/xdai/mainnet/tx/${transfer.transactionHash}`,
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {transfer.sale && transfer.sale.id
                    ? "Purchase"
                    : transfer.to.id === "0x0000000000000000000000000000000000000000" ||
                      transfer.to.id === "0x000000000000000000000000000000000000dead"
                    ? "Burn"
                    : transfer.from.id === "0x0000000000000000000000000000000000000000"
                    ? "Mint"
                    : transfer.to.id === "0x73ca9c4e72ff109259cf7374f038faf950949c51"
                    ? "Upgrade"
                    : "Transfer"}
                </Link>
              </span>
              <span style={{ flexBasis: "25%", flexGrow: "1" }} className="token-transfer-table-address">
                {transfer.from.id === "0x0000000000000000000000000000000000000000" ? null : (
                  <Link href={`/holdings/${transfer.from.id}`}>
                    <Address address={transfer.to.id} size="xs" disableAddressLink />
                  </Link>
                )}
              </span>
              <span style={{ flexBasis: "25%", flexGrow: "1" }} className="token-transfer-table-address">
                {
                  <Link href={`/holdings/${transfer.to.id}`}>
                    <Address address={transfer.to.id} size="xs" disableAddressLink />
                  </Link>
                }
              </span>
              <span style={{ flexBasis: "8%", flexGrow: "1" }}>
                {transfer.sale && transfer.sale.price ? "$" + (parseInt(transfer.sale.price) / 1e18).toFixed(2) : "-"}
              </span>
              <span style={{ flexBasis: "12%", flexGrow: "1" }}>
                {transfer.createdAt &&
                  new Date(parseInt(transfer.createdAt) * 1000).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </span>
            </li>
          ))}
        </div>
      ) : null}
    </div>
  );
};
