"use client";

import React from "react";
import { PlaySquareOutlined } from "@ant-design/icons";
import { Button } from "antd";

type InkHeaderProps = {
  name: string;
  playClick: () => void;
  isDrawing: boolean;
};

export const InkHeader: React.FC<InkHeaderProps> = ({ name, playClick, isDrawing }) => {
  return (
    <div className="flex justify-center">
      <p className="text-2xl my-1">{name}</p>

      <Button
        loading={isDrawing}
        disabled={isDrawing}
        className="mt-1 ml-1"
        onClick={playClick}
        icon={<PlaySquareOutlined />}
      >
        {isDrawing ? "Drawing..." : "Play"}
      </Button>

      {/* TODO: Add fork button
      {ink && connectedAddress && connectedAddress.toLowerCase() == ink.artist.id && (
        <>
          <Button
            className="mt-1 ml-1"
            onClick={() => {
              if (!drawing) return;
              const _savedData = LZ.compress(drawing);
              setDrawingLocalStorage(_savedData);
              router.push("/create");
            }}
          >
            <span style={{ marginRight: 12 }} role="img" aria-label="Fork">
              🍴
            </span>{" "}
            FORK
          </Button>
        </>
      )} */}
    </div>
  );
};
