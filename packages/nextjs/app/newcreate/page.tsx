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
import "./styles.css";
import LZ from "lz-string";
import CanvasDraw from "react-canvas-draw";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceCallback, useLocalStorage, useWindowSize } from "usehooks-ts";
import { useAccount } from "wagmi";
import Loader from "~~/components/Loader";
import { CanvasDrawLines, Lines } from "~~/types/ink";
import { getColorOptions } from "~~/utils/constants";

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
  //const [loadedLines, setLoadedLines] = useState()

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
  }, []);

  useEffect(() => {
    setPortrait(portraitCalc);
  }, [portraitCalc]);

  //Keyboard shortcuts
  // useHotkeys("ctrl+z", () => undo());
  useHotkeys("]", () => updateBrushRadius(brushRadius + 1));
  // useHotkeys("shift+]", () => updateBrushRadius(brushRadius + 10), { ignoreModifiers: true, preventDefault: true });
  useHotkeys("[", () => updateBrushRadius(brushRadius - 1));
  // useHotkeys("shift+[", () => updateBrushRadius(brushRadius - 10));
  useHotkeys(".", () => updateOpacity(0.01));
  // useHotkeys("shift+.", () => updateOpacity(0.1));
  useHotkeys(",", () => updateOpacity(-0.01));
  // useHotkeys("shift+,", () => updateOpacity(-0.1));

  const updateBrushRadius = useCallback((value: number | null) => {
    if (value !== null) {
      setBrushRadius(value);
    }
  }, []);

  const updateColor = (value: any) => {
    setColor(`rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`);
    console.log(`rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`);
  };

  const updateOpacity = useCallback((value: number) => {
    if (!drawingCanvas.current) return;
    const colorPlaceholder = drawingCanvas.current.props.brushColor
      .substring(5)
      .replace(")", "")
      .split(",")
      .map((e: string) => parseFloat(e));

    if ((colorPlaceholder[3] <= 0.01 && value < 0) || (colorPlaceholder[3] <= 0.1 && value < -0.01)) {
      setColor(`rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${colorPlaceholder[2]},${0})`);
    } else if ((colorPlaceholder[3] >= 0.99 && value > 0) || (colorPlaceholder[3] >= 0.9 && value > 0.01)) {
      setColor(`rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${colorPlaceholder[2]},${1})`);
    } else {
      setColor(
        `rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${colorPlaceholder[2]},${(
          colorPlaceholder[3] + value
        ).toFixed(2)})`,
      );
    }
  }, []);

  const saveDrawing = (newDrawing: any, saveOverride: boolean) => {
    setIsSaving(true);
    const colorPlaceholder = drawingCanvas?.current?.props.brushColor
      .substring(5)
      .replace(")", "")
      .split(",")
      .map(e => parseFloat(e));
    if (!colorPlaceholder) return;
    const opaqueColor = `rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${colorPlaceholder[2]},1)`;
    if (!recentColors.slice(-recentColorCount).includes(opaqueColor)) {
      console.log(opaqueColor, "adding to recent");
      setRecentColors(prevItems => [...prevItems.slice(-recentColorCount + 1), opaqueColor]);
    }
    // console.log(recentColors)

    currentLines.current = newDrawing.lines;
    //if(!loadedLines || newDrawing.lines.length >= loadedLines) {
    if (saveOverride) {
      const savedData = LZ.compress(newDrawing.getSaveData());
      handleChangeDrawing(savedData);
    }
    setIsSaving(false);
    //}
  };

  const { createInk, sending, setSending } = useCreateInk(
    drawingCanvas,
    connectedAddress,
    router,
    saveDrawing,
    handleChangeDrawing,
  );

  useEffect(() => {
    if (brushRadius <= 1) {
      setBrushRadius(1);
    } else if (brushRadius >= 100) {
      setBrushRadius(100);
    }
  }, [brushRadius, updateBrushRadius, updateOpacity]);

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
    // window.drawingCanvas = drawingCanvas;
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
    saveDrawing(drawingCanvas.current, true);
  };

  const { undo, downloadCanvas, uploadCanvas, fillBackground, drawFrame, saveDraft } = useCanvasActions(
    drawingCanvas,
    triggerOnChange,
    setDrafts,
    setCanvasFile,
  );

  const uploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files![0], "UTF-8");
    fileReader.onload = e => {
      setCanvasFile(JSON.parse(e.target!.result as string));
    };
  };

  const uploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSaving) {
      saveCanvas();
    }
  }, [isSaving]);

  const saveCanvas = () => {
    if (canvasDisabled || isDrawing) {
      console.log("Canvas disabled or drawing");
    } else {
      saveDrawing(drawingCanvas.current, true);
    }
  };

  const debouncedSaveCanvas = useDebounceCallback(() => {
    setIsSaving(true);
  }, 2000);

  useEffect(() => {
    return () => {
      debouncedSaveCanvas.cancel();
    };
  }, [debouncedSaveCanvas]);

  const handleCanvasChange = () => {
    if (drawingCanvas && drawingCanvas.current) {
      if (drawingCanvas?.current?.lines.length >= currentLines.current.length && canvasDisabled) {
        console.log("enabling it!");
        setCanvasDisabled(false);
      }
    }
  };

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
            onMouseUp={debouncedSaveCanvas}
            onTouchEnd={debouncedSaveCanvas}
          >
            <CanvasDraw
              ref={drawingCanvas}
              canvasWidth={size[0]}
              canvasHeight={size[1]}
              brushColor={color}
              lazyRadius={1}
              brushRadius={brushRadius}
              disabled={canvasDisabled}
              //  hideGrid={props.mode !== "edit"}
              //  hideInterface={props.mode !== "edit"}
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
