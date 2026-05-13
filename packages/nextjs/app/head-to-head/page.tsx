import { Suspense } from "react";
import HeadToHeadInks from "../_components/HeadToHeadInks";
import type { Metadata } from "next";
import Loader from "~~/components/Loader";

export const metadata: Metadata = {
  title: "Head to head · Nifty Ink",
  description: "Pick between two inks—or share the same match with a friend.",
};

export default function HeadToHeadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-2">Head to head</h1>
      <Suspense fallback={<Loader />}>
        <HeadToHeadInks />
      </Suspense>
    </div>
  );
}
