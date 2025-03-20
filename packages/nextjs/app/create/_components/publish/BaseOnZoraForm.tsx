import { useState } from "react";
import { getWalletClient } from "@wagmi/core";
import { createCoin } from "@zoralabs/coins-sdk";
import LZ from "lz-string";
import { useAccount, usePublicClient } from "wagmi";
import { CheckCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { FormInput } from "~~/components/shared/FormInput";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { uploadToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

// Constants
const CONSTANTS = {
  IPFS_BASE_URL: "ipfs://",
  VIEW_INK_URL: "https://view.nifty.ink/ink/",
  PLATFORM_REFERRER: "0x60D9d464549Dd2d5040EF2D56be10218dc1B9090",
  MAX_TITLE_LENGTH: 64,
  MAX_CAPTION_LENGTH: 180,
} as const;

// Types
type FormState = "fill" | "loading" | "success";

interface FormData {
  title: string;
  caption: string;
}

interface BaseOnZoraFormProps {
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
}

// Custom hook for form logic
const useZoraForm = (connectedAddress: string, drawingCanvas: React.RefObject<CanvasDrawLines>) => {
  const [formState, setFormState] = useState<FormState>("fill");
  const [formData, setFormData] = useState<FormData>({ title: "", caption: "" });
  const [coinAddress, setCoinAddress] = useState<string>("");
  const publicClient = usePublicClient()!;

  const handleInputChange = (field: keyof FormData, value: string) => {
    const maxLength = field === "title" ? CONSTANTS.MAX_TITLE_LENGTH : CONSTANTS.MAX_CAPTION_LENGTH;
    setFormData(prev => ({
      ...prev,
      [field]: value.slice(0, maxLength),
    }));
  };

  const uploadInkMetadata = async () => {
    try {
      const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
      const saveData = drawingCanvas?.current?.getSaveData();
      if (!saveData) throw new Error("Failed to get save data from canvas");

      const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");
      if (!imageData) throw new Error("Failed to get image data from canvas");

      const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");
      const uploadedImage = await uploadToIPFS(imageBuffer, "buffer");
      if (!uploadedImage?.success) throw new Error("Failed to upload image to IPFS");

      const compressedArray = LZ.compressToUint8Array(saveData);
      const drawingBuffer = Buffer.from(compressedArray);
      const drawingBlob = new Blob([drawingBuffer], { type: "application/octet-stream" });
      const drawingFile = new File([drawingBlob], `${formData.title}_${connectedAddress}_${currentTime}.lz`, {
        type: "application/octet-stream",
      });

      const uploadedDrawing = await uploadToIPFS(drawingFile, "file");
      if (!uploadedDrawing.success) throw new Error("Failed to upload drawing to IPFS");

      const inkMetadataJson = {
        name: formData.title,
        description: formData.caption,
        content: {
          mime: "text/html",
          uri: `${CONSTANTS.VIEW_INK_URL}${uploadedDrawing.cid}`,
        },
        image: `${CONSTANTS.IPFS_BASE_URL}${uploadedImage.cid}`,
        animation_url: `${CONSTANTS.VIEW_INK_URL}${uploadedDrawing.cid}`,
      };

      const uploadedInkMetadata = await uploadToIPFS(inkMetadataJson, "json");
      if (!uploadedInkMetadata.success) throw new Error("Failed to upload ink metadata to IPFS");

      return uploadedInkMetadata;
    } catch (error) {
      notification.error(`Error uploading metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  const createZoraInk = async (inkMetadataCID: string) => {
    try {
      const createCoinParams = {
        name: formData.title,
        symbol: formData.title,
        uri: `ipfs://${inkMetadataCID}`,
        payoutRecipient: connectedAddress,
        platformReferrer: CONSTANTS.PLATFORM_REFERRER,
      };

      const client = await getWalletClient(wagmiConfig);
      if (!client) throw new Error("Failed to get wallet client");

      const result = await createCoin(createCoinParams, client, publicClient);
      setCoinAddress(result.address || "");
      return result;
    } catch (error) {
      notification.error(`Error creating Zora ink: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setFormState("loading");
      const inkMetadata = await uploadInkMetadata();
      if (!inkMetadata?.success) throw new Error("Failed to upload ink metadata");
      await createZoraInk(inkMetadata.cid);
      setFormState("success");
      setFormData({ title: "", caption: "" });
    } catch (error) {
      setFormState("fill");
      notification.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return {
    formState,
    formData,
    coinAddress,
    handleInputChange,
    handleSubmit,
    resetForm: () => setFormState("fill"),
  };
};

const SuccessMessage = ({ coinAddress, onReset }: { coinAddress: string; onReset: () => void }) => (
  <div className="success-message">
    <CheckCircleIcon className="h-24 w-24 mx-auto text-green-500" />
    <p className="mb-0">
      🎉 Ink was created on{" "}
      <a className="link" href={`https://zora.co/coin/base:${coinAddress}`} target="_blank" rel="noopener noreferrer">
        Zora
      </a>
    </p>
    <p className="mt-0">Make sure that you are logged in.</p>
    <button className="btn btn-primary mt-5" onClick={onReset}>
      Create a new ink
    </button>
  </div>
);

export const BaseOnZoraForm = ({ connectedAddress, drawingCanvas }: BaseOnZoraFormProps) => {
  const { connector } = useAccount();
  const { formState, formData, coinAddress, handleInputChange, handleSubmit, resetForm } = useZoraForm(
    connectedAddress,
    drawingCanvas,
  );

  if (connector?.name === "Burner Wallet") {
    return (
      <div className="flex justify-center">
        <p>Burner Wallet is not supported for this network</p>
      </div>
    );
  }

  if (formState === "success") {
    return <SuccessMessage coinAddress={coinAddress} onReset={resetForm} />;
  }

  return (
    <div className="flex justify-center">
      <form className="flex justify-center form-control w-full max-w-xs" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-1">
          <h3 className="font-bold indicator">Publishing to Zora on Base</h3>
          <div
            className="tooltip tooltip-info tooltip-top"
            data-tip="This allows you to publish your inks directly to Zora on Base"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FormInput
            label="Title"
            value={formData.title}
            onChange={value => handleInputChange("title", value)}
            maxLength={CONSTANTS.MAX_TITLE_LENGTH}
            placeholder="name"
          />
          <FormInput
            label="Caption"
            value={formData.caption}
            onChange={value => handleInputChange("caption", value)}
            maxLength={CONSTANTS.MAX_CAPTION_LENGTH}
            type="textarea"
            placeholder="description"
          />
        </div>
        <div className="form-control mt-6">
          <button className="btn btn-primary" disabled={formState === "loading"} type="submit">
            {formState === "loading" && <span className="loading loading-spinner loading-sm"></span>}
            <span>Ink!</span>
          </button>
        </div>
      </form>
    </div>
  );
};
