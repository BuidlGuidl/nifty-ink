import Link from "next/link";
import Loader from "~~/components/Loader";
import LazyImage from "~~/components/shared/LazyImage";
import { Post } from "~~/types/zora";

type ZoraPostsProps = {
  isLoading: boolean;
  posts: Post[];
};

const ZoraPosts: React.FC<ZoraPostsProps> = ({ isLoading, posts }) => {
  if (isLoading) {
    return <Loader />;
  }
  if (posts.length === 0) {
    return <p className="text-center text-lg">No posts were found on Zora on Base chain</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center">
        <ul className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {posts.map((post, index) => {
            return (
              <li
                key={`${post.name}-${index}`}
                className="border-2 border-gray-200 rounded-lg p-2 transition-transform hover:scale-105  max-w-[150px]"
              >
                <Link
                  href={`https://zora.co/coin/base:${post.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <div className="aspect-square w-full mx-auto">
                    <LazyImage
                      uri={post?.uri}
                      alt={post?.name as string}
                      width={0}
                      height={0}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <h3 className="my-2 text-sm md:text-md lg:text-md xl:text-md font-bold truncate w-full text-center">
                      {post.name}
                    </h3>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ZoraPosts;
