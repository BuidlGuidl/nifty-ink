# drawesome-app

A small drawing app. It is a test for a new version of nifty.ink.
It uses the [drawesome](https://github.com/benjitaylor/drawesome) library for the pens and the canvas.

## Run it

```bash
yarn start-draw
```

This starts a dev server on port 3001.

## What it does

- Draw on an 800×800 board with drawesome's seven pens and eraser.
- Zoom and pan: pinch with two fingers, or use the mouse wheel. The `Fit` button resets the view.
- Two-finger tap = undo.
- A color palette is always visible. The rainbow chip opens the system color picker.
- `▶` plays the drawing back: an animated SVG draws every stroke again, in order, erases included.
- `</>` opens a panel with the SVG markup and the stroke data (JSON).
- Keyboard: letter keys pick pens, `E` is the eraser, `[` and `]` change size, `⌘Z` / `⌘⇧Z` undo and redo.

There is no saving yet. The stroke data (JSON) is the format we would store later.

## Files

| File | What it is |
|---|---|
| `src/App.tsx` | Page shell: canvas, play overlay, data panel |
| `src/ZoomableDraw.tsx` | The canvas. Drawesome's parts plus our zoom, gestures, and color palette |
| `src/animatedSvg.ts` | Turns stroke data into a self-playing SVG (no scripts inside) |
| `src/vendor/DrawSurface.tsx` | Copy of drawesome's drawing surface with one small fix (see below) |
| `UPSTREAM.md` | Notes on fixes and issues we want to send to the drawesome project |

## The vendored file

`src/vendor/DrawSurface.tsx` is drawesome's own code with one change:
a cancelled pointer now throws its stroke away instead of keeping it
(drawesome issue #5). When drawesome fixes this, we can delete the file
and import the surface from the library again.
