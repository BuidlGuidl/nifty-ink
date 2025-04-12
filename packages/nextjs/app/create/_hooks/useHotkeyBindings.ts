import { useHotkeys } from "react-hotkeys-hook";

export const useHotkeyBindings = (
  brushRadius: number,
  updateBrushRadius: (value: number) => void,
  updateOpacity: (value: number) => void,
) => {
  useHotkeys("]", () => updateBrushRadius(brushRadius + 1));
  useHotkeys("ctrl+]", () => updateBrushRadius(brushRadius + 10));
  useHotkeys("[", () => updateBrushRadius(brushRadius - 1));
  useHotkeys("ctrl+[", () => updateBrushRadius(brushRadius - 10));
  useHotkeys("p", () => updateOpacity(0.01));
  useHotkeys("ctrl+p", () => updateOpacity(0.1));
  useHotkeys("o", () => updateOpacity(-0.01));
  useHotkeys("ctrl+o", () => updateOpacity(-0.1));
};
