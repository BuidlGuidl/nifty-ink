import { useCallback, useState } from "react";
import { fetchCoinData, fetchDrawingContent } from "~~/services/zoraService";
import { ZoraToken } from "~~/types/zora";

export const useZoraDrawing = (coinAddress: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [drawingData, setDrawingData] = useState<string>("");
  const [zoraToken, setZoraToken] = useState<ZoraToken | null>(null);
  const [totalLines, setTotalLines] = useState<number>(0);

  const fetchAndShowDrawing = useCallback(async () => {
    try {
      console.log("fetching drawing");
      setIsLoading(true);
      setError(null);

      // Fetch coin data
      const zoraToken = (await fetchCoinData(coinAddress)) as unknown as ZoraToken;
      setZoraToken(zoraToken);

      // Fetch and process drawing content
      const link = zoraToken?.mediaContent.originalUri;
      const drawingContent = await fetchDrawingContent(link);
      const parsedDrawing = JSON.parse(drawingContent);
      setTotalLines(parsedDrawing.lines.length);
      setDrawingData(drawingContent);
      console.log("received drawing", JSON.stringify(drawingContent).length);

      return {
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
    zoraToken,
    totalLines,
    fetchAndShowDrawing,
  };
};
