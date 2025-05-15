import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReadContracts, useSwitchChain } from "wagmi";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { fetchCoinData, fetchDrawingContent, fetchMetadata } from "~~/services/zoraService";
import { ZoraToken } from "~~/types/zora";

const config = createConfig({
  chains: [base],
  syncConnectedChain: false,
  transports: {
    [base.id]: http(),
  },
});

export const useZoraDrawing = (coinAddress: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [drawingData, setDrawingData] = useState<string>("");
  const [totalLines, setTotalLines] = useState<number>(0);
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    switchChain?.({ chainId: base.id });
  }, [switchChain]);

  const zoraTokenContract = {
    address: coinAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "tokenURI",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owners",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
      },
    ],
  };
  const { data: contractData } = useReadContracts({
    config,
    contracts: [
      {
        ...zoraTokenContract,
        functionName: "tokenURI",
      },
      {
        ...zoraTokenContract,
        functionName: "owners",
      },
    ],
  });

  const zoraTokenTokenURI = contractData?.[0]?.result as string | undefined;
  const owners = contractData?.[1]?.result as `0x${string}`[] | undefined;

  const { data: metadata } = useQuery({
    queryKey: ["metadata", zoraTokenTokenURI],
    queryFn: () => fetchMetadata(zoraTokenTokenURI as string),
    enabled: !!zoraTokenTokenURI,
  });

  const { data: zoraToken } = useQuery({
    queryKey: ["zoraToken", coinAddress],
    queryFn: () => fetchCoinData(coinAddress) as Promise<ZoraToken>,
  });

  const fetchAndShowDrawing = useCallback(async () => {
    if (!metadata) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      if (!metadata?.animation_url) {
        throw new Error("No animation URL found in metadata");
      }

      // Fetch and process drawing content
      const drawingContent = await fetchDrawingContent(metadata.animation_url);
      const parsedDrawing = JSON.parse(drawingContent);
      setTotalLines(parsedDrawing.lines.length);
      setDrawingData(drawingContent);

      return {
        drawingData: drawingContent,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      console.error("Error in fetchAndShowDrawing:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [metadata]);

  return {
    isLoading,
    error,
    drawingData,
    zoraToken,
    totalLines,
    fetchAndShowDrawing,
    metadata,
    owners,
  };
};
