import { useEffect, useRef, useState } from "react";
import { getFetchableUrl } from "~~/utils/ipfs";

type LazyImageProps = {
  uri: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

const LazyImage: React.FC<LazyImageProps> = ({ uri, alt, width, height, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fetchMetadata = async () => {
    try {
      const url = getFetchableUrl(uri);
      const contractResponse = await fetch(url);
      const contractData = await contractResponse.json();
      return contractData.image;
    } catch (error) {
      console.error(`Failed to fetch contract data for URI: ${uri}`, error);
      return null;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(async entry => {
          if (entry.isIntersecting && !isLoaded) {
            const image = await fetchMetadata();
            setImageSrc(getFetchableUrl(image));
            setIsLoaded(true);
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [uri, isLoaded]);

  return (
    <div ref={imgRef} className={`rounded-lg bg-white ${className}`}>
      {imageSrc ? (
        <img src={imageSrc} alt={alt} width={width} height={height} className={`rounded-lg ${className}`} />
      ) : (
        <div className="skeleton w-full h-full rounded-lg"></div>
      )}
    </div>
  );
};

export default LazyImage;
