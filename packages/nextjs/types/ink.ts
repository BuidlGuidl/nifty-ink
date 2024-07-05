interface Artist {
  __typename?: string;
  address: string;
  id?: string;
  inkCount?: number;
  earnings?: bigint;
  likeCount?: number;
}

type HistoryData = {
  artists: number;
  day: number;
  inks: number;
  sales: number;
  saleValue: number;
  tokens: number;
  upgrades: number;
  users: number;
};

interface Ink {
  __typename: string;
  artist: Artist;
  bestPrice: number;
  bestPrceSetAt?: string;
  bestPriceSource?: string;
  burned?: boolean;
  count: string;
  createdAt: string;
  id: string;
  inkNumber: number;
  jsonUrl: string;
  likeCount?: number;
  likes: any[];
  limit?: string;
  metadata?: InkMetadata;
  mintPrice?: number;
  tokens?: Token[];
}

interface InkMetadata {
  attributes: InkMetadataAttribute[];
  description: string;
  drawing: string;
  external_url: string;
  image: string;
  name: string;
}

interface InkMetadataAttribute {
  trait_type: string;
  value: string;
}

interface Token {
  id: string;
  network?: string;
  ink: Ink;
  owner: { id: string; __typename: string };
  price: number;
}

interface User {
  __typename?: string;
  address: string;
  collectionCount: number;
  purchaseCount: number;
  saleCount: number;
  tokenCount: number;
}
