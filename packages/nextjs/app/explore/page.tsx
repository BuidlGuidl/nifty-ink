"use client";

import { Suspense } from "react";
import ExploreGnosisInks from "../_components/ExploreGnosisInks";
import type { NextPage } from "next";
import Loader from "~~/components/Loader";

const ExplorePage: NextPage = () => (
  <Suspense fallback={<Loader />}>
    <ExploreGnosisInks />
  </Suspense>
);

export default ExplorePage;
