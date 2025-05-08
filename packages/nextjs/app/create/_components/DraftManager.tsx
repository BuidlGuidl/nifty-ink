import React, { useCallback, useState } from "react";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Upload, UploadFile, UploadProps } from "antd";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { notification } from "~~/utils/scaffold-eth";

interface DraftManagerProps {
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  saveDrawing: (canvas: CanvasDrawLines, isUpload: boolean) => void;
}

export const DraftManager: React.FC<DraftManagerProps> = ({ drawingCanvas, saveDrawing }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const downloadCanvas = useCallback(async () => {
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
  }, [drawingCanvas]);

  const uploadCanvas = useCallback(
    (file: any) => {
      try {
        const fileReader = new FileReader();
        fileReader.readAsText(file.originFileObj as Blob, "UTF-8");
        fileReader.onload = e => {
          const result = JSON.parse(e.target?.result as string);
          if (result && drawingCanvas.current) {
            drawingCanvas.current.loadSaveData(result);
            saveDrawing(drawingCanvas.current, true);
          }
        };
      } catch (error) {
        notification.error("file upload failed");
      }
    },
    [drawingCanvas, saveDrawing],
  );

  const uploadProps: UploadProps = {
    onChange({ file }) {
      if (file.status === "uploading") {
        setFileList([file]);
      } else if (file.status === "done") {
        setIsFileUploaded(true);
      } else if (file.status === "error") {
        notification.error("file upload failed");
      }
    },
    customRequest({ onSuccess }) {
      // Prevent actual upload behavior, simulate success
      setTimeout(() => {
        onSuccess?.("ok");
      }, 0);
    },
  };
  return (
    <div className="flex items-center mt-4 gap-2">
      <Button
        disabled={!drawingCanvas.current || (drawingCanvas.current && !drawingCanvas.current.lines.length)}
        onClick={async () => {
          if (drawingCanvas.current && !drawingCanvas.current.lines) return;
          await downloadCanvas();
        }}
        icon={<DownloadOutlined />}
        className="tooltip tooltip-primary"
        data-tip="Download current drawing"
      >
        Download
      </Button>
      <Popconfirm
        title="This will replace your current drawing"
        onConfirm={async () => {
          await uploadCanvas(fileList[0]);
          setFileList([]);
          setIsFileUploaded(false);
        }}
        onCancel={() => {
          setFileList([]);
          setIsFileUploaded(false);
        }}
        open={isFileUploaded}
      >
        <Upload {...uploadProps} fileList={fileList} showUploadList={false} maxCount={1}>
          <Button
            icon={<UploadOutlined />}
            className="tooltip tooltip-primary"
            data-tip="Upload previously downloaded drawing"
          >
            Upload
          </Button>
        </Upload>
      </Popconfirm>
    </div>
  );
};
