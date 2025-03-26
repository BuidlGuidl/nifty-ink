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
