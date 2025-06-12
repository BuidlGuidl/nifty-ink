import { Metadata } from "next";

type Props = {
  params: { inkId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    openGraph: {
      images: [`https://niftyink.bgipfs.com/ipfs/${params?.inkId}`],
    },
    twitter: {
      images: [`https://niftyink.bgipfs.com/ipfs/${params?.inkId}`],
    },
  };
}

const ViewInkLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ViewInkLayout;
