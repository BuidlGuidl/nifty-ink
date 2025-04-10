"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrushControls } from "./_components/BrushControls";
import { CanvasControls } from "./_components/CanvasControls";
import { ColorPicker } from "./_components/ColorPicker";
import { DraftManager } from "./_components/DraftManager";
import { useHotkeyBindings } from "./_hooks/useHotkeyBindings";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import Loader from "~~/components/Loader";
import { CanvasDrawLines, Lines } from "~~/types/canvasDrawing";
import { getColorOptions } from "~~/utils/constants";

let compressionWorker: Worker | null = null;

const parseRGBA = (color: string): number[] => {
  return color
    .substring(5)
    .replace(")", "")
    .split(",")
    .map(e => parseFloat(e));
};

const createRGBA = (r: number, g: number, b: number, a: number): string => {
  return `rgba(${r},${g},${b},${a})`;
};

const CreateInk = () => {
  const [isClient, setIsClient] = useState(false);

  const { width = 0, height = 0 } = useWindowSize({ debounceDelay: 500 });
  const calculatedCanvaSize = Math.min(Math.round(Math.min(width * 0.95, height * 0.75)), 800);
  const [color, setColor] = useLocalStorage("color", "rgba(102,102,102,1)");
  const [brushRadius, setBrushRadius] = useState(8);
  const [recentColors, setRecentColors] = useLocalStorage("recentColors", ["rgba(102,102,102,1)"]);
  const [colorArray, setColorArray] = useLocalStorage<keyof ColorOptionsType>("colorArray", "twitter", {
    initializeWithValue: false,
  });
  const [drawing, setDrawing] = useLocalStorage<string>("drawing", "");
  const [isDrawing, setIsDrawing] = useState(false);

  const recentColorCount = 24;

  const colorOptions: ColorOptionsType = getColorOptions(recentColors, recentColorCount);

  const drawingCanvas = useRef<CanvasDrawLines>(null);

  const [initialDrawing, setInitialDrawing] = useState<string>("");
  const currentLines = useRef<Lines[]>([]);
  const [canvasDisabled, setCanvasDisabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const portraitRatio = 1.7;
  const portraitCalc = width / calculatedCanvaSize < portraitRatio;

  const [portrait, setPortrait] = useState(false);

  const handleChangeDrawing = (newDrawing: string) => {
    setDrawing(newDrawing);
  };

  useEffect(() => {
    setIsClient(true); // To avoid hydration error
    setPortrait(portraitCalc);

    // Check if the window object is available to ensure this runs only on the client side
    if (typeof window !== "undefined") {
      // Dynamically import the worker
      compressionWorker = new Worker(new URL("./compressionWorker.ts", import.meta.url));
    }

    // Cleanup the worker on component unmount
    return () => {
      if (compressionWorker) {
        compressionWorker.terminate();
        compressionWorker = null;
      }
    };
  }, []);

  useEffect(() => {
    setPortrait(portraitCalc);
  }, [portraitCalc]);

  const updateBrushRadius = useCallback((value: number | null) => {
    if (value !== null && value >= 1 && value <= 100) {
      setBrushRadius(value);
    }
  }, []);

  const updateColor = (value: any) => {
    setColor(`rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`);
  };

  const updateOpacity = useCallback((value: number) => {
    if (!drawingCanvas.current) return;

    const [r, g, b, a] = parseRGBA(drawingCanvas.current.props.brushColor);

    let newOpacity = a + value;
    if (newOpacity <= 0.01) newOpacity = 0;
    if (newOpacity >= 0.99) newOpacity = 1;

    setColor(createRGBA(r, g, b, newOpacity));
  }, []);

  const saveDrawing = (newDrawing: any, saveOverride: boolean) => {
    setIsSaving(true);

    if (drawingCanvas?.current?.props.brushColor) {
      const [r, g, b] = parseRGBA(drawingCanvas.current.props.brushColor);
      const opaqueColor = createRGBA(r, g, b, 1);

      if (!recentColors.slice(-recentColorCount).includes(opaqueColor)) {
        setRecentColors(prevItems => [...prevItems.slice(-recentColorCount + 1), opaqueColor]);
      }
    }

    currentLines.current = newDrawing.lines;
    const isToSave =
      saveOverride ||
      newDrawing.lines.length < 100 ||
      (newDrawing.lines.length < 600 && newDrawing.lines.length % 10 === 0) ||
      newDrawing.lines.length % 20 === 0;

    if (isToSave && compressionWorker) {
      // Send data to the worker
      compressionWorker.postMessage(newDrawing.getSaveData());
      // Listen for the worker's response
      compressionWorker.onmessage = function (event) {
        const savedData = event.data;
        setDrawing(savedData);
      };
    }
    setIsSaving(false);
  };

  useEffect(() => {
    const loadPage = async () => {
      if (drawing && drawing !== "") {
        try {
          const decompressed = LZ.decompress(drawing);
          currentLines.current = JSON.parse(decompressed)["lines"];
          let points = 0;
          for (const line of currentLines.current) {
            points += line?.points?.length;
          }

          setInitialDrawing(decompressed);
        } catch (e) {
          console.log(e);
        }
      }
      setIsDrawing(false);
    };

    loadPage();
  }, []);

  const saveCanvas = () => {
    if (canvasDisabled || isDrawing) {
      console.log("Canvas disabled or drawing");
    } else {
      saveDrawing(drawingCanvas.current, false);
    }
  };

  const handleCanvasChange = () => {
    if (drawingCanvas && drawingCanvas.current) {
      if (drawingCanvas?.current?.lines.length >= currentLines.current.length && canvasDisabled) {
        console.log("enabling it!");
        setCanvasDisabled(false);
      }
    }
  };

  useHotkeyBindings(brushRadius, updateBrushRadius, updateOpacity);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center text-center flex-wrap mt-2 gap-2">
        <div>
          <CanvasControls
            canvasDisabled={canvasDisabled}
            isSaving={isSaving}
            drawingCanvas={drawingCanvas}
            saveDrawing={saveDrawing}
            handleChangeDrawing={handleChangeDrawing}
            setCanvasDisabled={setCanvasDisabled}
            color={color}
            brushRadius={brushRadius}
          />
          {width > 0 && height > 0 && isClient ? (
            <div
              style={{
                width: calculatedCanvaSize,
                height: calculatedCanvaSize,
              }}
              className="shadow-lg cursor-pointer"
              onMouseUp={saveCanvas}
              onTouchEnd={saveCanvas}
            >
              <CanvasDraw
                ref={drawingCanvas}
                canvasWidth={calculatedCanvaSize}
                canvasHeight={calculatedCanvaSize}
                brushColor={color}
                lazyRadius={1}
                brushRadius={brushRadius}
                disabled={canvasDisabled}
                onChange={handleCanvasChange}
                saveData={initialDrawing}
                immediateLoading={true} //drawingSize >= 10000}
                loadTimeOffset={3}
              />
            </div>
          ) : (
            <Loader />
          )}
        </div>
        <div className={`flex flex-col items-center ${portrait ? "mt-1" : "mt-10"}`}>
          <BrushControls
            color={color}
            brushRadius={brushRadius}
            updateColor={updateColor}
            updateBrushRadius={updateBrushRadius}
          />
          <ColorPicker
            color={color}
            updateColor={updateColor}
            colorArray={colorArray}
            setColorArray={setColorArray}
            colorOptions={colorOptions}
            portrait={portrait}
          />
          <DraftManager saveDrawing={saveDrawing} drawingCanvas={drawingCanvas} />
        </div>
      </div>
    </div>
  );
};

export default CreateInk;
