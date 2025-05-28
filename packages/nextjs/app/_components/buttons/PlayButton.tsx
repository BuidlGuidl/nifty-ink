import { PlaySquareOutlined } from "@ant-design/icons";
import { Button } from "antd";

type PlayButtonProps = {
  isDrawing: boolean;
  playClick: () => void;
};

export const PlayButton = ({ isDrawing, playClick }: PlayButtonProps) => {
  return (
    <Button loading={isDrawing} disabled={isDrawing} onClick={playClick} icon={<PlaySquareOutlined />}>
      {isDrawing ? "Drawing..." : "Play"}
    </Button>
  );
};
