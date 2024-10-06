import { useCallback, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

const useInfiniteScroll = (fetchMore: () => void, skip: number, threshold = 300, delay = 300) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Debounce the scroll position to limit fetchMore calls
  const debouncedScrollPosition = useDebounceValue<number>(scrollPosition, delay);

  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY + window.innerHeight);
  }, []);

  useEffect(() => {
    if (debouncedScrollPosition?.[0] >= document.body.scrollHeight - threshold) {
      fetchMore();
    }
  }, [debouncedScrollPosition, fetchMore, skip, threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    scrollPosition,
  };
};

export default useInfiniteScroll;
