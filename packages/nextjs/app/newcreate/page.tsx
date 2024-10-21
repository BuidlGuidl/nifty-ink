"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorPicker } from "./ColorPicker";
import { BrushControls } from "./_components/BrushControls";
import { CanvasActions } from "./_components/CanvasActions";
import { CanvasControls } from "./_components/CanvasControls";
import { CreateInkForm } from "./_components/CreateInkForm";
import { DraftManager } from "./_components/DraftManager";
import { useCanvasActions } from "./_hooks/useCanvasActions";
import { useCreateInk } from "./_hooks/useCreateInk";
import { useHotkeyBindings } from "./_hooks/useHotkeyBindings";
import "./styles.css";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { useAccount } from "wagmi";
import Loader from "~~/components/Loader";
import { CanvasDrawLines, Lines } from "~~/types/ink";
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
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { address: connectedAddress } = useAccount();

  const { width = 0, height = 0 } = useWindowSize({ debounceDelay: 500 });
  const calculatedCanvaSize = Math.round(0.85 * Math.min(width, height));
  const [picker, setPicker] = useLocalStorage("picker", 0);
  const [color, setColor] = useLocalStorage("color", "rgba(102,102,102,1)");
  const [brushRadius, setBrushRadius] = useState(8);
  const [recentColors, setRecentColors] = useLocalStorage("recentColors", ["rgba(102,102,102,1)"]);
  const [colorArray, setColorArray] = useLocalStorage<keyof ColorOptionsType>("colorArray", "twitter", {
    initializeWithValue: false,
  });
  const [_, setDrafts] = useLocalStorage<Draft[]>("drafts", []);
  const [canvasFile, setCanvasFile] = useState<any>(null);
  const [drawing, setDrawing] = useLocalStorage<string>("drawing", "");
  const [isDrawing, setIsDrawing] = useState(false);

  const recentColorCount = 24;

  const colorOptions: ColorOptionsType = getColorOptions(recentColors, recentColorCount);

  const drawingCanvas = useRef<CanvasDrawLines>(null);

  const [size, setSize] = useState([calculatedCanvaSize, calculatedCanvaSize]); //["70vmin", "70vmin"]) //["50vmin", "50vmin"][750, 500]

  const [initialDrawing, setInitialDrawing] = useState<string>("");
  const currentLines = useRef<Lines[]>([]);
  const [canvasDisabled, setCanvasDisabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const portraitRatio = 1.7;
  const portraitCalc = width / size[0] < portraitRatio;

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
    console.log(`rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`);
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
        console.log(opaqueColor, "adding to recent");
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
      console.log("sending to worker");
      compressionWorker.postMessage(newDrawing.getSaveData());
      // Listen for the worker's response
      compressionWorker.onmessage = function (event) {
        const savedData = event.data;
        setDrawing(savedData);
        console.log("saved");
      };
    }
    setIsSaving(false);
  };

  const { createInk, sending, setSending } = useCreateInk(
    drawingCanvas,
    connectedAddress,
    router,
    saveDrawing,
    handleChangeDrawing,
  );

  useEffect(() => {
    const loadPage = async () => {
      console.log("loadpage");
      if (drawing && drawing !== "") {
        console.log("Loading ink");
        try {
          const decompressed = LZ.decompress(drawing);
          currentLines.current = JSON.parse(decompressed)["lines"];
          console.log(currentLines.current);
          let points = 0;
          console.log(points);
          for (const line of currentLines.current) {
            points += line?.points?.length;
          }

          console.log("Drawing points", currentLines.current.length, points);
          setInitialDrawing(decompressed);
        } catch (e) {
          console.log(e);
        }
      }
      setIsDrawing(false);
    };

    loadPage();
  }, []);

  const triggerOnChange = (lines: Lines[]) => {
    if (!lines) return;
    if (!drawingCanvas?.current && !drawingCanvas?.current?.lines) return;
    const saved = JSON.stringify({
      lines: lines,
      width: drawingCanvas?.current?.props?.canvasWidth,
      height: drawingCanvas?.current?.props?.canvasHeight,
    });

    drawingCanvas?.current?.loadSaveData(saved, true);
    drawingCanvas.current.lines = lines;
    saveDrawing(drawingCanvas.current, false);
  };

  const { undo, downloadCanvas, uploadCanvas, fillBackground, drawFrame, saveDraft } = useCanvasActions(
    drawingCanvas,
    triggerOnChange,
    setDrafts,
    setCanvasFile,
    saveDrawing,
  );

  const uploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files![0], "UTF-8");
    fileReader.onload = e => {
      setCanvasFile(JSON.parse(e.target!.result as string));
    };
  };

  const uploadRef = useRef<HTMLInputElement | null>(null);

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

  useHotkeyBindings(brushRadius, updateBrushRadius, updateOpacity, undo);

  return (
    <div className="create-ink-container mt-5">
      {portrait && (
        <div className="title-top">
          <CreateInkForm onFinish={createInk} sending={sending} />
          <CanvasControls
            canvasDisabled={canvasDisabled}
            isSaving={isSaving}
            drawingCanvas={drawingCanvas}
            saveDrawing={saveDrawing}
            undo={undo}
            handleChangeDrawing={handleChangeDrawing}
            setCanvasDisabled={setCanvasDisabled}
          />
        </div>
      )}
      <div className="canvas">
        {width > 0 && height > 0 && isClient ? (
          <div
            style={{
              backgroundColor: "#666666",
              width: size[0],
              margin: "auto",
              border: "1px solid #999999",
              boxShadow: "2px 2px 8px #AAAAAA",
              cursor: "pointer",
            }}
            onMouseUp={saveCanvas}
            onTouchEnd={saveCanvas}
          >
            <CanvasDraw
              ref={drawingCanvas}
              canvasWidth={size[0]}
              canvasHeight={size[1]}
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
      <div className={portrait ? "edit-tools-bottom" : "edit-tools"}>
        {!portrait && (
          <>
            <CreateInkForm onFinish={createInk} sending={sending} />
            <CanvasControls
              canvasDisabled={canvasDisabled}
              isSaving={isSaving}
              drawingCanvas={drawingCanvas}
              saveDrawing={saveDrawing}
              undo={undo}
              handleChangeDrawing={handleChangeDrawing}
              setCanvasDisabled={setCanvasDisabled}
            />
          </>
        )}
        <div className={portrait ? "" : "edit-tools-side"}>
          <ColorPicker
            color={color}
            updateColor={updateColor}
            colorArray={colorArray}
            setColorArray={setColorArray}
            setPicker={setPicker}
            picker={picker}
            colorOptions={colorOptions}
          />
          <BrushControls brushRadius={brushRadius} updateBrushRadius={updateBrushRadius} />
          <CanvasActions
            fillBackground={fillBackground}
            drawFrame={drawFrame}
            color={color}
            brushRadius={brushRadius}
          />
          <DraftManager
            saveDraft={saveDraft}
            downloadCanvas={downloadCanvas}
            uploadFileChange={uploadFileChange}
            uploadCanvas={uploadCanvas}
            canvasFile={canvasFile}
            drawingCanvas={drawingCanvas}
            uploadRef={uploadRef}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateInk;
