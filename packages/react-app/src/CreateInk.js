import React, { useState, useRef, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import "antd/dist/antd.css";
import "./App.css";
import {
  UndoOutlined,
  ClearOutlined,
  PlaySquareOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  BorderOutlined,
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import {
  Row,
  Modal,
  Column,
  Button,
  Input,
  InputNumber,
  Form,
  message,
  Col,
  Slider,
  Space,
  notification,
  Popconfirm,
  Tooltip,
  Popover,
  Table,
  Select,
} from "antd";
import { useLocalStorage } from "./hooks";
import { addToIPFS, transactionHandler } from "./helpers";
import CanvasDraw from "react-canvas-draw";
import {
  SketchPicker,
  CirclePicker,
  TwitterPicker,
  AlphaPicker,
} from "react-color";
import LZ from "lz-string";
import { useHotkeys } from "react-hotkeys-hook";

const Hash = require("ipfs-only-hash");
const pickers = [SketchPicker, CirclePicker];
const { Option } = Select;

export default function CreateInk(props) {
  let history = useHistory();

  const [picker, setPicker] = useLocalStorage("picker", 0);
  const [color, setColor] = useLocalStorage("color", "rgba(102,102,102,1)");
  const [brushRadius, setBrushRadius] = useState(8);
  const [recentColors, setRecentColors] = useLocalStorage("recentColors", [
    "rgba(102,102,102,1)",
  ]);
  const [colorArray, setColorArray] = useLocalStorage("colorArray", "twitter");
  const [_, setDrafts] = useLocalStorage("drafts", []);
  const [canvasFile, setCanvasFile] = useState(null);

  const recentColorCount = 24;

  const colorOptions = {
    block: [
      "#D9E3F0",
      "#F47373",
      "#697689",
      "#37D67A",
      "#2CCCE4",
      "#555555",
      "#dce775",
      "#ff8a65",
      "#ba68c8",
    ],
    circle: [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#cddc39",
      "#ffeb3b",
      "#ffc107",
      "#ff9800",
      "#ff5722",
      "#795548",
      "#607d8b",
    ],
    github: [
      "#B80000",
      "#DB3E00",
      "#FCCB00",
      "#008B02",
      "#006B76",
      "#1273DE",
      "#004DCF",
      "#5300EB",
      "#EB9694",
      "#FAD0C3",
      "#FEF3BD",
      "#C1E1C5",
      "#BEDADC",
      "#C4DEF6",
      "#BED3F3",
      "#D4C4FB",
    ],
    twitter: [
      "#FF6900",
      "#FCB900",
      "#7BDCB5",
      "#00D084",
      "#8ED1FC",
      "#0693E3",
      "#ABB8C3",
      "#EB144C",
      "#F78DA7",
      "#9900EF",
    ],
    compact: [
      "#4D4D4D",
      "#999999",
      "#FFFFFF",
      "#F44E3B",
      "#FE9200",
      "#FCDC00",
      "#DBDF00",
      "#A4DD00",
      "#68CCCA",
      "#73D8FF",
      "#AEA1FF",
      "#FDA1FF",
      "#333333",
      "#808080",
      "#cccccc",
      "#D33115",
      "#E27300",
      "#FCC400",
      "#B0BC00",
      "#68BC00",
      "#16A5A5",
      "#009CE0",
      "#7B64FF",
      "#FA28FF",
      "#000000",
      "#666666",
      "#B3B3B3",
      "#9F0500",
      "#C45100",
      "#FB9E00",
      "#808900",
      "#194D33",
      "#0C797D",
      "#0062B1",
      "#653294",
      "#AB149E",
    ],
    sketch: [
      "#D0021B",
      "#F5A623",
      "#F8E71C",
      "#8B572A",
      "#7ED321",
      "#417505",
      "#BD10E0",
      "#9013FE",
      "#4A90E2",
      "#50E3C2",
      "#B8E986",
      "#000000",
      "#4A4A4A",
      "#9B9B9B",
      "#FFFFFF",
    ],
    niftyone: ["#00171F", "#003459", "#00A7EA", "#FFFFFF", "#007EA7"],
    niftytwo: ["#306B34", "#1C5253", "#F3FFC6", "#C3EB78", "#B6174B"],
    niftythree: ["#020202", "#0D324D", "#7F5A83", "#A188A6", "#9DA2AB"],
    niftyfour: ["#1F2041", "#FFC857", "#19647E", "#119DA4", "#4B3F72"],
    niftyfive: ["#141414", "#426C8F", "#B8DBD9", "#F4F4F9", "#04724D"],
    niftysix: ["#2274A5", "#E7EB90", "#FADF63", "#E6AF2E", "#632B30"],
    niftyseven: ["#C05746", "#ADC698", "#D0E3C4", "#FFFFFF", "#503047"],
    niftyeight: ["#0E7C7B", "#17BEBB", "#D62246", "#D4F4DD", "#4B1D3F"],
    recent: recentColors.slice(-recentColorCount),
  };

  const drawingCanvas = useRef(null);
  const [size, setSize] = useState([
    0.85 * props.calculatedVmin,
    0.85 * props.calculatedVmin,
  ]); //["70vmin", "70vmin"]) //["50vmin", "50vmin"][750, 500]

  const [sending, setSending] = useState();
  const [drawingSize, setDrawingSize] = useState(0);

  const [initialDrawing, setInitialDrawing] = useState();
  const currentLines = useRef([]);
  const drawnLines = useRef([]);
  const [canvasDisabled, setCanvasDisabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  //const [loadedLines, setLoadedLines] = useState()

  const [drawingSaved, setDrawingSaved] = useState(true);

  const portraitRatio = 1.7;
  const portraitCalc =
    window.document.body.clientWidth / size[0] < portraitRatio;

  const [portrait, setPortrait] = useState(portraitCalc);

  function debounce(fn, ms) {
    let timer;
    return (_) => {
      clearTimeout(timer);
      timer = setTimeout((_) => {
        timer = null;
        fn.apply(this, arguments);
      }, ms);
    };
  }

  useEffect(() => {
    const debouncedHandleResize = debounce(function handleResize() {
      let _portraitCalc =
        window.document.body.clientWidth / size[0] < portraitRatio;
      //console.log(_portraitCalc?"portrait mode":"landscape mode")
      setPortrait(_portraitCalc);
    }, 500);

    window.addEventListener("resize", debouncedHandleResize);

    return (_) => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  const isPortrait =
    window.document.body.clientHeight > window.document.body.clientWidth;

  //Keyboard shortcuts
  useHotkeys("ctrl+z", () => undo());
  useHotkeys("]", () => updateBrushRadius((brushRadius) => brushRadius + 1));
  useHotkeys("shift+]", () =>
    updateBrushRadius((brushRadius) => brushRadius + 10)
  );
  useHotkeys("[", () => updateBrushRadius((brushRadius) => brushRadius - 1));
  useHotkeys("shift+[", () =>
    updateBrushRadius((brushRadius) => brushRadius - 10)
  );
  useHotkeys(".", () => updateOpacity(0.01));
  useHotkeys("shift+.", () => updateOpacity(0.1));
  useHotkeys(",", () => updateOpacity(-0.01));
  useHotkeys("shift+,", () => updateOpacity(-0.1));

  const updateBrushRadius = useCallback((value) => {
    setBrushRadius(value);
  });

  const updateColor = (value) => {
    console.log(value);
    setColor(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    );
    console.log(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    );
  };

  const updateOpacity = useCallback((value) => {
    let colorPlaceholder = drawingCanvas.current.props.brushColor
      .substring(5)
      .replace(")", "")
      .split(",")
      .map((e) => parseFloat(e));

    if (
      (colorPlaceholder[3] <= 0.01 && value < 0) ||
      (colorPlaceholder[3] <= 0.1 && value < -0.01)
    ) {
      setColor(
        `rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${
          colorPlaceholder[2]
        },${0})`
      );
    } else if (
      (colorPlaceholder[3] >= 0.99 && value > 0) ||
      (colorPlaceholder[3] >= 0.9 && value > 0.01)
    ) {
      setColor(
        `rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${
          colorPlaceholder[2]
        },${1})`
      );
    } else {
      setColor(
        `rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${
          colorPlaceholder[2]
        },${(colorPlaceholder[3] + value).toFixed(2)})`
      );
    }
  });

  const saveDrawing = (newDrawing, saveOverride) => {
    let colorPlaceholder = drawingCanvas.current.props.brushColor
      .substring(5)
      .replace(")", "")
      .split(",")
      .map((e) => parseFloat(e));
    let opaqueColor = `rgba(${colorPlaceholder[0]},${colorPlaceholder[1]},${colorPlaceholder[2]},1)`;
    if (!recentColors.slice(-recentColorCount).includes(opaqueColor)) {
      console.log(opaqueColor, "adding to recent");
      setRecentColors((prevItems) => [
        ...prevItems.slice(-recentColorCount + 1),
        opaqueColor,
      ]);
    }
    // console.log(recentColors)

    currentLines.current = newDrawing.lines;
    //if(!loadedLines || newDrawing.lines.length >= loadedLines) {
    if (
      saveOverride ||
      newDrawing.lines.length < 100 ||
      newDrawing.lines.length % 10 === 0
    ) {
      console.log("saving");
      let savedData = LZ.compress(newDrawing.getSaveData());
      props.setDrawing(savedData);
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
      if (props.drawing && props.drawing !== "") {
        console.log("Loading ink");
        try {
          let decompressed = LZ.decompress(props.drawing);
          currentLines.current = JSON.parse(decompressed)["lines"];

          let points = 0;
          for (const line of currentLines.current) {
            points = points + line.points.length;
          }

          console.log("Drawing points", currentLines.current.length, points);
          setDrawingSize(points);
          //setLoadedLines(JSON.parse(decompressed)['lines'].length)

          //console.log(decompressed)
          //drawingCanvas.current.loadSaveData(decompressed, true)
          setInitialDrawing(decompressed);
        } catch (e) {
          console.log(e);
        }
      }
      setLoaded(true);
    };
    window.drawingCanvas = drawingCanvas;
    loadPage();
  }, [props.drawing]);

  const PickerDisplay = pickers[picker % pickers.length];

  const mintInk = async (inkUrl, jsonUrl, limit) => {
    let contractName = "NiftyInk";
    let regularFunction = "createInk";
    let regularFunctionArgs = [
      inkUrl,
      jsonUrl,
      props.ink.attributes[0]["value"],
    ];
    let signatureFunction = "createInkFromSignature";
    let signatureFunctionArgs = [
      inkUrl,
      jsonUrl,
      props.ink.attributes[0]["value"],
      props.address,
    ];
    let getSignatureTypes = [
      "bytes",
      "bytes",
      "address",
      "address",
      "string",
      "string",
      "uint256",
    ];
    let getSignatureArgs = [
      "0x19",
      "0x00",
      props.readKovanContracts["NiftyInk"].address,
      props.address,
      inkUrl,
      jsonUrl,
      limit,
    ];

    let createInkConfig = {
      ...props.transactionConfig.current,
      contractName,
      regularFunction,
      regularFunctionArgs,
      signatureFunction,
      signatureFunctionArgs,
      getSignatureTypes,
      getSignatureArgs,
    };

    console.log(createInkConfig);

    let result = await transactionHandler(createInkConfig);

    return result;
  };

  const createInk = async (values) => {
    console.log("Inking:", values);

    setSending(true);

    let imageData = drawingCanvas.current.canvas.drawing.toDataURL("image/png");

    saveDrawing(drawingCanvas.current, true);

    //let decompressed = LZ.decompress(props.drawing)
    //let compressedArray = LZ.compressToUint8Array(decompressed)
    let compressedArray = LZ.compressToUint8Array(
      drawingCanvas.current.getSaveData()
    );

    let drawingBuffer = Buffer.from(compressedArray);
    let imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

    let currentInk = props.ink;

    currentInk["attributes"] = [
      {
        trait_type: "Limit",
        value: values.limit.toString(),
      },
    ];
    currentInk["name"] = values.title;
    let newEns;
    try {
      newEns = await props.mainnetProvider.lookupAddress(props.address);
    } catch (e) {
      console.log(e);
    }
    const timeInMs = new Date();
    const addressForDescription = !newEns ? props.address : newEns;
    currentInk["description"] =
      "A Nifty Ink by " +
      addressForDescription +
      " on " +
      timeInMs.toUTCString();

    props.setIpfsHash();

    const drawingHash = await Hash.of(drawingBuffer);
    console.log("drawingHash", drawingHash);
    const imageHash = await Hash.of(imageBuffer);
    console.log("imageHash", imageHash);

    currentInk["drawing"] = drawingHash;
    currentInk["image"] = "https://ipfs.io/ipfs/" + imageHash;
    currentInk["external_url"] = "https://nifty.ink/" + drawingHash;
    props.setInk(currentInk);
    console.log("Ink:", props.ink);

    var inkStr = JSON.stringify(props.ink);
    const inkBuffer = Buffer.from(inkStr);

    const jsonHash = await Hash.of(inkBuffer);
    console.log("jsonHash", jsonHash);

    let drawingResultInfura;
    let imageResultInfura;
    let inkResultInfura;

    try {
      const drawingResult = addToIPFS(drawingBuffer, props.ipfsConfig);
      const imageResult = addToIPFS(imageBuffer, props.ipfsConfig);
      const inkResult = addToIPFS(inkBuffer, props.ipfsConfig);

      // drawingResultInfura = addToIPFS(drawingBuffer, props.ipfsConfigInfura);
      // imageResultInfura = addToIPFS(imageBuffer, props.ipfsConfigInfura);
      // inkResultInfura = addToIPFS(inkBuffer, props.ipfsConfigInfura);

      await Promise.all([drawingResult, imageResult, inkResult]).then(
        (values) => {
          console.log("FINISHED UPLOADING TO PINNER", values);
          message.destroy();
        }
      );
    } catch (e) {
      console.log(e);
      setSending(false);
      notification.open({
        message: "📛 Ink upload failed",
        description: `Please wait a moment and try again ${e.message}`,
      });

      return;
    }

    try {
      var mintResult = await mintInk(
        drawingHash,
        jsonHash,
        values.limit.toString()
      );
    } catch (e) {
      console.log(e);
      setSending(false);
    }

    if (mintResult) {
      Promise.all([
        drawingResultInfura,
        imageResultInfura,
        inkResultInfura,
      ]).then((values) => {
        console.log("INFURA FINISHED UPLOADING!", values);
      });

      setSending(false);
      props.setViewDrawing(drawingCanvas.current.getSaveData()); //LZ.decompress(props.drawing))
      setDrawingSize(10000);
      props.setDrawing("");
      history.push("/ink/" + drawingHash);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const triggerOnChange = (lines) => {
    let saved = JSON.stringify({
      lines: lines,
      width: drawingCanvas.current.props.canvasWidth,
      height: drawingCanvas.current.props.canvasHeight,
    });

    drawingCanvas.current.loadSaveData(saved, true);
    //setLoadedLines(lines.length)
    //setInitialDrawing(saved)
    drawingCanvas.current.lines = lines;
    saveDrawing(drawingCanvas.current, true);
  };

  const undo = () => {
    if (!drawingCanvas.current.lines.length) return;

    if (
      drawingCanvas.current.lines[drawingCanvas.current.lines.length - 1].ref
    ) {
      drawingCanvas.current.lines[0].brushColor =
        drawingCanvas.current.lines[
          drawingCanvas.current.lines.length - 1
        ].brushColor;
      let lines = drawingCanvas.current.lines.slice(0, -1);
      triggerOnChange(lines);
    } else {
      let lines = drawingCanvas.current.lines.slice(0, -1);
      triggerOnChange(lines);
    }
  };

  const downloadCanvas = async () => {
    const myData = drawingCanvas.current.getSaveData(); //drawingCanvas.current.lines; // I am assuming that "this.state.myData"
    // is an object and I wrote it to file as
    // json
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

  const uploadFileChange = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      setCanvasFile(JSON.parse(e.target.result));
    };
  };

  const uploadRef = useRef();

  const uploadCanvas = (uploadedDrawing) => {
    //triggerOnChange(lines); -> bug with resizing
    //setInitialDrawing(uploadedDrawing); -> bug we re-uploading
    drawingCanvas.current.loadSaveData(uploadedDrawing);
    saveDrawing(drawingCanvas.current, true);
    setCanvasFile();
  };

  const fillBackground = (color) => {
    let width = drawingCanvas.current.props.canvasWidth;
    let height = drawingCanvas.current.props.canvasHeight;

    let bg = {
      brushColor: color,
      brushRadius: (width + height) / 2,
      points: [
        { x: 0, y: 0 },
        { x: width, y: height },
      ],
      background: true,
    };

    let previousBGColor = drawingCanvas.current.lines.filter((l) => l.ref)
      .length
      ? drawingCanvas.current.lines[0].brushColor
      : "#FFF";

    let bgRef = {
      brushColor: previousBGColor,
      brushRadius: 1,
      points: [
        { x: -1, y: -1 },
        { x: -1, y: -1 },
      ],
      ref: true,
    };

    drawingCanvas.current.lines.filter((l) => l.background).length
      ? drawingCanvas.current.lines.splice(0, 1, bg)
      : drawingCanvas.current.lines.unshift(bg);
    drawingCanvas.current.lines.push(bgRef);

    let lines = drawingCanvas.current.lines;

    triggerOnChange(lines);
  };

  const drawFrame = (color, radius) => {
    let width = drawingCanvas.current.props.canvasWidth;
    let height = drawingCanvas.current.props.canvasHeight;

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

    let lines = drawingCanvas.current.lines;

    triggerOnChange(lines);
  };

  const saveDraft = () => {
    let imageData = drawingCanvas.current.canvas.drawing.toDataURL("image/png");
    let savedData = LZ.compress(drawingCanvas.current.getSaveData());

    setDrafts((drafts) => {
      return [...drafts, { imageData, savedData }];
    });
  };

  let top, bottom, canvas, shortcutsPopover, draftSaver;
  if (props.mode === "edit") {
    top = (
      <div style={{ margin: "0 auto", marginBottom: 16 }}>
        <Form
          layout={"inline"}
          name="createInk"
          //initialValues={{ limit: 0 }}
          onFinish={createInk}
          onFinishFailed={onFinishFailed}
          labelAlign={"middle"}
          style={{ justifyContent: "center" }}
        >
          <Form.Item></Form.Item>

          <Form.Item
            name="title"
            rules={[
              { required: true, message: "What is this work of art called?" },
            ]}
          >
            <Input placeholder={"name"} style={{ fontSize: 16 }} />
          </Form.Item>

          <Form.Item
            name="limit"
            rules={[
              { required: true, message: "How many inks can be minted?" },
            ]}
          >
            <InputNumber
              placeholder={"limit"}
              style={{ fontSize: 16 }}
              min={0}
              precision={0}
            />
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
                canvasDisabled ||
                (drawingCanvas.current && !drawingCanvas.current.lines.length)
              }
              onClick={() => {
                if (
                  canvasDisabled ||
                  (drawingCanvas.current && !drawingCanvas.current.lines)
                )
                  return;
                saveDrawing(drawingCanvas.current, true);
                console.log("drawing canvas current", drawingCanvas.current);
              }}
            >
              <SaveOutlined /> {`${!drawingSaved ? "SAVE *" : "SAVED"}`}
            </Button>
          </Tooltip>
          <Button
            disabled={
              canvasDisabled ||
              (drawingCanvas.current && !drawingCanvas.current.lines.length)
            }
            onClick={() => {
              if (
                canvasDisabled ||
                (drawingCanvas.current && !drawingCanvas.current.lines)
              )
                return;
              undo();
            }}
          >
            <UndoOutlined /> UNDO
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => {
              if (
                canvasDisabled ||
                (drawingCanvas.current && !drawingCanvas.current.lines)
              )
                return;
              drawingCanvas.current.clear();
              //setLoadedLines()
              props.setDrawing();
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button>
              <ClearOutlined /> CLEAR
            </Button>
          </Popconfirm>
          <Button
            disabled={
              canvasDisabled ||
              (drawingCanvas.current && !drawingCanvas.current.lines.length)
            }
            onClick={() => {
              if (
                canvasDisabled ||
                (drawingCanvas.current && !drawingCanvas.current.lines)
              )
                return;
              drawingCanvas.current.loadSaveData(
                drawingCanvas.current.getSaveData(),
                false
              ); //LZ.decompress(props.drawing), false)
              setCanvasDisabled(true);
            }}
          >
            <PlaySquareOutlined /> PLAY
          </Button>
        </div>
      </div>
    );

    shortcutsPopover = (
      <Table
        columns={[
          { title: "Hotkey", dataIndex: "shortcut" },
          { title: "Action", dataIndex: "action" },
        ]}
        dataSource={[
          { key: "1", shortcut: "Ctrl+z", action: "Undo" },
          { key: "2", shortcut: "]", action: "Increase brush size by 1" },
          {
            key: "3",
            shortcut: "Shift+]",
            action: "Increase brush size by 10",
          },
          { key: "4", shortcut: "[", action: "Decrease brush size by 1" },
          {
            key: "5",
            shortcut: "Shift+[",
            action: "Decrease brush size by 10",
          },
          {
            key: "6",
            shortcut: "> ",
            action: "Increase current color opacity by 1%",
          },
          {
            key: "7",
            shortcut: "Shift+> ",
            action: "Increase current color opacity by 10%",
          },
          {
            key: "8",
            shortcut: "<",
            action: "Decrease current color opacity by 1%",
          },
          {
            key: "9",
            shortcut: "Shift+< ",
            action: "Decrease current color opacity by 10%",
          },
        ]}
        size="small"
        pagination={false}
      />
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
                  onChange={(value) => {
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
                >
                  <HighlightOutlined />
                </Button>
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
              <Button onClick={() => fillBackground(color)}>
                <BgColorsOutlined />
                Background
              </Button>
            </Col>
            <Col span={4}>
              <Button onClick={() => drawFrame(color, brushRadius)}>
                <BorderOutlined />
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
                content={shortcutsPopover}
                title="Keyboard shortcuts"
                trigger="click"
              >
                <Button>
                  <InfoCircleOutlined />
                  Shortcuts
                </Button>
              </Popover>
            </Col>
          </Space>
        </Row>
      </>
    );

    const saveCanvas = () => {
      if (canvasDisabled) {
        console.log("Canvas disabled");
      } else {
        saveDrawing(drawingCanvas.current, false);
      }
    };

    canvas = (
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
        {!loaded && <span>Loading...</span>}
        <CanvasDraw
          key={props.mode + "" + props.canvasKey}
          ref={drawingCanvas}
          canvasWidth={size[0]}
          canvasHeight={size[1]}
          brushColor={color}
          lazyRadius={1}
          brushRadius={brushRadius}
          disabled={canvasDisabled}
          //  hideGrid={props.mode !== "edit"}
          //  hideInterface={props.mode !== "edit"}
          onChange={() => {
            drawnLines.current = drawingCanvas.current.lines;
            if (
              drawnLines.current.length >= currentLines.current.length &&
              canvasDisabled
            ) {
              console.log("enabling it!");
              setCanvasDisabled(false);
            }
          }}
          saveData={initialDrawing}
          immediateLoading={true} //drawingSize >= 10000}
          loadTimeOffset={3}
        />
      </div>
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
          <Button style={{ marginTop: "20px" }}>
            <SaveOutlined /> Save as draft
          </Button>
        </Popconfirm>
        <Tooltip title="Download current drawing">
          <Button
            disabled={
              !drawingCanvas.current ||
              (drawingCanvas.current && !drawingCanvas.current.lines.length)
            }
            onClick={async () => {
              if (
                canvasDisabled ||
                (drawingCanvas.current && !drawingCanvas.current.lines)
              )
                return;
              await downloadCanvas();
            }}
          >
            <DownloadOutlined /> DOWNLOAD
          </Button>
        </Tooltip>
        <Button onClick={() => history.push("/create/drafts")}>
          <BookOutlined />
          My Drafts
        </Button>
        <div style={{ marginTop: 16 }}>
          <input type="file" onChange={uploadFileChange} ref={uploadRef} />
          {canvasFile && (
            <Popconfirm
              title="This will replace your current drawing"
              onConfirm={async () => {
                await uploadCanvas(canvasFile);
                uploadRef.current.value = "";
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

  return (
    <div
      className="create-ink-container" /*onClick={
    () => {
      if(props.mode=="mint"){
         drawingCanvas.current.loadSaveData(LZ.decompress(props.drawing), false)
      }
    }
  }*/
    >
      {
        <>
          {portrait && <div className="title-top">{top}</div>}
          <div className="canvas">{canvas}</div>
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
        </>
      }
    </div>
  );
}
