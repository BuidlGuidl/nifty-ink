import Image from "next/image";
import { CreateInkGnosisForm } from "./CreateInkGnosisForm";
import { CreateInkZoraForm } from "./CreateInkZoraForm";
import { Chain } from "viem";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { isGnosisChain } from "~~/utils/helpers";

type CreateInkModalProps = {
  modalId: string;
  chain: Chain;
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const CreateInkModal = ({ modalId, chain, connectedAddress, drawingCanvas }: CreateInkModalProps) => {
  const isGnosis = isGnosisChain(chain.id);

  return (
    <div>
      <input type="checkbox" id={`${modalId}`} className="modal-toggle" />
      <label htmlFor={`${modalId}`} className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <label htmlFor={`${modalId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <div className="space-y-3 py-6">
            <div className="flex flex-col items-center gap-2">
              <div>
                <h2 className="text-2xl font-bold m-0 flex justify-center gap-2">
                  Create Ink on{" "}
                  <Image
                    src={`/${isGnosis ? "gnosisChain.png" : "baseChain.png"}`}
                    alt="chain"
                    width="32"
                    height="32"
                    className="object-contain aspect-square"
                  />
                </h2>
              </div>
              {isGnosis ? (
                <CreateInkGnosisForm connectedAddress={connectedAddress} drawingCanvas={drawingCanvas} />
              ) : (
                <CreateInkZoraForm
                  connectedAddress={connectedAddress}
                  drawingCanvas={drawingCanvas}
                  chainId={chain.id}
                />
              )}
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
