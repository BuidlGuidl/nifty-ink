"use client";

import React from "react";
import Link from "next/link";
import { ForkButton } from "../buttons/ForkButton";
import { PlayButton } from "../buttons/PlayButton";
import { Address } from "~~/components/scaffold-eth";
import { formatDate, formatFullDate } from "~~/utils/date";

type InkHeaderProps = {
  name: string;
  artist: string;
  playClick: () => void;
  isDrawing: boolean;
  createdAt: string;
  drawing: string;
};

export const InkHeader: React.FC<InkHeaderProps> = ({ name, artist, playClick, isDrawing, createdAt, drawing }) => {
  return (
    <div className="flex flex-col justify-center w-full">
      <p className="text-xl md:text-3xl  my-0 text-center">{name}</p>

      <div className="w-full h-10 my-2 grid grid-cols-3 items-center px-2">
        <div className="justify-self-start">
          <Link href={`/artist/${artist}?platform=zora`} className="my-1">
            <Address address={artist} size="sm" format="short" disableAddressLink />
          </Link>
        </div>

        <div className="justify-self-center gap-2 flex">
          <PlayButton isDrawing={isDrawing} playClick={playClick} />
          <ForkButton artist={artist} drawing={drawing} />
        </div>

        <div className="justify-self-end">
          <p className="text-sm tooltip tooltip-primary tooltip-top" data-tip={formatFullDate(createdAt)}>
            {formatDate(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};
