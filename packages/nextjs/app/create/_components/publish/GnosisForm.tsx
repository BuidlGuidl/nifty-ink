import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LZ from "lz-string";
import { createWalletClient, encodeFunctionData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { gnosis } from "viem/chains";
import { useAccount, usePublicClient } from "wagmi";
import { FormInput } from "~~/components/shared/FormInput";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { fundAndSignTransaction } from "~~/utils/gnosisFaucet";
import { uploadToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

type GnosisFormProps = {
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
};

export const GnosisForm = ({ connectedAddress, drawingCanvas }: GnosisFormProps) => {
  const router = useRouter();
  const { connector } = useAccount();
  // const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient()!;

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [inkName, setInkName] = useState<string>("");
  const [inkNumber, setInkNumber] = useState<number | undefined>(undefined);
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyInk");
  const isBurnerWalletConnected = connector?.name === "Burner Wallet";

  const [pk, setPk] = useState<string | null>(null);

  useEffect(() => {
    const value = localStorage.getItem("burnerWallet.pk");
    setPk(value);
  }, []);

  const uploadImageAndDrawing = async () => {
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

    return { uploadedImage, uploadedDrawing };
  };

  const uploadInkMetadata = async (imageCID: string, drawingCID: string) => {
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
    const uploadedInk = await uploadToIPFS(inkBuffer, "buffer");

    if (!uploadedInk.success) {
      throw new Error("Failed to upload ink to IPFS");
    }

    return uploadedInk;
  };

  const createInkGnosis = async (drawingCID: string, jsonCID: string) => {
    if (isBurnerWalletConnected) {
      if (!pk) throw new Error("No private key provided");

      const walletClient = createWalletClient({
        chain: gnosis,
        transport: http(),
        account: privateKeyToAccount(pk as `0x${string}`),
      });
      notification.info("Signing transaction... It may take some time.");

      const data = encodeFunctionData({
        abi: deployedContracts[100].NiftyInk.abi,
        functionName: "createInk",
        args: [drawingCID, jsonCID, BigInt(inkNumber ?? 0)],
      });

      const request = await walletClient.prepareTransactionRequest({
        account: walletClient.account,
        to: deployedContracts[100].NiftyInk.address,
        data: data,
        gas: 0n, // without this it will fail with "low balance"
      });
      const gas = await publicClient.estimateGas({
        account: "0xa23956202395086DDb8EbE4d43c75E2aBEa8e97A",
        to: deployedContracts[100].NiftyInk.address,
        data: data,
      });
      const GAS_MULTIPLIER = 200;
      request.gas = (gas * BigInt(GAS_MULTIPLIER)) / 100n;

      const signature = await walletClient.signTransaction(request);

      const signResult = await fundAndSignTransaction(signature, connectedAddress);
      if (signResult.error) {
        console.log("signResult", signResult);
        const errorMessage = signResult.error || "Failed to create Ink with burner wallet";
        throw new Error(errorMessage);
      }
      notification.success("Successfully created Ink!");
      router.push(`/ink/${drawingCID}`);
    } else {
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
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      notification.info("Uploading your drawing...");
      const { uploadedImage, uploadedDrawing } = await uploadImageAndDrawing();

      const uploadedInk = await uploadInkMetadata(uploadedImage.cid.toString(), uploadedDrawing.cid.toString());

      await createInkGnosis(uploadedDrawing.cid.toString(), uploadedInk.cid.toString());
    } catch (error) {
      console.log(error);
      const errorMessage = error instanceof Error ? error.message : "Error with uploading ink";
      notification.error(errorMessage);
    }
    setIsCreating(false);
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
