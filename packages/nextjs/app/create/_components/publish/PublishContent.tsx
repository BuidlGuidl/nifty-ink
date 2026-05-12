import { GnosisForm } from "./GnosisForm";
import { CanvasDrawLines } from "~~/types/canvasDrawing";

type PublishContentProps = {
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const PublishContent = ({ connectedAddress, drawingCanvas }: PublishContentProps) => {
  return (
    <div>
      <GnosisForm connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} />
    </div>
  );
};
