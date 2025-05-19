import { useEffect, useState } from "react";
import Link from "next/link";
import { ValidMetadataURI, getCoinCreateFromLogs, validateMetadataURIContent } from "@zoralabs/coins-sdk";
import LZ from "lz-string";
import { createWalletClient, encodeFunctionData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { CheckCircleIcon, ExclamationCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { FormInput } from "~~/components/shared/FormInput";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { Metadata } from "~~/types/zora";
import { customCreateCoinCall } from "~~/utils/coin";
import { baseAddressPlatformReferrer } from "~~/utils/constants";
import { uploadToIPFS } from "~~/utils/ipfs";
import { fundAndSignTransaction } from "~~/utils/offchainFaucet";
import { notification } from "~~/utils/scaffold-eth";

// Constants
const CONSTANTS = {
  METADATA_BASE_URL: "ipfs://",
  IMAGE_BASE_URL: "ipfs://",
  VIEW_INK_BASE_URL: "https://view.nifty.ink/ink/",
  PLATFORM_REFERRER: baseAddressPlatformReferrer,
  MAX_TITLE_LENGTH: 64,
  MAX_CAPTION_LENGTH: 180,
  GAS_MULTIPLIER: 100,
  CAPTION_SUFFIX: " Create your own on https://nifty.ink",
} as const;

// Types
type FormState = "fill" | "loading" | "success" | "error";

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
  const { connector } = useAccount();
  const publicClient = usePublicClient()!;
  const { data: walletClient } = useWalletClient();
  const isBurnerWalletConnected = connector?.name === "Burner Wallet";
  const [pk, setPk] = useState<string | null>(null);

  useEffect(() => {
    const value = localStorage.getItem("burnerWallet.pk");
    setPk(value);
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    const maxLength = field === "title" ? CONSTANTS.MAX_TITLE_LENGTH : CONSTANTS.MAX_CAPTION_LENGTH;
    setFormData(prev => ({
      ...prev,
      [field]: value.slice(0, maxLength),
    }));
  };

  const uploadInkMetadata = async () => {
    const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
    const saveData = drawingCanvas?.current?.getSaveData();
    if (!saveData) throw new Error("Failed to get save data from canvas");

    const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");
    if (!imageData) throw new Error("Failed to get image data from canvas");

    // Prepare image and drawing data in parallel
    const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

    const compressedArray = LZ.compressToUint8Array(saveData);
    const drawingBuffer = Buffer.from(compressedArray);
    const drawingBlob = new Blob([drawingBuffer], { type: "application/octet-stream" });
    const drawingFile = new File([drawingBlob], `${connectedAddress}_${currentTime}.lz`, {
      type: "application/octet-stream",
    });

    notification.info("Uploading ink to IPFS...");

    // Upload image and drawing in parallel
    const [uploadedImage, uploadedDrawing] = await Promise.all([
      uploadToIPFS(imageBuffer, "buffer"),
      uploadToIPFS(drawingFile, "file"),
    ]);

    if (!uploadedImage?.success) throw new Error("Failed to upload image to IPFS");
    if (!uploadedDrawing.success) throw new Error("Failed to upload drawing to IPFS");

    const inkMetadataJson: Metadata = {
      name: formData.title,
      description: formData.caption + CONSTANTS.CAPTION_SUFFIX,
      content: {
        mime: "text/html",
        uri: `${CONSTANTS.VIEW_INK_BASE_URL}${uploadedDrawing.cid}`,
      },
      image: `${CONSTANTS.IMAGE_BASE_URL}${uploadedImage.cid}`,
      animation_url: `${CONSTANTS.VIEW_INK_BASE_URL}${uploadedDrawing.cid}`,
    };

    const uploadedInkMetadata = await uploadToIPFS(inkMetadataJson, "json");
    if (!uploadedInkMetadata.success) throw new Error("Failed to upload ink metadata to IPFS");

    notification.success("Successfully uploaded ink metadata to IPFS");
    return uploadedInkMetadata;
  };

  const createZoraCoins = async (inkMetadataCID: string) => {
    const createCoinParams = {
      name: formData.title,
      symbol: formData.title,
      uri: `${CONSTANTS.METADATA_BASE_URL}${inkMetadataCID}`,
      payoutRecipient: connectedAddress,
      owners: [connectedAddress],
      platformReferrer: CONSTANTS.PLATFORM_REFERRER,
    };
    notification.info("Preparing transaction");
    const createCoinRequest = customCreateCoinCall(createCoinParams);
    const validatedUri = await validateMetadataURIContent(createCoinParams.uri as ValidMetadataURI);
    console.log(`URI validation: ${createCoinParams.uri} -> ${validatedUri}`);
    if (!validatedUri) throw new Error("Invalid metadata URI");

    if (isBurnerWalletConnected) {
      if (!pk) throw new Error("No private key provided");

      const walletClient = createWalletClient({
        chain: base,
        account: privateKeyToAccount(pk as `0x${string}`),
        transport: http(),
      });

      const data = encodeFunctionData({
        abi: createCoinRequest.abi,
        functionName: createCoinRequest.functionName,
        args: createCoinRequest.args as any,
      });

      const request = await walletClient.prepareTransactionRequest({
        account: walletClient.account,
        to: createCoinRequest.address,
        data: data,
        gas: 0n, // without this it will fail with "low balance"
      });
      const gas = await publicClient.estimateGas({
        account: "0xa23956202395086DDb8EbE4d43c75E2aBEa8e97A",
        to: createCoinRequest.address,
        data: data,
      });
      request.gas = (gas * BigInt(CONSTANTS.GAS_MULTIPLIER)) / 100n;
      const signature = await walletClient.signTransaction(request);
      notification.info("Signing transaction... It may take some time.");
      const signResult = await fundAndSignTransaction(signature, connectedAddress);
      if (signResult.error || !signResult.result?.address) {
        console.log("signResult", signResult);
        const errorMessage = signResult.error || "Failed to create with burner wallet";
        throw new Error(errorMessage);
      }
      setCoinAddress(signResult.result.address);
      notification.success("Successfully created Zora post!");
      return signResult.result;
    } else {
      if (!walletClient) throw new Error("Failed to get wallet client");
      const { request } = await publicClient.simulateContract({
        ...createCoinRequest,
        account: walletClient.account,
      });
      if (request.gas) {
        // Gas limit multiplier is a percentage argument.
        request.gas = (request.gas * BigInt(CONSTANTS.GAS_MULTIPLIER)) / 100n;
      }
      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const deployment = getCoinCreateFromLogs(receipt);
      const result = {
        hash,
        receipt,
        address: deployment?.coin,
        deployment,
      };

      if (!result.address) throw new Error("Failed to create Zora post");
      setCoinAddress(result.address || "");

      notification.success("Successfully created Zora post!");
      return result;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setFormState("loading");
      const inkMetadata = await uploadInkMetadata();

      await createZoraCoins(inkMetadata.cid);
      setFormState("success");
      setFormData({ title: "", caption: "" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create coin";
      console.log(errorMessage);
      const message = errorMessage.length > 150 ? "Failed to create coin" : errorMessage;
      notification.error(`${message}`);
      setFormState("error");
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

const SuccessMessage = ({ coinAddress, onReset }: { coinAddress: string; onReset: () => void }) => {
  const account = useAccount();
  return (
    <div className="success-message">
      <CheckCircleIcon className="h-24 w-24 mx-auto text-green-500" />
      <p className="mb-0">
        🎉 Ink was created on{" "}
        <a className="link" href={`https://zora.co/coin/base:${coinAddress}`} target="_blank" rel="noopener noreferrer">
          Zora
        </a>
      </p>
      <p>
        {account.address && (
          <Link href={`/artist/${account.address}?platform=zora`} className="btn mt-5">
            View your Zora inks
          </Link>
        )}
      </p>
      <button className="btn btn-primary mt-5" onClick={onReset}>
        Create a new ink
      </button>
    </div>
  );
};

const ErrorMessage = ({ onReset }: { onReset: () => void }) => (
  <div className="error-message text-center">
    <div className="flex justify-center mb-4">
      <ExclamationCircleIcon className="h-24 w-24 text-red-600" />
    </div>
    <p className="text-red-600">Failed to create ink. Please try again.</p>
    <p className="text-xs my-0">Note: If you continue to encounter this error,</p>
    <p className="text-xs my-0">try making a change to your ink and attempt again.</p>
    <p className="text-xs mt-0 mb-2">If the issue persists, please reach out to support for assistance (in 💬Chat).</p>
    <button className="btn btn-primary" onClick={onReset}>
      Try Again
    </button>
  </div>
);

export const BaseOnZoraForm = ({ connectedAddress, drawingCanvas }: BaseOnZoraFormProps) => {
  const { formState, formData, coinAddress, handleInputChange, handleSubmit, resetForm } = useZoraForm(
    connectedAddress,
    drawingCanvas,
  );

  if (formState === "success") {
    return <SuccessMessage coinAddress={coinAddress} onReset={resetForm} />;
  }

  if (formState === "error") {
    return <ErrorMessage onReset={resetForm} />;
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
