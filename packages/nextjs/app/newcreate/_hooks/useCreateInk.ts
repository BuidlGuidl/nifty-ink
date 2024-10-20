import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import * as Hash from "ipfs-only-hash";
import LZ from "lz-string";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { checkAddressAndFund } from "~~/utils/checkAddressAndFund";
import { addToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

export const useCreateInk = (
  drawingCanvas: any,
  connectedAddress: string | undefined,
  router: any,
  saveDrawing: (newDrawing: any, saveOverride: boolean) => void,
  handleChangeDrawing: (newDrawing: string) => void,
) => {
  const [sending, setSending] = useState<boolean>(false);
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyInk");

  const createInk = useCallback(
    async (values: any) => {
      // ... (move the createInk function logic here)
      if (!drawingCanvas?.current) {
        notification.error("Your canvas is empty");
        return;
      }
      console.log("Inking:", values);

      setSending(true);

      const imageData = drawingCanvas?.current?.canvas.drawing.toDataURL("image/png");

      saveDrawing(drawingCanvas.current, true);

      //let decompressed = LZ.decompress(props.drawing)
      //let compressedArray = LZ.compressToUint8Array(decompressed)
      const compressedArray = LZ.compressToUint8Array(drawingCanvas?.current?.getSaveData());

      const drawingBuffer = Buffer.from(compressedArray);
      const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

      const drawingHash = await Hash.of(drawingBuffer);
      console.log("drawingHash", drawingHash);

      const imageHash = await Hash.of(imageBuffer);
      console.log("imageHash", imageHash);

      const timeInMs = new Date();

      const currentInk = {
        // ...ink,
        attributes: [
          {
            trait_type: "Limit",
            value: values.limit.toString(),
          },
        ],
        name: values.title,
        description: `A Nifty Ink by ${connectedAddress} on ${timeInMs}`,
        drawing: drawingHash,
        image: `https://ipfs.io/ipfs/${imageHash}`,
        external_url: `https://nifty.ink/${drawingHash}`,
      };

      const inkStr = JSON.stringify(currentInk);
      const inkBuffer = Buffer.from(inkStr);

      const jsonHash = await Hash.of(inkBuffer);
      console.log("jsonHash", jsonHash);

      let drawingResultInfura;
      let imageResultInfura;
      let inkResultInfura;

      try {
        const drawingResult = addToIPFS(drawingBuffer);
        const imageResult = addToIPFS(imageBuffer);
        const inkResult = addToIPFS(inkBuffer);

        // drawingResultInfura = addToIPFS(drawingBuffer, props.ipfsConfigInfura);
        // imageResultInfura = addToIPFS(imageBuffer, props.ipfsConfigInfura);
        // inkResultInfura = addToIPFS(inkBuffer, props.ipfsConfigInfura);

        await Promise.all([drawingResult, imageResult, inkResult]).then(values => {
          console.log("FINISHED UPLOADING TO PINNER", values);
          message.destroy();
        });
      } catch (e) {
        console.log(e);
        setSending(false);
        notification.error("📛 Ink upload failed. Please wait a moment and try again ${e.message}");

        return;
      }

      await checkAddressAndFund(connectedAddress);

      try {
        await writeYourContractAsync({
          functionName: "createInk",
          args: [drawingHash, jsonHash, values.limit.toString()],
        });

        Promise.all([drawingResultInfura, imageResultInfura, inkResultInfura]).then(values => {
          console.log("INFURA FINISHED UPLOADING!", values);
        });

        router.push("/ink/" + drawingHash);
        setSending(false);
        handleChangeDrawing("");
      } catch (e) {
        console.log(e);
        setSending(false);
      }
    },
    [drawingCanvas, connectedAddress, router, writeYourContractAsync],
  );

  return { createInk, sending, setSending };
};
