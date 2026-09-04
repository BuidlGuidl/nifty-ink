import { PEN_BY_ID, dotRadius, eraseLayers, polylinePath, strokePath, type Stroke } from "drawesome";

/**
 * Serialize strokes into a standalone SVG that REPLAYS the drawing.
 *
 * Drawesome's pens are filled outline polygons (that's how they get variable
 * width), so the classic stroke-dashoffset trick can't run on the visible
 * paths directly. Each ink stroke therefore animates in two phases:
 *
 *  1. a constant-width "pen pass" — the raw polyline drawing itself in via
 *     the dash trick. Direct rendering, so a self-crossing stroke shows
 *     nothing ahead of the pen (a reveal MASK would expose future ink at
 *     every crossing — flecks of "hatching").
 *  2. the true variable-width outline, swapped in as the pass completes.
 *
 * Eraser passes are dash-animated polylines inside the same layer masks the
 * static export uses, so the rubbing-out replays too.
 *
 * Resilience: every element's BASE state is the finished drawing; animations
 * carry no fill and only hide/redraw during playback. A dropped animation
 * (e.g. Chromium's load-time race that cancels animations on the first-parsed
 * elements) degrades to "this stroke shows early", never a wrong end state —
 * and renderers that ignore animation entirely (PNG thumbnailers) rasterise
 * the complete artwork instead of a blank board.
 *
 * Timing is synthesized from path length (strokes carry no timestamps),
 * played at constant pen speed after a short lead-in, and the whole timeline
 * compresses proportionally to fit MAX_TOTAL. Pure CSS — no scripts, so it
 * plays inside <img> tags.
 */

const SPEED = 800; // px of pen travel per second
const GAP = 0.06; // pause between strokes, seconds
const MIN_DUR = 0.12;
const MAX_DUR = 2.5;
/** Quiet beat before the first stroke, seconds. Also keeps every animation
 * clear of the browser's load window. */
const LEAD = 0.4;
/**
 * Ceiling on total playback. A sketch shorter than this plays at natural pen
 * speed; an intricate drawing has its whole timeline compressed
 * proportionally to fit, so relative pacing (and the erase order) survives.
 */
const MAX_TOTAL = 12;

/** Crossfade length at the pen-pass -> outline handover, seconds. */
const FADE = 0.08;

/**
 * Pen-pass width as a fraction of nominal size. The pass is a constant-width
 * stand-in for the real outline, so pens whose width rides pressure/speed
 * draw closer to their MEAN width — the outline then lands as a slight
 * settle instead of a shrink. Constant-width pens are exact at 1.
 */
const PASS_WIDTH: Record<string, number> = {
  pencil: 0.78,
  pen: 0.78,
  brush: 0.78,
  fountain: 0.7,
  marker: 0.9,
  fineliner: 1,
  highlighter: 1,
};

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmt = (n: number) => Math.round(n * 1000) / 1000;

