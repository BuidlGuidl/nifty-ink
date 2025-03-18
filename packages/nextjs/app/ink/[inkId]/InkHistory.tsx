"use client";

import Link from "next/link";
import { Address } from "~~/components/scaffold-eth";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";

export const InkHistory = ({ inkTokenTransfers }: { inkTokenTransfers: any }) => {
  return (
    <div className="h-full w-full">
      {inkTokenTransfers && inkTokenTransfers.length > 0 ? (
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "left" }}>
          <ul className="list-none p-1 m-0">
            <li
              className={`py-0.5 px-1.5 flex justify-between font-bold bg-gray-100 dark:bg-gray-800 ${TEXT_PRIMARY_COLOR}`}
            >
              <span className="flex-1 font-bold" style={{ flexBasis: "10%" }}>
                Edition
              </span>
              <span className="flex-1 font-bold" style={{ flexBasis: "10%" }}>
                Action
              </span>
              <span className="flex-1 font-bold" style={{ flexBasis: "25%" }}>
                From
              </span>
              <span className="flex-1 font-bold" style={{ flexBasis: "25%" }}>
                To
              </span>
              <span className="flex-1 font-bold" style={{ flexBasis: "8%" }}>
                Price
              </span>
              <span className="flex-1 font-bold" style={{ flexBasis: "12%" }}>
                Date
              </span>
            </li>
          </ul>
          {inkTokenTransfers.map((transfer: any) => (
            <li key={transfer.id} className="py-0.5 px-1.5 flex justify-between">
              <span className={`${TEXT_PRIMARY_COLOR} flex-1 font-bold`} style={{ flexBasis: "10%" }}>
                {transfer.token.edition}
              </span>
              <span className="flex-1" style={{ flexBasis: "10%" }}>
                <Link
                  href={{
                    pathname: `https://gnosisscan.io/tx/${transfer.transactionHash}`,
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
              <span className="flex-1" style={{ flexBasis: "25%" }}>
                {transfer.from.id === "0x0000000000000000000000000000000000000000" ? null : (
                  <Link href={`/holdings/${transfer.from.id}`}>
                    <Address address={transfer.from.id} size="xs" disableAddressLink />
                  </Link>
                )}
              </span>
              <span className="flex-1" style={{ flexBasis: "25%" }}>
                <Link href={`/holdings/${transfer.to.id}`}>
                  <Address address={transfer.to.id} size="xs" disableAddressLink />
                </Link>
              </span>
              <span className={`${TEXT_PRIMARY_COLOR} flex-1 font-bold`} style={{ flexBasis: "8%" }}>
                {transfer.sale && transfer.sale.price ? "$" + (parseInt(transfer.sale.price) / 1e18).toFixed(2) : "-"}
              </span>
              <span className={`${TEXT_PRIMARY_COLOR} flex-1 font-bold`} style={{ flexBasis: "12%" }}>
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
