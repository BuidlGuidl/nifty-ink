import { PublishContent } from "./PublishContent";
import { Address as AddressType, Chain } from "viem";
import { CanvasDrawLines } from "~~/types/canvasDrawing";

type PublishModalProps = {
  connectedAddress: AddressType;
  modalId: string;
  chain: Chain | undefined;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const PublishModal = ({ connectedAddress, modalId, chain, drawingCanvas }: PublishModalProps) => {
  return (
    <>
      <div>
        <input type="checkbox" id={`${modalId}`} className="modal-toggle" />
        <label htmlFor={`${modalId}`} className="modal cursor-pointer">
          <label className="modal-box relative w-10/12 max-w-md">
            {/* dummy input to capture event onclick on modal box */}
            <input className="h-0 w-0 absolute top-0 left-0" />
            <label htmlFor={`${modalId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
              ✕
            </label>
            <div className="space-y-3 py-6">
              <div className="flex flex-col items-center gap-6">
                {chain && connectedAddress ? (
                  <PublishContent chain={chain} connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} />
                ) : (
                  <p>Please connect your wallet to proceed</p>
                )}
              </div>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
