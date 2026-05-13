import HeadToHeadInks from "../_components/HeadToHeadInks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Head to head · Nifty Ink",
  description: "Compare two random inks from top-selling artists and pick a winner.",
};

export default function HeadToHeadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-2">Head to head</h1>
      <HeadToHeadInks />
    </div>
  );
}
