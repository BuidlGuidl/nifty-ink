import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Popconfirm } from "antd";
import LZ from "lz-string";
import { useLocalStorage } from "usehooks-ts";
import { useAccount } from "wagmi";

type ForkButtonProps = {
  artist: string;
  drawing: string;
};

export const ForkButton = ({ artist, drawing }: ForkButtonProps) => {
  const { address: connectedAddress } = useAccount();
  const [_, setDrawingLocalStorage] = useLocalStorage("drawing", "");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const handleFork = () => {
    if (!drawing) return;
    const _savedData = LZ.compress(drawing);
    setDrawingLocalStorage(_savedData);
    router.push("/create");
  };

  return (
    <>
      {connectedAddress && connectedAddress.toLowerCase() == artist && (
        <>
          <Popconfirm
            title="This will replace your current drawing!"
            description="Only the artist can fork their own drawing."
            onConfirm={handleFork}
            onCancel={() => setIsConfirmOpen(false)}
            open={isConfirmOpen}
            placement="bottom"
          >
            <Button
              className="tooltip tooltip-primary"
              onClick={() => setIsConfirmOpen(true)}
              data-tip="Create a new drawing based on this one"
            >
              🍴
            </Button>
          </Popconfirm>
        </>
      )}
    </>
  );
};
