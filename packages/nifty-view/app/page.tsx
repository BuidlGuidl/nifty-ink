"use client";

import { useRef, useState } from "react";
import LZ from "lz-string";
import type { NextPage } from "next";
import CanvasDraw from "react-canvas-draw";
import { getFromIPFS } from "~~/utils/ipfs";

const Home: NextPage = () => {
  // const { address: connectedAddress } = useAccount();
  const drawingCanvas = useRef<CanvasDraw>(null);
  const [drawingData, setDrawingData] = useState<string>("");

  const fetchAndShowDrawing = async () => {
    const timeout = 100000;
    try {
      // console.log(`fetching from IPFS ${new Date().toISOString()}`);
      const drawingContent = await getFromIPFS("QmSuBnLBcQVfqL3ykhzfAYvCn5Tg6r22StGpVuJQ2cc75p", timeout);
      // console.log(drawingContent);
      // console.log(`received from IPFS ${new Date().toISOString()}`);

      // console.log(`decompressing ${new Date().toISOString()}`);
      const decompressed = LZ.decompressFromUint8Array(drawingContent);

      console.log(`finding length ${new Date().toISOString()}`);
      setDrawingData(decompressed);
      // const parsedDrawing = JSON.parse(decompressed);
      // const points = parsedDrawing.lines.reduce((acc: number, line: any) => acc + line.points.length, 0);
      drawingCanvas.current?.loadSaveData(decompressed, false);
      console.log(`saving ${new Date().toISOString()}`);
      console.log(`done ${new Date().toISOString()}`);
      // if (drawingCanvas && drawingCanvas.current) {
      //   drawingCanvas.current.loadSaveData(decompressed, false);
      // }
    } catch (e) {
      console.error("Error loading or decompressing drawing:", e);
    }
  };

  fetchAndShowDrawing();

  return (
    <>
      HI
      <button
        className="btn btn-primary"
        onClick={() => {
          drawingCanvas.current?.loadSaveData(drawingData, false);
        }}
      >
        Play
      </button>
      <CanvasDraw
        ref={drawingCanvas}
        canvasWidth={200}
        canvasHeight={200}
        // brushColor={color}
        // lazyRadius={1}
        // brushRadius={brushRadius}
        // disabled={canvasDisabled}
        // onChange={handleCanvasChange}
        // saveData={initialDrawing}
        // immediateLoading={true} //drawingSize >= 10000}
        loadTimeOffset={3}
      />
      End
      {/* <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div> */}
    </>
  );
};

export default Home;
