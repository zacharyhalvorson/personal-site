# `work/` — the case-study reader

A password-gated, tabbed reader (`work/index.html`) over a stack of `<iframe>`s,
one per case study. Each case study is a slide deck **exported from Claude
design** and dropped in at `work/<slug>/`.

## Publishing or updating a case study

1. **Export from Claude design** and replace `work/<slug>/` with the new files.
2. **Optimize the deck's videos** for fast loading:
   ```sh
   node work/optimize-deck.mjs <slug>      # e.g. rayban-meta
   # or, to do every deck at once:
   node work/optimize-deck.mjs --all
   ```
   Re-run this **after every re-export** — a fresh export overwrites
   `index.html` and resets the `<video>` tags. The script is idempotent, so
   running it on an already-optimized deck does nothing.
3. **If it's a new case study**, add one line to the `CASES` manifest in
   `work/index.html` (order = tab order; the first entry is the default tab).

## How fast loading works

A raw export ships every slide `<video>` with `autoplay` and no `preload`, and
every slide is in the DOM at once — so the browser eagerly downloads **all** the
clips on first load (tens of MB), most for slides nobody scrolls to. It also
ships an in-browser **edit-mode toolchain** (React + Babel-standalone from a CDN
that transform the `deck-tweaks` / `tweaks-panel` authoring panel live) that no
visitor needs. Two pieces fix this:

- **`optimize-deck.mjs`** (run per export) does three things to each deck:
  - rewrites every `<video>` to `preload="none"` with no `autoplay`, and gives
    each clip a **poster** still (a frame extracted with `ffmpeg`). The poster
    is what shows on the slide and in the navigator rail thumbnail before/while
    the clip is deferred.
  - makes the deck's Google Fonts stylesheet load **async** (the raw export
    links it render-blocking, which stalls the first paint on a round-trip to
    `fonts.googleapis.com`). The deck defaults to the system font stack with
    `font-display: swap`, so the webfont can swap in lazily.
  - **strips the edit-mode toolchain** — the `<script type="text/babel">` JSX
    tags plus the React/ReactDOM/Babel-standalone CDN scripts that exist only to
    run them. That panel only mounts inside the design editor; at view time it
    just re-applies the theme/font already baked into the export's `<html>`, so
    it's pure dead weight — and the site's only third-party-CDN dependency. The
    deck's own player (`deck-stage.js` / `image-slot.js`) is vanilla and is left
    untouched. Bundler-style exports inline these behind a manifest and are
    detected and skipped, same as their media.
- **The reader shell** (`work/index.html`, automatic for every deck) plays only
  the **on-screen slide's** videos and pauses the rest. So a clip's bytes are
  pulled only when its slide is actually shown, then stay buffered for instant
  revisits.

The shell half needs no per-deck work — only step 2 above is per-export.

### Requirements / notes

- `optimize-deck.mjs` needs **`ffmpeg`** on your `PATH` (only when it has to
  generate a poster). No npm dependencies.
- Posters are written next to each video as `poster-<name>.jpg` and reused on
  later runs. Pass `--force` to regenerate them, or `--ss <seconds>` to grab the
  poster frame at a different timestamp (default `0`, which matches the start of
  playback so there's no visual jump when a clip begins).
- Bundler-style exports that inline their media (no separate video files on
  disk) are detected and left untouched — their bytes are already local.
- The decks are meant to be viewed **through this reader**, which drives video
  playback. Opening a deck's `index.html` directly (outside the reader) will
  show videos resting on their posters without playback.
