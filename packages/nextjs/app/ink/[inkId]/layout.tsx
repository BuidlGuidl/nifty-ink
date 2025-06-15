import { Metadata } from "next";

type Props = {
  params: { inkId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    openGraph: {
      images: [`${process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT}/ipfs/${params?.inkId}`],
    },
    twitter: {
      images: [`${process.env.NEXT_PUBLIC_BGIPFS_ENDPOINT}/ipfs/${params?.inkId}`],
    },
  };
}

const ViewInkLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ViewInkLayout;
