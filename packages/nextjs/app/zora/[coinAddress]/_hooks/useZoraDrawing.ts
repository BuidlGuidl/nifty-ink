import { useCallback, useState } from "react";
import { fetchCoinData, fetchDrawingContent, fetchMetadata } from "~~/services/zoraService";
import { Metadata, ZoraToken } from "~~/types/zora";

export const useZoraDrawing = (coinAddress: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [drawingData, setDrawingData] = useState<string>("");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [zoraToken, setZoraToken] = useState<ZoraToken | null>(null);
  const [totalLines, setTotalLines] = useState<number>(0);

  const fetchAndShowDrawing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch coin data
      const zoraToken = await fetchCoinData(coinAddress);
      setZoraToken(zoraToken);

      // Fetch metadata
      const metadata = await fetchMetadata(zoraToken.tokenUri!);
      setMetadata(metadata);

      // Fetch and process drawing content
      const drawingContent = await fetchDrawingContent(metadata);
      const parsedDrawing = JSON.parse(drawingContent);
      setTotalLines(parsedDrawing.lines.length);
      setDrawingData(drawingContent);

      return {
        metadata,
        drawingData: drawingContent,
        zoraToken,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      console.error("Error in fetchAndShowDrawing:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [coinAddress]);

  return {
    isLoading,
    error,
    drawingData,
    metadata,
    zoraToken,
    totalLines,
    fetchAndShowDrawing,
  };
};
