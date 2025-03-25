"use client";

import { Suspense } from "react";
import ExploreGnosisInks from "./_components/ExploreGnosisInks";
import ExploreZoraInks from "./_components/ExploreZoraInks";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import Loader from "~~/components/Loader";
import { Chains } from "~~/types/chains";
import { getChainId } from "~~/utils/chains";

const HomeWithSuspense = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Home />
    </Suspense>
  );
};

const Home: NextPage = () => {
  const { chain } = useAccount();

  if (chain?.id === getChainId(Chains.base)) {
    return <ExploreZoraInks />;
  }

  return <ExploreGnosisInks />;
};

export default HomeWithSuspense;
