import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PENS,
  PEN_BY_ID,
  SWATCHES,
  Toolbar,
  useDrawing,
  type Board,
  type PenId,
  type Stroke,
  type ToolId,
  type ToolState,
  type Tool,
} from "drawesome";
import { DrawSurface } from "./vendor/DrawSurface";

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

type Transform = { s: number; tx: number; ty: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type ZoomableDrawProps = {
  board: Board;
  background?: string;
  narrow?: boolean;
  onChange?: (strokes: Stroke[]) => void;
};

/**
 * Drawesome's pieces (useDrawing + DrawSurface + Toolbar) reassembled with a
 * pan/zoom viewport in between. The toolbar sits OUTSIDE the transformed
 * layer, so it keeps its size while the paper zooms.
 *
 * Gestures: one finger draws, two fingers pinch-zoom and pan, wheel zooms
 * around the cursor. When a second finger lands mid-stroke we dispatch a
 * `pointercancel` to the surface — with our vendored #5 fix that discards the
 * accidental stroke instead of committing it.
 */
export function ZoomableDraw({ board, background = "#ffffff", narrow = false, onChange }: ZoomableDrawProps) {
  const drawing = useDrawing();
  const viewport = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  // ---- pan/zoom ----
  const [t, setT] = useState<Transform>({ s: 1, tx: 0, ty: 0 });
  const tRef = useRef(t);
  tRef.current = t;
  const minScale = useRef(MIN_SCALE);
  /** Whether the user has zoomed/panned; until then we auto-fit on resize. */
  const touched = useRef(false);

  const fit = useCallback((apply = true) => {
    const vp = viewport.current;
    if (!vp) return;
    const r = vp.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Keep the board clear of the floating toolbar and HUD/brand row.
    const pad = { top: narrow ? 64 : 56, right: 12, bottom: narrow ? 196 : 166, left: 12 };
    const aw = Math.max(50, r.width - pad.left - pad.right);
    const ah = Math.max(50, r.height - pad.top - pad.bottom);
    const s = Math.min(aw / board.w, ah / board.h);
    minScale.current = apply
      ? Math.min(MIN_SCALE, s)
      : Math.min(MIN_SCALE, s, tRef.current.s);
    if (!apply) return;
    setT({
      s,
      tx: pad.left + (aw - board.w * s) / 2,
      ty: pad.top + (ah - board.h * s) / 2,
    });
  }, [board.w, board.h, narrow]);

  useEffect(() => {
    fit();
    const vp = viewport.current;
    if (!vp || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      fit(!touched.current);
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [fit]);

  /** Zoom by `factor` keeping the viewport point (cx, cy) fixed. */
  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    touched.current = true;
    setT(prev => {
      const s = clamp(prev.s * factor, minScale.current, MAX_SCALE);
      const k = s / prev.s;
      return { s, tx: cx - (cx - prev.tx) * k, ty: cy - (cy - prev.ty) * k };
    });
  }, []);

  const zoomCentre = (factor: number) => {
    const r = viewport.current?.getBoundingClientRect();
    if (r) zoomAt(r.width / 2, r.height / 2, factor);
  };

  // ---- gesture plumbing (native listeners, capture phase) ----
  /** Live touch pointers on the viewport: current and starting client coords. */
  const touches = useRef(
    new Map<number, { x: number; y: number; sx: number; sy: number; t: number }>(),
  );
  const pinch = useRef<{ d0: number; m0: { x: number; y: number }; t0: Transform } | null>(null);
  /**
   * A second finger has landed but hasn't yet said what it means. Movement
   * beyond SLOP makes it a pinch; both fingers lifting quickly makes it a
   * two-finger tap (undo); anything else leaves the first finger's stroke
   * to carry on untouched.
   */
  const pending = useRef<{
    firstId: number;
    secondId: number;
    d0: number;
    m0: { x: number; y: number };
    start: number;
    firstUp: boolean;
    secondUp: boolean;
  } | null>(null);
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;

  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return;
    /** Finger travel before a second finger is declared a pinch, in px. */
    const SLOP = 12;
    /** Window for a two-finger tap, in ms from the second finger landing. */
    const TAP_MS = 300;

    const cancelSurfaceStroke = (pointerId: number) => {
      const svg = inner.current?.querySelector("svg");
      svg?.dispatchEvent(
        new PointerEvent("pointercancel", { pointerId, bubbles: true, pointerType: "touch" }),
      );
    };

    const measure = () => {
      const [a, b] = [...touches.current.values()];
      return {
        d: Math.hypot(b.x - a.x, b.y - a.y),
        m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    };

    const swallow = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const onDown = (e: PointerEvent) => {
      if (!e.isTrusted || e.pointerType !== "touch") return;
      const now = performance.now();
      // While a pinch is live, no new finger may start a stroke.
      if (pinch.current) {
        swallow(e);
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: now });
        return;
      }
      const firstId: number | undefined = touches.current.keys().next().value;
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: now });
      if (touches.current.size === 2 && firstId !== undefined) {
        // A second finger: maybe a pinch, maybe a tap. Keep it away from the
        // surface, but let the first finger's stroke carry on until we know.
        swallow(e);
        const { d, m } = measure();
        pending.current = { firstId, secondId: e.pointerId, d0: d, m0: m, start: now, firstUp: false, secondUp: false };
      } else if (touches.current.size > 2) {
        swallow(e);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!e.isTrusted || e.pointerType !== "touch") return;
      const info = touches.current.get(e.pointerId);
      if (!info) return;
      touches.current.set(e.pointerId, { ...info, x: e.clientX, y: e.clientY });

      if (pinch.current) {
        if (touches.current.size < 2) return;
        e.stopPropagation();
        const p = pinch.current;
        const r = vp.getBoundingClientRect();
        const { d, m } = measure();
        touched.current = true;
        const s = clamp(p.t0.s * (d / p.d0), MIN_SCALE, MAX_SCALE);
        // The board point that was under the pinch midpoint stays under it.
        const bx = (p.m0.x - r.left - p.t0.tx) / p.t0.s;
        const by = (p.m0.y - r.top - p.t0.ty) / p.t0.s;
        setT({ s, tx: m.x - r.left - bx * s, ty: m.y - r.top - by * s });
        return;
      }

      const p = pending.current;
      if (p && touches.current.size >= 2 && !p.firstUp && !p.secondUp) {
        const { d, m } = measure();
        if (Math.abs(d - p.d0) > SLOP || Math.hypot(m.x - p.m0.x, m.y - p.m0.y) > SLOP) {
          // It moved like a pinch: rescue the half-stroke and start zooming.
          e.stopPropagation();
          cancelSurfaceStroke(p.firstId);
          pending.current = null;
          pinch.current = { d0: Math.max(d, 1), m0: m, t0: tRef.current };
        }
      }
    };

    const onUpOrCancel = (e: PointerEvent) => {
      if (!e.isTrusted || e.pointerType !== "touch") return;
      const now = performance.now();
      const info = touches.current.get(e.pointerId);
      const p = pending.current;
      if (p && info) {
        if (e.pointerId === p.firstId) {
          const travel = Math.hypot(info.x - info.sx, info.y - info.sy);
          if (e.type === "pointerup" && travel < SLOP && now - p.start < TAP_MS) {
            // The first finger tapped out while the second is still undecided:
            // half of a two-finger tap. Discard the dot rather than commit it.
            swallow(e);
            cancelSurfaceStroke(p.firstId);
            p.firstUp = true;
            if (p.secondUp) {
              drawingRef.current.undo();
              pending.current = null;
            }
          } else {
            // A real stroke ended (or the pointer was cancelled); the second
            // finger no longer means anything.
            pending.current = null;
          }
        } else if (e.pointerId === p.secondId) {
          if (e.type === "pointerup" && now - p.start < TAP_MS) {
            p.secondUp = true;
            if (p.firstUp) {
              drawingRef.current.undo();
              pending.current = null;
            }
            // Otherwise: wait — the first finger may tap out too (undo), or
            // carry on drawing (its stroke was never interrupted).
          } else {
            pending.current = null;
          }
        }
      }
      touches.current.delete(e.pointerId);
      if (touches.current.size < 2) pinch.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.002));
    };

    vp.addEventListener("pointerdown", onDown, true);
    vp.addEventListener("pointermove", onMove, true);
    vp.addEventListener("pointerup", onUpOrCancel, true);
    vp.addEventListener("pointercancel", onUpOrCancel, true);
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      vp.removeEventListener("pointerdown", onDown, true);
      vp.removeEventListener("pointermove", onMove, true);
      vp.removeEventListener("pointerup", onUpOrCancel, true);
      vp.removeEventListener("pointercancel", onUpOrCancel, true);
      vp.removeEventListener("wheel", onWheel);
    };
  }, [zoomAt]);

  // ---- tool state (a compact version of <Draw>'s wiring, ink mode "auto") ----
  const [tool, setTool] = useState<ToolState>({
    active: "pen",
    color: "#111111",
    size: PEN_BY_ID.pen.defaultSize,
    opacity: PEN_BY_ID.pen.defaultOpacity,
    eraserSize: 28,
  });
  const [inks, setInks] = useState<Partial<Record<PenId, string>>>({});
  const toolRef = useRef<ToolState | null>(null);
  const [ink, setInk] = useState("#111111");
  const tuned = useRef<Partial<Record<PenId, { size: number; opacity: number }>>>({});

  const inkFor = useCallback(
    (id: PenId) => inks[id] ?? PEN_BY_ID[id].defaultColor ?? ink,
    [inks, ink],
  );

  const lastPen = useRef<PenId>("pen");

  const select = useCallback(
    (id: ToolId) => {
      if (id === "eraser") return setTool(t => ({ ...t, active: "eraser" }));
      lastPen.current = id;
      const preset = PEN_BY_ID[id];
      const last = tuned.current[id];
      setTool(t => ({
        ...t,
        active: id,
        size: last?.size ?? preset.defaultSize,
        opacity: last?.opacity ?? preset.defaultOpacity,
        color: inkFor(id),
      }));
    },
    [inkFor],
  );

  const patch = useCallback((p: Partial<ToolState>) => {
    setTool(t => {
      if (p.color && t.active !== "eraser") {
        if (PEN_BY_ID[t.active as PenId].defaultColor) {
          setInks(m => ({ ...m, [t.active as PenId]: p.color as string }));
        } else {
          setInk(p.color);
        }
      }
      if ((p.size !== undefined || p.opacity !== undefined) && t.active !== "eraser") {
        const id = t.active as PenId;
        tuned.current[id] = { size: p.size ?? t.size, opacity: p.opacity ?? t.opacity };
      }
      return { ...t, ...p };
    });
  }, []);

  toolRef.current = tool;

  /** Swatch tap: colour the pen in hand — or bring the last pen back first. */
  const pickSwatch = useCallback(
    (color: string) => {
      if (toolRef.current?.active === "eraser") select(lastPen.current);
      patch({ color });
    },
    [select, patch],
  );

  const surfaceTool: Tool = useMemo(
    () =>
      tool.active === "eraser"
        ? { kind: "eraser", size: tool.eraserSize }
        : { kind: "pen", pen: tool.active, color: tool.color, size: tool.size, opacity: tool.opacity },
    [tool],
  );

  /** Step the size of whatever is in hand (drawesome's [ and ] behaviour). */
  const nudgeSize = useCallback((delta: number) => {
    setTool(t => {
      if (t.active === "eraser") {
        return { ...t, eraserSize: Math.max(1, Math.min(120, t.eraserSize + delta)) };
      }
      const size = Math.max(1, Math.min(80, t.size + delta));
      tuned.current[t.active] = { size, opacity: t.opacity };
      return { ...t, size };
    });
  }, []);

  const pens = useMemo(
    () => (narrow ? (["pencil", "pen", "marker", "highlighter", "brush"] as PenId[]).map(id => PEN_BY_ID[id]) : PENS),
    [narrow],
  );

  // Keyboard: drawesome's full set — ⌘Z/⌘⇧Z/⌘Y, pen letters, E, [ and ].
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (meta && k === "z") {
        e.preventDefault();
        return e.shiftKey ? drawing.redo() : drawing.undo();
      }
      if (meta && k === "y") {
        e.preventDefault();
        return drawing.redo();
      }
      if (meta) return;
      // Never steal keys from a field (the advanced modal, the colour input).
      const t = e.target as HTMLElement | null;
      if (t && t.closest("input,textarea,select,[contenteditable]")) return;
      if (k === "e") return select("eraser");
      if (k === "[") return nudgeSize(-1);
      if (k === "]") return nudgeSize(1);
      const pen = pens.find(p => p.key === k);
      if (pen) select(pen.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing, select, pens, nudgeSize]);

  // Report strokes without making the caller own them.
  const changed = useRef(onChange);
  changed.current = onChange;
  useEffect(() => {
    changed.current?.(drawing.strokes);
  }, [drawing.strokes]);


  /** The ink in hand came from the picker, not the palette. */
  const customInk =
    tool.active !== "eraser" && !SWATCHES.some(c => c.toLowerCase() === tool.color.toLowerCase());

  return (
    <div className="zoom-root">
      <div className="zoom-viewport" ref={viewport}>
        <div
          className="zoom-inner"
          ref={inner}
          style={{
            width: board.w,
            height: board.h,
            transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})`,
          }}
        >
          <DrawSurface
            drawing={drawing}
            board={board}
            background={background}
            tool={surfaceTool}
            showBrushCursor={!narrow}
          />
        </div>
        <div className="zoom-hud">
          <button onClick={() => zoomCentre(1 / 1.25)} aria-label="Zoom out">−</button>
          <span className="zoom-pct">{Math.round(t.s * 100)}%</span>
          <button onClick={() => zoomCentre(1.25)} aria-label="Zoom in">+</button>
          <button
            className="zoom-fit"
            onClick={() => {
              touched.current = false;
              fit();
            }}
            title="Reset zoom to fit"
          >
            Fit
          </button>
        </div>
      </div>
      <div className="sd bottom-dock" data-theme="light" data-placement="bottom" data-depth="regular">
        <Toolbar
          placement="bottom"
          tool={tool}
          inkFor={inkFor}
          pens={pens}
          eraser
          controls={{ minimize: false, color: false, custom: false, ...(narrow ? { opacity: false } : null) }}
          settings={narrow ? "tool" : "bar"}
          theme="light"
          shortcuts
          tooltips={!narrow}
          onSelect={select}
          onChange={patch}
          canUndo={drawing.canUndo}
          canRedo={drawing.canRedo}
          onUndo={drawing.undo}
          onRedo={drawing.redo}
          onClear={drawing.clear}
          hasStrokes={drawing.strokes.length > 0}
        />
        <div className="swatch-dock" data-narrow={narrow ? "" : undefined}>
  {SWATCHES.map(c => (
          <button
            key={c}
            style={{ background: c }}
            className={tool.active !== "eraser" && tool.color.toLowerCase() === c.toLowerCase() ? "on" : ""}
            onClick={() => pickSwatch(c)}
            aria-label={`Ink ${c}`}
          />
        ))}
        <label
          className={`custom${customInk ? " on" : ""}`}
          style={customInk ? { background: tool.color } : undefined}
          aria-label="Custom colour"
        >
          <input
            type="color"
            value={tool.active !== "eraser" ? tool.color : "#111111"}
            onChange={e => pickSwatch(e.target.value)}
          />
        </label>
        </div>
      </div>
    </div>
  );
}
