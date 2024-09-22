import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useSearchParamsHandler(key: string, defaultValue: string) {
  const searchParams = useSearchParams();
  const initialValue = searchParams.get(key) || defaultValue;

  const [paramValue, setParamValue] = useState<string>(initialValue);

  useEffect(() => {
    // Update the URL with the default value if it doesn't exist
    if (!searchParams.get(key)) {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set(key, defaultValue);
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.pushState(null, "", newUrl);
    }
  }, [key, defaultValue, searchParams]);

  const updateSearchParam = (value: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set(key, value);
    setParamValue(value);
    // Update the search param in the URL
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState(null, "", newUrl);
  };

  return { paramValue, updateSearchParam };
}
