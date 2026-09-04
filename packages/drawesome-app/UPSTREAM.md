# Drawesome — upstream candidates

Friction found while building the Nifty Ink experiment on
[benjitaylor/drawesome](https://github.com/benjitaylor/drawesome).
Their CONTRIBUTING asks for an issue before larger PRs; bug fixes are
"always welcome".

## Ready

- **#5 — `pointercancel` commits the in-progress stroke instead of
  discarding it.** Already filed upstream (unclaimed). We hit it via
  pinch-zoom: cancelling the first finger's stroke commits junk ink, and
  cleaning up pollutes undo history. Our candidate fix is in
  `src/vendor/DrawSurface.tsx` (marked `UPSTREAM-FIX(#5)`) — a
  `cancelGesture` that discards instead of committing; the file is
  otherwise byte-identical to master. Live repro: draw, land a second
  finger, pinch.

- **Horizontal bar overflows narrow screens.** The bottom-placed bar is
  as wide as its contents with no responsive compaction, so on a phone in
  portrait it runs past the viewport edges. The README's suggested fix is
  switching to a vertical rail, but a bottom bar is the natural phone
  layout for a drawing app. We had to trim tools AND override internal
  paddings/sizes via CSS (`.bottom-dock .MorphBar_panel` etc. in
  `src/index.css`) to make it fit a 390px screen. An issue proposing the
  bar tighten its spacing below a width threshold seems worth floating.
