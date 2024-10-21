import React from "react";
import { useRouter } from "next/navigation";
import { BookOutlined, DownloadOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Modal, Popconfirm, Tooltip } from "antd";
import { CanvasDrawLines } from "~~/types/ink";

interface DraftManagerProps {
  saveDraft: () => void;
  downloadCanvas: () => Promise<void>;
  uploadFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadCanvas: (uploadedDrawing: any) => void;
  canvasFile: File | null;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  uploadRef: React.RefObject<HTMLInputElement>;
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  saveDraft,
  downloadCanvas,
  uploadFileChange,
  uploadCanvas,
  canvasFile,
  drawingCanvas,
  uploadRef,
}) => {
  const router = useRouter();

  return (
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
            if (drawingCanvas.current && !drawingCanvas.current.lines) return;
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
};
