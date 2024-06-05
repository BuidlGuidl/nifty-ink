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

interface Artist {
  __typename?: string;
  address: string;
  id?: string;
  inkCount?: number;
  earnings?: bigint;
  likeCount?: number;
}

interface Ink {
  __typename: string;
  artist: Artist;
  bestPrice: number;
  bestPrceSetAt?: string;
  bestPriceSource?: string;
  count: string;
  createdAt: string;
  id: string;
  inkNumber: number;
  jsonUrl: string;
  likeCount?: number;
  likes: any[];
  limit: number;
  metadata?: InkMetadata;
}
