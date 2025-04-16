import { useState } from "react";
import { useRouter } from "next/navigation";
import LZ from "lz-string";
import { FormInput } from "~~/components/shared/FormInput";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { checkAddressAndFund } from "~~/utils/checkAddressAndFund";
import { uploadToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

type GnosisFormProps = {
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const GnosisForm = ({ connectedAddress, drawingCanvas }: GnosisFormProps) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [inkName, setInkName] = useState<string>("");
  const [inkNumber, setInkNumber] = useState<number | undefined>(undefined);
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyInk");

  const createInkGnosis = async () => {
    try {
      setIsCreating(true);

      // Prepare data for uploads
      const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");
      const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

      const saveData = drawingCanvas?.current?.getSaveData();
      if (!saveData) {
        throw new Error("Failed to get save data from canvas");
      }
      const compressedArray = LZ.compressToUint8Array(saveData);
      const drawingBuffer = Buffer.from(compressedArray);

      // Parallelize image and drawing uploads
      const [uploadedImage, uploadedDrawing] = await Promise.all([
        uploadToIPFS(imageBuffer, "buffer"),
        uploadToIPFS(drawingBuffer, "buffer"),
      ]);

      if (!uploadedImage.success) {
        throw new Error("Failed to upload image to IPFS");
      }

      if (!uploadedDrawing.success) {
        throw new Error("Failed to upload drawing to IPFS");
      }

      const imageCID = uploadedImage.cid.toString();
      const drawingCID = uploadedDrawing.cid.toString();

      const timeInMs = new Date();
      const currentInk = {
        attributes: [
          {
            trait_type: "Limit",
            value: (inkNumber ?? 0).toString(),
          },
        ],
        name: inkName,
        description: `A Nifty Ink by ${connectedAddress} on ${timeInMs}`,
        drawing: drawingCID,
        image: `https://ipfs.io/ipfs/${imageCID}`,
        external_url: `https://nifty.ink/${drawingCID}`,
      };

      const inkStr = JSON.stringify(currentInk);
      const inkBuffer = Buffer.from(inkStr);

      // Run address check in parallel with ink upload
      const [uploadedInk, _] = await Promise.all([
        uploadToIPFS(inkBuffer, "buffer"),
        checkAddressAndFund(connectedAddress),
      ]);

      if (!uploadedInk.success) {
        throw new Error("Failed to upload ink to IPFS");
      }

      const jsonCID = uploadedInk.cid.toString();

      await writeYourContractAsync(
        {
          functionName: "createInk",
          args: [drawingCID, jsonCID, BigInt(inkNumber ?? 0)],
        },
        {
          onBlockConfirmation: () => {
            router.push(`/ink/${drawingCID}`);
          },
        },
      );
    } catch (e) {
      console.error(e);
      notification.error(`📛 Ink creation failed. Please wait a moment and try again: ${(e as Error).message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createInkGnosis();
  };

  return (
    <div className="flex justify-center">
      <form className="form-control w-full max-w-xs" onSubmit={handleSubmit}>
        <h3 className="font-bold">Publishing to nifty.ink on Gnosis</h3>
        <div className="flex flex-col gap-2">
          <FormInput label="Ink Name" value={inkName} onChange={setInkName} placeholder="name" required />
          <FormInput
            label="Editions"
            value={inkNumber?.toString() ?? ""}
            onChange={value => setInkNumber(value ? Number(value) : undefined)}
            type="number"
            placeholder="unlimited"
            required={false}
            min={0}
          />
        </div>
        <div className="form-control mt-6">
          <button className="btn btn-primary" disabled={isCreating} type="submit">
            {isCreating && <span className="loading loading-spinner loading-sm"></span>}
            <span>Ink!</span>
          </button>
        </div>
      </form>
    </div>
  );
};
