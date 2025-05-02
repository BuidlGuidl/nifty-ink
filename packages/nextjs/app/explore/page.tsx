"use client";

import { Suspense } from "react";
import Image from "next/image";
import ExploreGnosisInks from "../_components/ExploreGnosisInks";
import ExploreZoraInks from "../_components/ExploreZoraInks";
import { Tabs, TabsProps } from "antd";
import type { NextPage } from "next";
import Loader from "~~/components/Loader";
import { useSearchParamsHandler } from "~~/hooks/useSearchParamsHandler";
import { TEXT_PRIMARY_COLOR } from "~~/utils/constants";

const ExploreWithSuspense = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Explore />
    </Suspense>
  );
};

const Explore: NextPage = () => {
  const { paramValue: platform, updateSearchParam: setPlatform } = useSearchParamsHandler("platform", "niftyink");

  const handleModeChange = (key: string) => {
    setPlatform(key);
  };

  const items: TabsProps["items"] = [
    {
      key: "niftyink",
      label: <p className={`${TEXT_PRIMARY_COLOR} my-0`}>🎨 Nifty Ink</p>,
    },
    {
      key: "zora",
      label: (
        <p className={`${TEXT_PRIMARY_COLOR} my-0 flex items-center`}>
          <Image src="/zora.png" alt="zora" width={16} height={16} className="w-4 h-4 flex-shrink-0" />
          &nbsp;Zora Posts
        </p>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-center items-center mt-2">
        <Tabs defaultActiveKey={platform} type="card" centered onChange={handleModeChange} items={items} />
      </div>
      {platform === "niftyink" ? <ExploreGnosisInks /> : <ExploreZoraInks />}
    </>
  );
};

export default ExploreWithSuspense;
