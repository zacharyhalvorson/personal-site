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

- **`optimize-deck.mjs`** (run per export) does several things to each deck:
  - rewrites every `<video>` to load lazily — moving its source from the native
    `src` onto `data-src` (so the element never makes the HTTP Range request some
    preview hosts choke on), dropping `autoplay`, and giving each clip a **poster**
    still (a frame extracted with `ffmpeg`). The poster is what shows on the slide
    and in the navigator rail thumbnail before/while the clip is deferred.
  - **injects the lazy/prefetch video player** (`<script id="lazy-video-loader">`)
    that drives those clips: it plays only the active slide's clips, pauses the
    rest, and warms the **neighbouring** slides' clips during idle so a clip is
    ready the moment you navigate to it — no spinner, the poster covers any gap.
    Because the player is injected here (it's the single source of truth), a
    re-export that resets `index.html` gets the current player back on the next
    run — there's no hand-maintained loader to forget.
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
  - **downscales + re-encodes oversized slide images to WebP** — a raw export
    ships slide art at full capture resolution (the Ray-Ban Meta deck alone
    carried ~20 MB of PNG/JPEG), and since every slide is in the DOM at once the
    browser pulls all of it eagerly on first load, so a slide you reach early can
    still be waiting on the big ones. Each referenced image is capped at a
    1600px longest edge and re-encoded to WebP (`cwebp`, alpha preserved), the
    references are rewritten to the `.webp`, and the original is dropped —
    typically a 6–20× cut with no visible loss at slide size. Images that don't
    actually get smaller (tiny icons) keep their original; video posters and
    remote/bundled images are left alone.
  - **re-encodes oversized slide clips in place** — a raw export ships the demo
    clips straight from screen capture / motion tools at far higher bitrates than
    a muted, looping, slide-sized `<video>` needs (the Ray-Ban Meta deck alone
    carried ~80 MB of clips, several topping 15 MB). Each referenced clip is
    re-encoded to H.264 (`yuv420p`, faststart) at a constant-quality CRF (`28` by
    default) with its longest edge capped at 1920px and audio dropped (every clip
    is muted), then written back **under the same filename** — so the
    `data-src`/`data-vsrc` references and `poster-*.jpg` stills (frame 0 is
    unchanged) stay valid with no markup edits. Typically a 3–13× cut with no
    visible loss at slide size; a clip that wouldn't actually shrink keeps its
    quality. A `comment` metadata sentinel marks the re-encode so re-runs skip it,
    while a fresh re-export (which lands an un-stamped file) is recompressed again.
- **The reader shell** (`work/index.html`, automatic for every deck) complements
  the injected player: it preloads each clip's poster behind the video to kill the
  poster→first-frame flash, decodes the deck's slide images during idle so
  navigating to a slide paints instantly, and pause/plays the on-screen slide's
  videos in step with the deck (harmless overlap with the injected player, which
  drives the actual loading).

The shell half needs no per-deck work — only step 2 above is per-export.

### Requirements / notes

- `optimize-deck.mjs` needs **`ffmpeg`** on your `PATH` (to generate posters,
  read image dimensions, and re-encode the slide clips) and **`cwebp`** (libwebp)
  for the image pass. No npm dependencies. If `cwebp` is missing the image pass is
  skipped (the deck still works, just heavier); pass `--no-images` to skip it
  explicitly, or tune it with `--max-edge <px>` / `--img-quality <0-100>`. The
  video pass is likewise skipped if `ffmpeg` is missing; pass `--no-videos` to
  skip it explicitly, or tune it with `--v-crf <n>` / `--v-preset <name>` /
  `--v-max-edge <px>`.
- Posters are written next to each video as `poster-<name>.jpg` and reused on
  later runs. Pass `--force` to regenerate them, or `--ss <seconds>` to grab the
  poster frame at a different timestamp (default `0`, which matches the start of
  playback so there's no visual jump when a clip begins).
- Bundler-style exports that inline their media (no separate video files on
  disk) are detected and left untouched — their bytes are already local.
- The decks are usually viewed **through this reader**, but the injected player
  is self-contained, so opening a deck's `index.html` directly also plays its
  videos (active slide plays, neighbours warm ahead) — it no longer just rests on
  the posters.
