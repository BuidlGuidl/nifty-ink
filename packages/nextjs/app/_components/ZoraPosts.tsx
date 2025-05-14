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
    <ul className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6 max-w-4xl mx-auto px-4">
      {posts.map((post, index) => (
        <li
          key={`${post.name}-${index}`}
          className="border-2 border-gray-200 rounded-lg p-2 transition-transform hover:scale-105 w-full"
        >
          <Link href={{ pathname: "/zora/" + post.contractAddress }} className="block w-full">
            <div className="aspect-square w-full">
              <LazyImage
                uri={post?.uri}
                alt={post?.name as string}
                width={0}
                height={0}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="my-2 text-sm md:text-md lg:text-md xl:text-md font-bold truncate w-full text-center">
              {post.name}
            </h3>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ZoraPosts;
