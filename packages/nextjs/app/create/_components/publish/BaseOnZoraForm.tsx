import { useEffect, useState } from "react";
import { getWalletClient } from "@wagmi/core";
import { createCoin } from "@zoralabs/coins-sdk";
import LZ from "lz-string";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { CheckCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { Chains } from "~~/types/chains";
import { getChainId } from "~~/utils/chains";
import { uploadToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

type BaseOnZoraFormProps = {
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const BaseOnZoraForm = ({ connectedAddress, drawingCanvas }: BaseOnZoraFormProps) => {
  const { connector } = useAccount();
  const chainId = getChainId(Chains.base);

  const IPFS_BASE_URL = "ipfs://";
  const VIEW_INK_URL = "https://view.nifty.ink/ink/";
  const PLATFORM_REFERRER = "0x60D9d464549Dd2d5040EF2D56be10218dc1B9090";
  const [formState, setFormState] = useState<"fill" | "loading" | "success">("fill");
  const [inkName, setInkName] = useState<string>("");
  const [inkDescription, setInkDescription] = useState<string>("");
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [coinAddress, setCoinAddress] = useState<string>("");
  const publicClient = usePublicClient()!;

  const { writeContractAsync, status } = useWriteContract();

  useEffect(() => {
    if (status === "error") {
      notification.error("Failed to create the ink");
      setFormState("fill");
    }
  }, [status]);

  const uploadInkMetadata = async () => {
    try {
      const currentTime = new Date().toISOString().replace(/[:.]/g, "-");

      const saveData = drawingCanvas?.current?.getSaveData();
      if (!saveData) {
        throw new Error("Failed to get save data from canvas");
      }

      // Upload image
      const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");
      if (!imageData) {
        throw new Error("Failed to get image data from canvas");
      }
      const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");
      const uploadedImage = await uploadToIPFS(imageBuffer, "buffer");
      if (!uploadedImage?.success) {
        throw new Error("Failed to upload image to IPFS");
      }

      // Create drawing file
      const compressedArray = LZ.compressToUint8Array(saveData);
      const drawingBuffer = Buffer.from(compressedArray);
      const drawingBlob = new Blob([drawingBuffer], { type: "application/octet-stream" });
      const drawingFile = new File([drawingBlob], `${inkName}_${connectedAddress}_${currentTime}.lz`, {
        type: "application/octet-stream",
      });

      // Upload drawing
      const uploadedDrawing = await uploadToIPFS(drawingFile, "file");
      if (!uploadedDrawing.success) {
        throw new Error("Failed to upload drawing to IPFS");
      }

      // Create and upload metadata
      const inkMetadataJson = {
        name: inkName,
        description: inkDescription,
        content: {
          mime: "text/html",
          uri: `${VIEW_INK_URL}${uploadedDrawing.cid}`,
        },
        image: `${IPFS_BASE_URL}${uploadedImage.cid}`,
        animation_url: `${VIEW_INK_URL}${uploadedDrawing.cid}`,
      };

      const uploadedInkMetadata = await uploadToIPFS(inkMetadataJson, "json");
      if (!uploadedInkMetadata.success) {
        throw new Error("Failed to upload ink metadata to IPFS");
      }

      return uploadedInkMetadata;
    } catch (error) {
      notification.error(`Error uploading metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  const createZoraInk = async (inkMetadataCID: string) => {
    try {
      const createCoinParams = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: `ipfs://${inkMetadataCID}`,
        payoutRecipient: connectedAddress,
        platformReferrer: PLATFORM_REFERRER,
      };
      console.log(createCoinParams);

      const client = await getWalletClient(wagmiConfig);
      if (!client) {
        throw new Error("Failed to get wallet client");
      }
      const result = await createCoin(createCoinParams, client, publicClient);
      console.log(result);
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

      // Upload metadata
      const inkMetadata = await uploadInkMetadata();
      if (!inkMetadata?.success) {
        throw new Error("Failed to upload ink metadata");
      }

      // Create Zora ink
      await createZoraInk(inkMetadata.cid);

      setFormState("success");
      setInkName("");
      setInkDescription("");
      setTokenName("");
      setTokenSymbol("");
    } catch (error) {
      setFormState("fill");
      notification.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (connector?.name === "Burner Wallet") {
    return (
      <div className="flex justify-center">
        <p>Burner Wallet is not supported for this network</p>
      </div>
    );
  }

  return formState !== "success" ? (
    <div className="flex justify-center">
      <form className="flex justify-center form-control w-full max-w-xs" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-1">
          <h3 className="font-bold indicator">Publishing to Zora on Base </h3>
          <div
            className="tooltip tooltip-info tooltip-top"
            data-tip={"This allows you to publish your inks directly to Zora on Base"}
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex gap-2">
          <div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Ink Name</span>
              </label>
              <input
                type="text"
                placeholder="name"
                className="input input-sm input-bordered rounded-xl w-full max-w-xs"
                value={inkName}
                onChange={e => setInkName(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Ink Description</span>
              </label>
              <textarea
                placeholder="description"
                className="textarea textarea-md textarea-bordered rounded-xl w-full max-w-xs"
                value={inkDescription}
                onChange={e => setInkDescription(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Token Name</span>
              </label>
              <input
                type="text"
                placeholder="name"
                className="input input-sm input-bordered rounded-xl w-full max-w-xs"
                value={tokenName}
                onChange={e => setTokenName(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Token SYMBOL</span>
              </label>
              <input
                type="text"
                placeholder="name"
                className="input input-sm input-bordered rounded-xl w-full max-w-xs"
                value={tokenSymbol}
                onChange={e => setTokenSymbol(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <div className="form-control mt-6">
          <button className="btn btn-primary" disabled={formState === "loading"} type="submit">
            {formState === "loading" && <span className="loading loading-spinner loading-sm"></span>}
            <span>Ink!</span>
          </button>
        </div>
      </form>
    </div>
  ) : (
    <div className="success-message">
      <CheckCircleIcon className="h-24 w-24 mx-auto text-green-500" />
      <p className="mb-0">
        🎉 Ink was created on{" "}
        <a className="link" href={`https://zora.co/coin/base:${coinAddress}`} target="_blank" rel="noopener noreferrer">
          Zora
        </a>
      </p>
      <p className="mt-0">Make sure that you are logged in.</p>
      <button
        className="btn btn-primary mt-5"
        onClick={() => {
          setFormState("fill");
        }}
      >
        Create a new ink
      </button>
    </div>
  );
};
