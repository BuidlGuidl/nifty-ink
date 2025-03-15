"use client";

import React, { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

type InkListProps = {
  ink: Ink;
  layout?: string;
  connectedAddress?: string | undefined;
  children: ReactElement;
};

export const SingleInk = ({ ink, layout = "cards", connectedAddress, children }: InkListProps) => {
  return (
    <li className={`inline-block border-2 border-gray-200 rounded-lg ${layout === "cards" ? "m-2 p-2 font-bold" : ""}`}>
      <Link href={{ pathname: "/ink/" + ink.id }} className="text-black">
        <Image
          src={ink?.metadata?.image as string}
          alt={ink?.metadata?.name as string}
          width={layout === "cards" ? "150" : "150"}
          height={layout === "cards" ? "150" : "150"}
          className={`${layout === "cards" ? "border border-gray-200 rounded-lg" : ""}`}
        />
      </Link>
      {layout === "cards" && (
        <div className="flex flex-col items-center">
          <h3 className="my-2 text-md font-bold">
            {(ink?.metadata?.name?.length ?? 0) > 18 // review for zero
              ? ink?.metadata?.name.slice(0, 15).concat("...")
              : ink?.metadata?.name}
          </h3>
          {children}
        </div>
      )}
    </li>
  );
};
