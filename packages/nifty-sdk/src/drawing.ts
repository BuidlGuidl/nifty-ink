/** @experimental Unstable prototype API. Not audited or intended for production use. */
export { toSvg, type Stroke, type Board } from "drawesome";
export { toAnimatedSvg } from "./animatedSvg.js";

/** Browser-only raster export; dimensions are chosen by the caller. */
export async function svgToPng(svg: string, width: number, height: number): Promise<string> {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error("Invalid image dimensions");
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not export the drawing.");
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
