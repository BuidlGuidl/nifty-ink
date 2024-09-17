"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";
import {
  BgColorsOutlined,
  BookOutlined,
  BorderOutlined,
  ClearOutlined,
  DownloadOutlined,
  HighlightOutlined,
  InfoCircleOutlined,
  PlaySquareOutlined,
  SaveOutlined,
  UndoOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Row,
  Select,
  Slider,
  Space,
  Table,
  Tooltip,
  message,
} from "antd";
import * as Hash from "ipfs-only-hash";
import LZ from "lz-string";
// import { addToIPFS } from "./helpers";
import CanvasDraw from "react-canvas-draw";
import { AlphaPicker, CirclePicker, SketchPicker, TwitterPicker } from "react-color";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { useAccount } from "wagmi";
import Loader from "~~/components/Loader";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { checkAddressAndFund } from "~~/utils/checkAddressAndFund";
import { getColorOptions, shortCutsInfo, shortCutsInfoCols } from "~~/utils/constants";
import { addToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

// const Hash = require("ipfs-only-hash");
const pickers = [SketchPicker, CirclePicker];
const { Option } = Select;

interface CanvasDrawLines extends CanvasDraw {
  canvas: any;
  lines: Lines[];
  props: {
    // onChange: Function,
    // loadTimeOffset: PropTypes.number,
    // lazyRadius: PropTypes.number,
    // brushRadius: PropTypes.number,
    brushColor: string;
    // catenaryColor: PropTypes.string,
    // gridColor: PropTypes.string,
    // backgroundColor: PropTypes.string,
    // hideGrid: PropTypes.bool,
    canvasWidth: any;
    canvasHeight: any;
    // disabled: PropTypes.bool,
    // imgSrc: PropTypes.string,
    // saveData: PropTypes.string,
    // immediateLoading: PropTypes.bool,
    // hideInterface: PropTypes.bool,
    // gridSizeX: PropTypes.number,
    // gridSizeY: PropTypes.number,
    // gridLineWidth: PropTypes.number,
    // hideGridX: PropTypes.bool,
    // hideGridY: PropTypes.bool,
    // enablePanAndZoom: PropTypes.bool,
    // mouseZoomFactor: PropTypes.number,
    // zoomExtents: boundsProp,
    // clampLinesToDocument: PropTypes.bool,
  };
  // lines: Array<{ x: number; y: number }>;
}
interface Lines {
  background?: unknown;
  ref?: unknown;
  brushColor: string;
  brushRadius: number;
  points: Array<{ x: number; y: number }>;
  // lines: Array<{ x: number; y: number }>;
}

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
  const [drawing, setDrawing] = useLocalStorage("drawing", "");
  const mode = "edit";
  const [canvasKey, setCanvasKey] = useState(Date.now());
  const [ink, setInk] = useState({});

  const recentColorCount = 24;

  const colorOptions: ColorOptionsType = getColorOptions(recentColors, recentColorCount);

  const drawingCanvas = useRef<CanvasDrawLines>(null);

  const [size, setSize] = useState([calculatedCanvaSize, calculatedCanvaSize]); //["70vmin", "70vmin"]) //["50vmin", "50vmin"][750, 500]

  const [sending, setSending] = useState<boolean>(false);

  const [initialDrawing, setInitialDrawing] = useState<string>("");
  const currentLines = useRef<Lines[]>([]);
  const [canvasDisabled, setCanvasDisabled] = useState(false);
  const [loaded, setLoaded] = useState(true);
  //const [loadedLines, setLoadedLines] = useState()

  const [drawingSaved, setDrawingSaved] = useState(true);

  const portraitRatio = 1.7;
  const portraitCalc = width / size[0] < portraitRatio;

  const [portrait, setPortrait] = useState(false);
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyInk");
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
    if (saveOverride || newDrawing.lines.length < 100 || newDrawing.lines.length % 10 === 0) {
      console.log("saving");
      const savedData = LZ.compress(newDrawing.getSaveData());
      setDrawing(savedData);
      setDrawingSaved(true);
    } else {
      setDrawingSaved(false);
    }
    //}
  };

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
      setLoaded(true);
    };
    // window.drawingCanvas = drawingCanvas;
    loadPage();
  }, [drawing]);

  const pickerIndex = typeof picker === "number" ? picker % pickers.length : 0;
  const PickerDisplay: React.ComponentType<any> = pickers[pickerIndex];
  // const colors = colorOptions && colorOptions[colorArray] ? colorOptions[colorArray] : [];

  const mintInk = async (inkUrl: string, jsonUrl: string, limit: number, currentInk: any) => {
    let writeTxResult;

    try {
      writeTxResult = await writeYourContractAsync({
        functionName: "createInk",
        args: [inkUrl, jsonUrl, currentInk?.attributes[0]["value"]],
      });
    } catch (e) {
      console.log(e);
    }
    return writeTxResult;
  };

  const createInk = async (values: any) => {
    if (!drawingCanvas?.current) {
      notification.error("Your canvas is empty");
      return;
    }
    console.log("Inking:", values);

    setSending(true);

    const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");

    saveDrawing(drawingCanvas.current, true);

    //let decompressed = LZ.decompress(props.drawing)
    //let compressedArray = LZ.compressToUint8Array(decompressed)
    const compressedArray = LZ.compressToUint8Array(drawingCanvas?.current?.getSaveData());

    const drawingBuffer = Buffer.from(compressedArray);
    const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

    const drawingHash = await Hash.of(drawingBuffer);
    console.log("drawingHash", drawingHash);

    const imageHash = await Hash.of(imageBuffer);
    console.log("imageHash", imageHash);

    const timeInMs = new Date();

    const currentInk = {
      // ...ink,
      attributes: [
        {
          trait_type: "Limit",
          value: values.limit.toString(),
        },
      ],
      name: values.title,
      description: `A Nifty Ink by ${connectedAddress} on ${timeInMs}`,
      drawing: drawingHash,
      image: `https://ipfs.io/ipfs/${imageHash}`,
      external_url: `https://nifty.ink/${drawingHash}`,
    };

    const inkStr = JSON.stringify(currentInk);
    const inkBuffer = Buffer.from(inkStr);

    const jsonHash = await Hash.of(inkBuffer);
    console.log("jsonHash", jsonHash);

    let drawingResultInfura;
    let imageResultInfura;
    let inkResultInfura;

    try {
      const drawingResult = addToIPFS(drawingBuffer);
      const imageResult = addToIPFS(imageBuffer);
      const inkResult = addToIPFS(inkBuffer);

      // drawingResultInfura = addToIPFS(drawingBuffer, props.ipfsConfigInfura);
      // imageResultInfura = addToIPFS(imageBuffer, props.ipfsConfigInfura);
      // inkResultInfura = addToIPFS(inkBuffer, props.ipfsConfigInfura);

      await Promise.all([drawingResult, imageResult, inkResult]).then(values => {
        console.log("FINISHED UPLOADING TO PINNER", values);
        message.destroy();
      });
    } catch (e) {
      console.log(e);
      setSending(false);
      notification.error("📛 Ink upload failed. Please wait a moment and try again ${e.message}");

      return;
    }

    await checkAddressAndFund(connectedAddress);

    try {
      await writeYourContractAsync({
        functionName: "createInk",
        args: [drawingHash, jsonHash, values.limit.toString()],
      });

      Promise.all([drawingResultInfura, imageResultInfura, inkResultInfura]).then(values => {
        console.log("INFURA FINISHED UPLOADING!", values);
      });

      router.push("/ink/" + drawingHash);
      setSending(false);
      setDrawing("");
    } catch (e) {
      console.log(e);
      setSending(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

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

  const undo = () => {
    if (!drawingCanvas?.current?.lines?.length) return;

    if (drawingCanvas.current.lines[drawingCanvas.current.lines.length - 1]?.ref) {
      drawingCanvas.current.lines[0].brushColor =
        drawingCanvas.current.lines[drawingCanvas.current.lines.length - 1].brushColor;
      const lines = drawingCanvas.current.lines.slice(0, -1);
      triggerOnChange(lines);
    } else {
      const lines = drawingCanvas.current.lines.slice(0, -1);
      triggerOnChange(lines);
    }
  };

  const downloadCanvas = async () => {
    const myData = drawingCanvas?.current?.getSaveData();
    const fileName = `nifty_ink_canvas_${Date.now()}`;
    const json = JSON.stringify(myData);
    const blob = new Blob([json], { type: "application/json" });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files![0], "UTF-8");
    fileReader.onload = e => {
      setCanvasFile(JSON.parse(e.target!.result as string));
    };
  };

  const uploadRef = useRef<HTMLInputElement | null>(null);

  const uploadCanvas = (uploadedDrawing: any) => {
    drawingCanvas?.current?.loadSaveData(uploadedDrawing);
    saveDrawing(drawingCanvas.current, true);
    setCanvasFile(undefined);
  };

  const fillBackground = (color: string) => {
    if (!drawingCanvas.current) return;
    const width = drawingCanvas?.current.props.canvasWidth;
    const height = drawingCanvas?.current.props.canvasHeight;

    const bg = {
      brushColor: color,
      brushRadius: (width + height) / 2,
      points: [
        { x: 0, y: 0 },
        { x: width, y: height },
      ],
      background: true,
    };

    const previousBGColor = drawingCanvas.current.lines.filter(l => l?.ref).length
      ? drawingCanvas.current.lines[0].brushColor
      : "#FFF";

    const bgRef = {
      brushColor: previousBGColor,
      brushRadius: 1,
      points: [
        { x: -1, y: -1 },
        { x: -1, y: -1 },
      ],
      ref: true,
    };

    drawingCanvas.current.lines.filter(l => l.background).length
      ? drawingCanvas.current.lines.splice(0, 1, bg)
      : drawingCanvas.current.lines.unshift(bg);
    drawingCanvas.current.lines.push(bgRef);

    const lines = drawingCanvas.current.lines;

    triggerOnChange(lines);
  };

  const drawFrame = (color: string, radius: number) => {
    if (!drawingCanvas.current) return;

    const width = drawingCanvas.current.props.canvasWidth;
    const height = drawingCanvas.current.props.canvasHeight;

    drawingCanvas.current.lines.push({
      brushColor: color,
      brushRadius: radius,
      points: [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: width, y: height },
        { x: 0, y: height },
        { x: 0, y: height },
        { x: 0, y: 0 },
      ],
    });

    const lines = drawingCanvas.current.lines;

    triggerOnChange(lines);
  };

  const saveDraft = () => {
    if (!drawingCanvas.current) return;

    const imageData = drawingCanvas?.current?.canvas?.drawing.toDataURL("image/png");
    const savedData = LZ.compress(drawingCanvas.current.getSaveData());

    setDrafts((drafts: any) => {
      return [...drafts, { imageData, savedData }];
    });
  };

  let top, bottom, canvas, draftSaver;
  if (mode === "edit") {
    top = (
      <div style={{ margin: "0 auto", marginBottom: 16 }}>
        <Form
          layout={"inline"}
          name="createInk"
          //initialValues={{ limit: 0 }}
          onFinish={createInk}
          onFinishFailed={onFinishFailed}
          labelAlign={"left"}
          style={{ justifyContent: "center" }}
        >
          <Form.Item name="title" rules={[{ required: true, message: "What is this work of art called?" }]}>
            <Input placeholder={"name"} style={{ fontSize: 16 }} />
          </Form.Item>

          <Form.Item name="limit" rules={[{ required: true, message: "How many inks can be minted?" }]}>
            <InputNumber placeholder={"limit"} style={{ fontSize: 16 }} min={0} precision={0} />
          </Form.Item>

          <Form.Item>
            <Button loading={sending} type="primary" htmlType="submit">
              Ink!
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16 }}>
          <Tooltip title="save to local storage">
            <Button
              disabled={
                canvasDisabled || (drawingCanvas?.current?.lines && !drawingCanvas.current.lines.length) || false
              }
              onClick={() => {
                if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
                saveDrawing(drawingCanvas.current, true);
                console.log("drawing canvas current", drawingCanvas.current);
              }}
              icon={<SaveOutlined />}
            >
              {`${!drawingSaved ? "SAVE *" : "SAVED"}`}
            </Button>
          </Tooltip>
          <Button
            disabled={
              canvasDisabled ||
              (drawingCanvas &&
                drawingCanvas.current &&
                drawingCanvas.current.lines &&
                drawingCanvas.current.lines.length === 0) ||
              false
            }
            onClick={() => {
              if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
              undo();
            }}
            icon={<UndoOutlined />}
          >
            UNDO
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => {
              if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
              drawingCanvas?.current?.clear();
              // setLoadedLines();
              setDrawing("");
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<ClearOutlined />}>CLEAR</Button>
          </Popconfirm>
          <Button
            disabled={canvasDisabled || (drawingCanvas.current && !drawingCanvas?.current?.lines.length) || false}
            onClick={() => {
              if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
              drawingCanvas?.current?.loadSaveData(drawingCanvas.current.getSaveData(), false); //LZ.decompress(props.drawing), false)
              setCanvasDisabled(true);
            }}
            icon={<PlaySquareOutlined />}
          >
            PLAY
          </Button>
        </div>
      </div>
    );

    bottom = (
      <>
        <Row
          style={{
            margin: "0 auto",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "middle",
          }}
        >
          <Space>
            <Col>
              <Row style={{ justifyContent: "center", marginBottom: 10 }}>
                <Select
                  defaultValue={colorArray}
                  style={{ width: 200 }}
                  onChange={value => {
                    setColorArray(value);
                  }}
                >
                  <Option value={"recent"}>Recent</Option>
                  <Option value={"sketch"}>Sketch Palette</Option>
                  <Option value={"circle"}>Circle Palette</Option>
                  <Option value={"github"}>Github Palette</Option>
                  <Option value={"twitter"}>Twitter Palette</Option>
                  <Option value={"compact"}>Compact Palette</Option>
                  <Option value={"niftyone"}>Palette #1</Option>
                  <Option value={"niftytwo"}>Palette #2</Option>
                  <Option value={"niftythree"}>Palette #3</Option>
                  <Option value={"niftyfour"}>Palette #4</Option>
                  <Option value={"niftyfive"}>Palette #5</Option>
                  <Option value={"niftysix"}>Palette #6</Option>
                  <Option value={"niftyseven"}>Palette #7</Option>
                  <Option value={"niftyeight"}>Palette #8</Option>
                </Select>
                <Button
                  onClick={() => {
                    setPicker(picker + 1);
                  }}
                  icon={<HighlightOutlined />}
                ></Button>
              </Row>
              <Row
                style={{
                  backgroundColor: "#F4F4F4",
                  justifyContent: "center",
                  alignItems: "middle",
                  padding: 4,
                }}
              >
                <PickerDisplay
                  color={color}
                  onChangeComplete={updateColor}
                  colors={colorOptions[colorArray]}
                  presetColors={colorOptions[colorArray]}
                />
              </Row>
            </Col>
          </Space>
        </Row>
        <Row
          style={{
            margin: "0 auto",
            marginTop: "4vh",
            justifyContent: "center",
            alignItems: "middle",
          }}
        >
          <AlphaPicker onChangeComplete={updateColor} color={color} />
        </Row>
        <Row
          style={{
            margin: "0 auto",
            marginTop: "4vh",
            justifyContent: "center",
          }}
        >
          <Col span={12}>
            <Slider
              min={1}
              max={100}
              onChange={updateBrushRadius}
              value={typeof brushRadius === "number" ? brushRadius : 0}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              min={1}
              max={100}
              style={{ margin: "0 16px" }}
              value={brushRadius}
              onChange={updateBrushRadius}
            />
          </Col>
        </Row>
        <Row
          style={{
            margin: "0 auto",
            marginTop: "4vh",
            justifyContent: "center",
          }}
        >
          <Space>
            <Col span={4}>
              <Button onClick={() => fillBackground(color)} icon={<BgColorsOutlined />}>
                Background
              </Button>
            </Col>
            <Col span={4}>
              <Button onClick={() => drawFrame(color, brushRadius)} icon={<BorderOutlined />}>
                Frame
              </Button>
            </Col>
          </Space>
        </Row>
        <Row
          style={{
            width: "40vmin",
            margin: "0 auto",
            marginTop: "1vh",
            justifyContent: "center",
          }}
        >
          <Space>
            <Col span={4}>
              <Popover
                content={
                  <Table columns={shortCutsInfoCols} dataSource={shortCutsInfo} size="small" pagination={false} />
                }
                title="Keyboard shortcuts"
                trigger="click"
              >
                <Button icon={<InfoCircleOutlined />}>Shortcuts</Button>
              </Popover>
            </Col>
          </Space>
        </Row>
      </>
    );

    draftSaver = (
      <div>
        <Popconfirm
          title="Are you sure?"
          onConfirm={() => {
            saveDraft();
            Modal.success({
              title: "Your draft was successfully saved.",
            });
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button style={{ marginTop: "20px" }} icon={<SaveOutlined />}>
            Save as draft
          </Button>
        </Popconfirm>
        <Tooltip title="Download current drawing">
          <Button
            disabled={!drawingCanvas.current || (drawingCanvas.current && !drawingCanvas.current.lines.length)}
            onClick={async () => {
              if (canvasDisabled || (drawingCanvas.current && !drawingCanvas.current.lines)) return;
              await downloadCanvas();
            }}
            icon={<DownloadOutlined />}
          >
            DOWNLOAD
          </Button>
        </Tooltip>
        <Button
          onClick={() => {
            router.push("/create/drafts");
          }}
          icon={<BookOutlined />}
        >
          My Drafts
        </Button>
        <div style={{ marginTop: 16 }}>
          <input type="file" onChange={uploadFileChange} ref={uploadRef} />
          {canvasFile && (
            <Popconfirm
              title="This will replace your current drawing"
              onConfirm={async () => {
                await uploadCanvas(canvasFile);
                if (uploadRef.current) {
                  uploadRef.current.value = "";
                }
              }}
            >
              <Button>
                <UploadOutlined /> UPLOAD
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    );
  }

  const saveCanvas = () => {
    if (canvasDisabled) {
      console.log("Canvas disabled");
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

  return (
    <div className="create-ink-container mt-5">
      {portrait && <div className="title-top">{top}</div>}
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
            {!loaded && <Loader />}
            <CanvasDraw
              key={mode + "" + canvasKey}
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
      {portrait ? (
        <div className="edit-tools-bottom">
          {bottom}
          {draftSaver}
        </div>
      ) : (
        <div className="edit-tools">
          {top}
          <div className="edit-tools-side">
            {bottom}
            {draftSaver}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInk;
