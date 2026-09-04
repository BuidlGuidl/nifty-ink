import { useEffect, useMemo, useRef, useState } from "react";
import { toSvg, type Board, type Stroke } from "drawesome";
import "drawesome/styles.css";
import { ZoomableDraw } from "./ZoomableDraw";
import { toAnimatedSvg } from "./animatedSvg";

const BOARD: Board = { w: 800, h: 800 };
const BACKGROUND = "#ffffff";

function useNarrow(query = "(max-width: 767px)") {
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}

function formatSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) return svg;
  const lines: string[] = [];
  const walk = (node: Node, depth: number) => {
    const pad = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(pad + text);
      return;
    }
    if (!(node instanceof Element)) return;
    const attrs = Array.from(node.attributes)
      .map(a => ` ${a.name}="${a.value}"`)
      .join("");
    if (node.childNodes.length === 0) {
      lines.push(`${pad}<${node.tagName}${attrs} />`);
    } else {
      lines.push(`${pad}<${node.tagName}${attrs}>`);
      node.childNodes.forEach(child => walk(child, depth + 1));
      lines.push(`${pad}</${node.tagName}>`);
    }
  };
  walk(doc.documentElement, 0);
  return lines.join("\n");
}

type Tab = "svg" | "data";

export default function App() {
  const narrow = useNarrow();
  const strokes = useRef<Stroke[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("svg");
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState<{ svg: string; x: number; y: number; w: number; h: number } | null>(null);
  const [playKey, setPlayKey] = useState(0);

  const onStrokes = (next: Stroke[]) => {
    strokes.current = next;
    (window as unknown as { __strokes?: Stroke[] }).__strokes = next; // test hook
  };

  // Computed only while the modal is open — drawing never re-renders the app.
  const content = useMemo(() => {
    if (!open) return "";
    return tab === "svg"
      ? formatSvg(toSvg(strokes.current, BOARD.w, BOARD.h, BACKGROUND))
      : JSON.stringify(strokes.current, null, 1);
  }, [open, tab]);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="app">
      <ZoomableDraw board={BOARD} background={BACKGROUND} narrow={narrow} onChange={onStrokes} />
      <div className="brand">
        <span>
          Nifty Ink <em>×</em> Drawesome
        </span>
        <button
          className="advanced"
          title="Replay the drawing"
          onClick={() => {
            if (!strokes.current.length) return;
            const r = document.querySelector(".zoom-inner")?.getBoundingClientRect();
            if (!r) return;
            setPlaying({
              svg: toAnimatedSvg(strokes.current, BOARD.w, BOARD.h, BACKGROUND),
              x: r.left,
              y: r.top,
              w: r.width,
              h: r.height,
            });
            setPlayKey(k => k + 1);
          }}
        >
          &#9654;
        </button>
        <button
          className="advanced"
          onClick={() => {
            setTab("svg");
            setCopied(false);
            setOpen(true);
          }}
        >
          {"</>"}
        </button>
      </div>

      {playing && (
        <div className="modal-backdrop player-backdrop" onClick={() => setPlaying(null)}>
          <div
            key={playKey}
            className="player-board"
            style={{ left: playing.x, top: playing.y, width: playing.w, height: playing.h }}
            dangerouslySetInnerHTML={{ __html: playing.svg }}
          />
          <div className="player-actions" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPlayKey(k => k + 1)}>&#8635; Replay</button>
            <button onClick={() => setPlaying(null)}>✕</button>
          </div>
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="tabs">
                <button className={tab === "svg" ? "on" : ""} onClick={() => setTab("svg")}>
                  SVG
                </button>
                <button className={tab === "data" ? "on" : ""} onClick={() => setTab("data")}>
                  Strokes
                </button>
              </div>
              <div className="modal-actions">
                <button onClick={copy} disabled={!strokes.current.length}>
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button className="close" onClick={() => setOpen(false)} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>
            <pre>{strokes.current.length ? content : tab === "svg" ? "<!-- draw something first -->" : "[]"}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
