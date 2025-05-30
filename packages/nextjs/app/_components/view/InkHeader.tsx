"use client";

import React from "react";
import Link from "next/link";
import { Grid } from "antd";
import { Address } from "~~/components/scaffold-eth";
import { formatDate, formatFullDate } from "~~/utils/date";

type InkHeaderProps = {
  name: string;
  artist: string;
  createdAt: string;
  buttons: React.ReactNode;
};

export const InkHeader: React.FC<InkHeaderProps> = ({ name, artist, createdAt, buttons }) => {
  const screens = Grid.useBreakpoint();
  const isSmall = !screens.sm;

  return (
    <div className="flex flex-col justify-center w-full">
      <p className="text-xl md:text-3xl my-0 text-center">{name}</p>

      <div className="w-full my-2 grid grid-cols-3 items-center">
        <div className="justify-self-start">
          <Link href={`/artist/${artist}?platform=zora`}>
            <Address
              address={artist}
              size={isSmall ? "xs" : "base"}
              format="short"
              disableAddressLink
              showBlockie={!isSmall}
            />
          </Link>
        </div>

        <div className="justify-self-center gap-2 flex">{buttons}</div>

        <div className="justify-self-end">
          <p
            className={`my-0 tooltip tooltip-primary tooltip-top ${isSmall ? "text-sm" : "text-base"}`}
            data-tip={formatFullDate(createdAt)}
          >
            {formatDate(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};
