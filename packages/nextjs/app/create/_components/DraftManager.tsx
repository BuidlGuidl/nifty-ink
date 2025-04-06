import React from "react";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { CanvasDrawLines } from "~~/types/canvasDrawing";

interface DraftManagerProps {
  downloadCanvas: () => Promise<void>;
  uploadFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadCanvas: (uploadedDrawing: any) => void;
  canvasFile: File | null;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  uploadRef: React.RefObject<HTMLInputElement>;
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  downloadCanvas,
  uploadFileChange,
  uploadCanvas,
  canvasFile,
  drawingCanvas,
  uploadRef,
}) => {
  return (
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
      <Tooltip title="Download current drawing">
        <Button
          disabled={!drawingCanvas.current || (drawingCanvas.current && !drawingCanvas.current.lines.length)}
          onClick={async () => {
            if (drawingCanvas.current && !drawingCanvas.current.lines) return;
            await downloadCanvas();
          }}
          icon={<DownloadOutlined />}
        >
          DOWNLOAD
        </Button>
      </Tooltip>
    </div>
  );
};
