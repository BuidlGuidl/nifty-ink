import { useEffect, useState } from "react";
import { create1155, createNew1155Token } from "@zoralabs/protocol-sdk";
import LZ from "lz-string";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { CheckCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { CanvasDrawLines } from "~~/types/canvasDrawing";
import { uploadToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

type BaseOnZoraFormProps = {
  connectedAddress: string;
  drawingCanvas: React.RefObject<CanvasDrawLines>;
  chainId: number;
};

export const BaseOnZoraForm = ({ connectedAddress, drawingCanvas, chainId }: BaseOnZoraFormProps) => {
  const { connector } = useAccount();

  const IPFS_BASE_URL = "ipfs://";
  const VIEW_INK_URL = "https://view.nifty.ink/ink/";
  const NEW_COLLECTION_VAL = "newcollection";
  const [formState, setFormState] = useState<"fill" | "loading" | "success">("fill");
  const [collectionName, setCollectionName] = useState<string>("");
  const [collectionDescription, setCollectionDescription] = useState<string>("");
  const [inkName, setInkName] = useState<string>("");
  const [inkDescription, setInkDescription] = useState<string>("");
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>(NEW_COLLECTION_VAL);
  const [createdContract, setCreatedContract] = useState<string>("");
  const publicClient = usePublicClient()!;

  const { writeContractAsync, status } = useWriteContract();

  useEffect(() => {
    if (status === "error") {
      notification.error("Failed to create the ink");
      setFormState("fill");
    }
  }, [status]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data from the API
      const response = await fetch(`https://api.indexsupply.net/query?chain=${chainId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            event_signatures: [
              "SetupNewContract(address indexed newContract, address indexed creator, address indexed defaultAdmin, string contractURI, string name, (uint32,uint32,address) defaultRoyaltyConfiguration)",
            ],
            query: `select newContract, name
                    from setupnewcontract
                    where creator = ${connectedAddress}`,
          },
        ]),
        method: "POST",
      });

      const apiResult = await response.json();
      setCollections(apiResult?.result?.[0].slice(1));
    };

    fetchData();
  }, []);

  const uploadInkMetadata = async (imageResult: string, currentTime: string) => {
    try {
      const saveData = drawingCanvas?.current?.getSaveData();
      if (!saveData) {
        throw new Error("Failed to get save data from canvas");
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
      if (!uploadedDrawing?.cid) {
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
        image: `${IPFS_BASE_URL}${imageResult}`,
        animation_url: `${VIEW_INK_URL}${uploadedDrawing.cid}`,
      };

      const uploadedInkMetadata = await uploadToIPFS(inkMetadataJson, "json");
      if (!uploadedInkMetadata?.cid) {
        throw new Error("Failed to upload ink metadata to IPFS");
      }

      return uploadedInkMetadata;
    } catch (error) {
      notification.error(`Error uploading metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  const createZoraInk = async (imageResult: string, inkMetadataUri: string, currentTime: string) => {
    try {
      if (selectedContract === NEW_COLLECTION_VAL) {
        const contractMetadataJson = {
          name: collectionName,
          description: collectionDescription,
          image: `${IPFS_BASE_URL}${imageResult}`,
        };

        const contractMetadata = await uploadToIPFS(contractMetadataJson, "json");
        if (!contractMetadata?.cid) {
          throw new Error("Failed to upload contract metadata to IPFS");
        }

        const { parameters, contractAddress } = await create1155({
          contract: {
            name: collectionName,
            uri: `${IPFS_BASE_URL}${contractMetadata.cid}`,
          },
          token: {
            tokenMetadataURI: `${IPFS_BASE_URL}${inkMetadataUri}`,
          },
          account: connectedAddress,
          publicClient,
        });
        setCreatedContract(contractAddress);
        return parameters;
      } else {
        const { parameters } = await createNew1155Token({
          contractAddress: selectedContract?.split(",")[0],
          token: {
            tokenMetadataURI: `${IPFS_BASE_URL}${inkMetadataUri}`,
          },
          account: connectedAddress,
          chainId: publicClient.chain.id,
        });
        setCreatedContract(selectedContract?.split(",")[0]);
        return parameters;
      }
    } catch (error) {
      notification.error(`Error creating Zora ink: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setFormState("loading");
      const currentTime = new Date().toISOString().replace(/[:.]/g, "-");

      // Upload image
      const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");
      if (!imageData) {
        throw new Error("Failed to get image data from canvas");
      }

      const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");
      const uploadedImage = await uploadToIPFS(imageBuffer, "buffer");
      if (!uploadedImage?.cid) {
        throw new Error("Failed to upload image to IPFS");
      }

      // Upload metadata
      const inkMetadata = await uploadInkMetadata(uploadedImage.cid, currentTime);
      if (!inkMetadata?.cid) {
        throw new Error("Failed to upload ink metadata");
      }

      // Create Zora ink
      const parameters = await createZoraInk(uploadedImage.cid, inkMetadata.cid, currentTime);
      if (!parameters) {
        throw new Error("Failed to create Zora ink parameters");
      }

      // Submit transaction
      const hash = await writeContractAsync(parameters);
      await publicClient.waitForTransactionReceipt({ hash });

      setFormState("success");
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
                <span className="label-text">Select Collection</span>
              </label>
              <select
                className="select select-sm select-bordered rounded-xl w-full max-w-xs"
                value={selectedContract}
                onChange={e => setSelectedContract(e.target.value)}
                disabled={!collections}
                required
              >
                <option value={NEW_COLLECTION_VAL}>New Collection</option>
                {collections?.map(collection => (
                  <option key={collection[0]} value={collection}>
                    {collection[1]} {collection[0].slice(0, 4)}...{collection[0].slice(-4)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Collection Name</span>
              </label>
              <input
                type="text"
                placeholder="name"
                className="input input-sm input-bordered rounded-xl w-full max-w-xs"
                value={selectedContract !== NEW_COLLECTION_VAL ? selectedContract?.split(",")[1] : collectionName}
                onChange={e => setCollectionName(e.target.value)}
                disabled={selectedContract !== NEW_COLLECTION_VAL}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Collection Description</span>
              </label>
              <textarea
                placeholder="description"
                className="textarea textarea-md textarea-bordered rounded-xl w-full max-w-xs"
                value={collectionDescription}
                onChange={e => setCollectionDescription(e.target.value)}
                disabled={selectedContract !== NEW_COLLECTION_VAL}
                required
              />
            </div>
          </div>
          <div>
            <div className="form-control mt-[68px]">
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
        <a
          className="link"
          href={`https://zora.co/manage/1155/base:${createdContract}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Zora
        </a>
      </p>
      <p className="mt-0">Make sure that you are logged in.</p>
      <button
        className="btn btn-primary mt-5"
        onClick={() => {
          setCollectionName("");
          setCollectionDescription("");
          setInkName("");
          setInkDescription("");
          setFormState("fill");
        }}
      >
        Create a new ink
      </button>
    </div>
  );
};