function pathLength(points: Stroke["points"]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

type Timing = { delay: number; dur: number };

/** One entry per stroke, sequenced in the order they were drawn. */
function timeline(strokes: Stroke[], maxTotal = MAX_TOTAL): { times: Timing[]; total: number } {
  const times: Timing[] = [];
  let t = 0;
  for (const s of strokes) {
    const dur = Math.min(MAX_DUR, Math.max(MIN_DUR, pathLength(s.points) / SPEED));
    times.push({ delay: t, dur });
    t += dur + GAP;
  }
  if (t > maxTotal) {
    const k = maxTotal / t;
    for (const tm of times) {
      tm.delay *= k;
      tm.dur *= k;
    }
    t = maxTotal;
  }
  return { times, total: t };
}

/** The visible mark for one ink stroke: pen pass, then the true outline. */
function strokeMarkup(s: Stroke, tm: Timing): string {
  const blend = PEN_BY_ID[s.pen].blend === "multiply" ? "mix-blend-mode:multiply;" : "";
  const paint = `fill="${esc(s.color)}" fill-opacity="${s.opacity}"`;
  const t1 = fmt(LEAD + tm.delay);
  const du = fmt(Math.max(tm.dur, 0.02));
  const t2 = fmt(LEAD + tm.delay + Math.max(tm.dur, 0.02));

  const d = strokePath(s.pen, s.size, s.points, true, s.shape);
  if (d) {
    const w = s.size * (PASS_WIDTH[s.pen] ?? 1);
    return (
      // Pen pass: hidden at rest, lit for its slot while the dash draws,
      // then faded out as the outline fades in underneath.
      `<path d="${polylinePath(s.points)}" fill="none" stroke="${esc(s.color)}"` +
      ` stroke-opacity="${s.opacity}" stroke-width="${fmt(w)}"` +
      ` stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="pen"` +
      ` style="${blend}animation:rv ${du}s linear ${t1}s,lit ${du}s linear ${t1}s,fade ${FADE}s linear ${t2}s"/>` +
      // The outline is the resting state; veiled until the pen pass hands
      // over, then crossfaded in.
      `<path d="${d}" ${paint} class="ink"` +
      ` style="${blend}animation:veil ${t2}s step-end,fin ${FADE}s linear ${t2}s"/>`
    );
  }
  if (s.points.length) {
    const [x, y] = s.points[0];
    return (
      `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(dotRadius(s.size))}" ${paint}` +
      ` class="ink" style="${blend}animation:veil ${t1}s step-end,fin 0.12s linear ${t1}s"/>`
    );
  }
  return "";
}

export function toAnimatedSvg(
  strokes: Stroke[],
  width: number,
  height: number,
  background: string | null,
  /** Cap on total playback in seconds; the timeline compresses to fit. */
  maxSeconds = MAX_TOTAL,
): string {
  const { times } = timeline(strokes, maxSeconds);
  const layers = eraseLayers(strokes);

  // Each erase cut is defined once and <use>d by every layer mask it applies
  // to — an erase after N layers would otherwise embed its points N times.
  // At rest the cut sits fully drawn (the erase applied); during playback it
  // holds itself undrawn until its slot, then draws in.
  const eraseDefs = strokes
    .map((s, n) => {
      if (!s.erase) return "";
      const t1 = fmt(LEAD + times[n].delay);
      const du = fmt(Math.max(times[n].dur, 0.02));
      return (
        `<path id="c${n}" d="${polylinePath(s.points)}" fill="none" stroke="#000"` +
        ` stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round"` +
        ` pathLength="1" class="cut"` +
        ` style="animation:undrawn ${t1}s linear,rv ${du}s linear ${t1}s"/>`
      );
    })
    .filter(Boolean)
    .join("");

  const body = layers
    .map((layer, li) => {
      const ink = layer.ink
        .map(n => strokeMarkup(strokes[n], times[n]))
        .filter(Boolean)
        .join("");
      if (!ink) return "";
      if (!layer.erasers.length) return ink;

      // The layer's erase mask: white keeps ink, black polylines take it away.
      const id = `e${li}`;
      const cuts = layer.erasers.map(n => `<use href="#c${n}"/>`).join("");

      return (
        `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">` +
        `<rect width="${width}" height="${height}" fill="#fff"/>${cuts}</mask>` +
        `<g mask="url(#${id})">${ink}</g>`
      );
    })
    .join("");

  const bg =
    !background || background === "transparent"
      ? ""
      : `<rect width="${width}" height="${height}" fill="${esc(background)}"/>`;

  // Base styles are the FINISHED drawing; keyframes carry explicit from/to so
  // nothing depends on animation fill states persisting.
  const css =
    `<style>` +
    `.pen{opacity:0;stroke-dasharray:1}` +
    `.cut{stroke-dasharray:1}` +
    `@keyframes rv{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}` +
    `@keyframes lit{from{opacity:1}to{opacity:1}}` +
    `@keyframes veil{from{opacity:0}to{opacity:0}}` +
    `@keyframes fade{from{opacity:1}to{opacity:0}}` +
    `@keyframes fin{from{opacity:0}to{opacity:1}}` +
    `@keyframes undrawn{from{stroke-dashoffset:1}to{stroke-dashoffset:1}}` +
    `@media (prefers-reduced-motion:reduce){.pen,.cut,.ink{animation:none!important}}` +
    `</style>`;

  const defs = eraseDefs ? `<defs>${eraseDefs}</defs>` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    css +
    defs +
    bg +
    body +
    `</svg>`
  );
}
