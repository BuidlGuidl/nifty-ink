import React, { useCallback, useState } from "react";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip, Upload, UploadFile, UploadProps } from "antd";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { notification } from "~~/utils/scaffold-eth";

interface DraftManagerProps {
  uploadCanvas: (uploadedDrawing: any) => void;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
}

export const DraftManager: React.FC<DraftManagerProps> = ({ uploadCanvas, drawingCanvas }) => {
  const [canvasFile, setCanvasFile] = useState<any>(null);
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

  const uploadProps: UploadProps = {
    onChange({ file }) {
      if (file.status === "uploading") {
        setFileList([file]);
      } else if (file.status === "done") {
        try {
          setIsFileUploaded(true);
          const fileReader = new FileReader();
          fileReader.readAsText(file.originFileObj as Blob, "UTF-8");
          fileReader.onload = e => {
            setCanvasFile(JSON.parse(e.target!.result as string));
          };
        } catch (error) {
          notification.error("file upload failed");
        }
      } else if (file.status === "error") {
        notification.error("file upload failed");
      }
    },
  };
  return (
    <div className="flex flex-col items-center mt-4 gap-2">
      <Tooltip title="Download current drawing">
        <Button
          disabled={!drawingCanvas.current || (drawingCanvas.current && !drawingCanvas.current.lines.length)}
          onClick={async () => {
            if (drawingCanvas.current && !drawingCanvas.current.lines) return;
            await downloadCanvas();
          }}
          icon={<DownloadOutlined />}
        >
          Download
        </Button>
      </Tooltip>
      <Popconfirm
        title="This will replace your current drawing"
        onConfirm={async () => {
          await uploadCanvas(canvasFile);
          setCanvasFile(null);
          setFileList([]);
          setIsFileUploaded(false);
        }}
        onCancel={() => {
          setCanvasFile(null);
          setFileList([]);
          setIsFileUploaded(false);
        }}
        open={isFileUploaded}
      >
        <Upload {...uploadProps} fileList={fileList} maxCount={1}>
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
      </Popconfirm>
    </div>
  );
};
