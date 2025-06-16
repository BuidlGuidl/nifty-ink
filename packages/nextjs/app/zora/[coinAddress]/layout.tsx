import { getCoin } from "@zoralabs/coins-sdk";
import { Metadata } from "next";
import { base } from "wagmi/chains";
import { fetchMetadata } from "~~/services/zoraService";
import { ZoraToken } from "~~/types/zora";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export async function generateMetadata({ params }: { params: { coinAddress: string } }): Promise<Metadata> {
  const { coinAddress } = params;

  const response = await getCoin({
    address: coinAddress as `0x${string}`,
    chain: base.id,
  });

  const tokenURI = (response?.data?.zora20Token as ZoraToken).tokenUri;
  const metadata = tokenURI ? await fetchMetadata(tokenURI) : null;

  if (!metadata)
    return getMetadata({
      title: "Nifty Ink",
      description: "Nifty Ink is a platform for creating and sharing digital art.",
    });

  const imageUrl = metadata.image?.includes("ipfs://")
    ? `${process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT}/ipfs/${metadata.image.replace("ipfs://", "")}`
    : `${process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT}/ipfs/${metadata.image}`;

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      title: metadata.name,
      description: metadata.description,
      images: [imageUrl],
    },
    twitter: {
      title: metadata.name,
      description: metadata.description,
      images: [imageUrl],
    },
  };
}

export default function ViewInkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
