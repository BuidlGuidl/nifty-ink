export type Collection = {
  name: string;
  description: string;
  image: string;
  contractAddress: string;
  uri: string;
};

export type Post = {
  name: string;
  image?: string;
  uri: string;
  contractAddress: string;
};

export interface Metadata {
  animation_url: string;
  content: {
    mime: string;
    uri: string;
  };
  description: string;
  image: string;
  name: string;
}

export interface ZoraToken {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  mediaContent: {
    originalUri: string;
    mimeType: string;
    previewImage: {
      blurhash: string;
      medium: string;
      small: string;
    };
  };
  totalVolume: string;
  volume24h: string;
  marketCap: string;
  createdAt?: string;
  creatorAddress: string;
  uniqueHolders: number;
  tokenUri?: string;
  zoraComments: any; // TODO: Define proper type
}

export interface FetchDrawingResponse {
  metadata: Metadata;
  drawingData: string;
  zoraToken: ZoraToken;
}
