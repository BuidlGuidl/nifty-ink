import { Metadata } from "next";
import { loadInkMetadataByInkId } from "~~/utils/loadInkMetadataByInkId";

type Props = {
  params: { inkId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inkId = params?.inkId?.trim();
  if (!inkId) {
    return {};
  }

  try {
    const meta = await loadInkMetadataByInkId(inkId);
    if (!meta) {
      return {};
    }
    const image = typeof meta.image === "string" ? meta.image : undefined;
    const title = meta.name?.trim() ? `${meta.name} | Nifty Ink` : "Nifty Ink";
    const description = meta.description?.trim() || "NFT artwork: Putting the fun in non-fungible tokens";

    return {
      title,
      description,
      openGraph: {
        title: meta.name?.trim() || "Nifty Ink",
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: meta.name?.trim() || "Nifty Ink",
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

const ViewInkLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ViewInkLayout;
