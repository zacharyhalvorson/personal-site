#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Post-export optimizer for the Claude-designed slide decks in work/<slug>/.
//
// Why this exists: a fresh export from Claude design overwrites the deck's
// index.html and ships every slide <video> with `autoplay` and no `preload`.
// Because every slide lives in the DOM at once, the browser then eagerly
// downloads *all* of the clips on first load — tens of MB, most of it for
// slides the visitor may never scroll to.
//
// This rewrites each deck's <video> tags to load lazily — moving the source from
// the native `src` onto `data-src` and giving every clip a poster still — and
// injects a small player (LAZY_VIDEO_LOADER) that drives them, so:
//   • the browser fetches a clip only when its slide is actually shown, and the
//     injected player additionally warms the neighbouring slides' clips during
//     idle so a clip is ready the moment you navigate to it (no spinner — the
//     poster covers any gap). This works whether the deck is opened directly or
//     embedded in the reader shell; the shell's own play/pause just complements it.
//   • a deferred clip still shows a frame on the slide and in the navigator
//     rail thumbnails (the rail falls back to the poster when it can't grab a
//     live frame).
//
// It also strips the in-browser JSX edit-mode toolchain a raw export ships
// (React + Babel-standalone from a CDN, plus the deck-tweaks / tweaks-panel
// authoring panel). That panel only mounts inside the design editor; at view
// time it just re-applies the theme/font already baked into the export's
// <html>, so for visitors it's pure dead weight — and the site's only
// third-party-CDN dependency. See stripEditorScripts.
//
// The playback half is automatic for every deck (the injected player, with the
// reader shell complementing it), so the ONLY per-export step is running this
// script. Re-run it after every re-export.
//
// Usage:
//   node work/optimize-deck.mjs <slug|path> [<slug|path> ...]
//   node work/optimize-deck.mjs --all          # every deck under work/
//   node work/optimize-deck.mjs <slug> --force # regenerate posters too
//   node work/optimize-deck.mjs <slug> --ss 0.5  # grab posters at 0.5s in
//
// Requires ffmpeg on PATH — used for poster stills and the video re-encode pass
// (both degrade gracefully: posters are reused if present, the video pass is
// skipped entirely if ffmpeg is missing).
// Idempotent: posters already on disk are reused unless --force is passed,
// re-encoded clips carry a metadata sentinel so they're skipped on re-run, and
// re-running on an already-optimized deck makes no changes.
// ---------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, renameSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const WORK_DIR = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let force = false;
let ss = "0"; // poster timestamp; frame 0 matches playback start (no jump)
let all = false;
let noImages = false; // skip the image (downscale + WebP) pass
let maxEdge = 1600;   // cap an image's longest side at this many px
let imgQuality = 80;  // cwebp quality for the image pass
let noVideos = false; // skip the video re-encode pass
let vCrf = 28;        // H.264 CRF for the video pass (higher = smaller/softer)
let vPreset = "slow"; // x264 preset (slower = smaller at the same CRF)
let vMaxEdge = 1920;  // cap a video's longest side at this many px
const targets = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--force") force = true;
  else if (a === "--all") all = true;
  else if (a === "--ss") ss = String(args[++i]);
  else if (a === "--no-images") noImages = true;
  else if (a === "--max-edge") maxEdge = parseInt(args[++i], 10) || maxEdge;
  else if (a === "--img-quality") imgQuality = parseInt(args[++i], 10) || imgQuality;
  else if (a === "--no-videos") noVideos = true;
  else if (a === "--v-crf") vCrf = parseInt(args[++i], 10) || vCrf;
  else if (a === "--v-preset") vPreset = String(args[++i]);
  else if (a === "--v-max-edge") vMaxEdge = parseInt(args[++i], 10) || vMaxEdge;
  else if (a.startsWith("--")) fail(`Unknown flag: ${a}`);
  else targets.push(a);
}

function fail(msg) {
  console.error("error: " + msg);
  process.exit(1);
}

// Resolve a target (a slug like "rayban-meta", a deck dir, or an index.html)
// to its index.html path.
function resolveIndex(target) {
  const cands = [
    target,
    join(target, "index.html"),
    join(WORK_DIR, target),
    join(WORK_DIR, target, "index.html"),
  ];
  for (const c of cands) {
    if (existsSync(c) && c.endsWith(".html")) return c;
  }
  fail(`could not find an index.html for "${target}"`);
}

// Discover every deck under work/ (any subdir with an index.html). The reader
// shell itself (work/index.html) is excluded — it lives directly in work/.
function discoverDecks() {
  return readdirSync(WORK_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(WORK_DIR, d.name, "index.html"))
    .filter((p) => existsSync(p));
}

// Pull one attribute's value out of a tag string (handles "double", 'single',
// and bare values). Returns null if absent.
function attr(tag, name) {
  const m = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
}

// Rewrite a single <video> opening tag: drop autoplay, move the source off the
// native `src` and onto `data-src`, force preload="none", and ensure a poster.
// Existing class/loop/muted/playsinline/style/data-* are left untouched.
//
// Why move src → data-src: a native <video src> issues an HTTP Range request,
// which some preview/share hosts answer with an error on an otherwise-valid file.
// Parking the source in data-src means the element never makes that request — the
// injected lazy-video-loader (see LAZY_VIDEO_LOADER) fetches the file as a blob
// and hands it back, and gains a place to do per-slide playback + idle prefetch.
function rewriteTag(tag, posterRel, hadPoster) {
  let out = tag;
  // Drop autoplay (bare `autoplay` or `autoplay="..."`) — the loader plays the
  // active slide's clips explicitly, so nothing should autoplay off-screen.
  out = out.replace(/\s+autoplay(\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/i, "");
  // Move src="…" → data-src="…". The `\s` anchor means `data-src`/`data-vsrc`
  // (no leading whitespace before "src") are never matched, so a re-run is a
  // no-op and a legacy data-vsrc deck is left alone.
  out = out.replace(/(\s)src(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/i, "$1data-src$2$3");
  // Normalize preload to none (replace existing, else add). Moot without a native
  // src, but correct for the loader's direct-src fallback path.
  if (/\spreload\s*=/i.test(out)) {
    out = out.replace(/\spreload\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, ' preload="none"');
  } else {
    out = out.replace(/<video\b/i, '<video preload="none"');
  }
  if (!hadPoster) out = out.replace(/<video\b/i, `<video poster="${posterRel}"`);
  return out;
}

// The lazy/prefetch video player injected into every deck that has deferred
// clips. Decks load their slide clips from data-src/data-vsrc (never a live src);
// this script plays the active slide's clips, pauses the rest, and warms the
// neighbouring slides' clips during idle so a clip is ready the moment its slide
// is shown. Poster-only placeholder — no spinner, no new state. This is the
// single source of truth: ensureVideoLoader() (re)writes it into each deck, so a
// re-export that resets index.html gets the current player back on the next run.
const LAZY_VIDEO_LOADER = `<script id="lazy-video-loader">
/* Slide clips keep their source in data-src (a fresh export's \`src\` is moved here
   by optimize-deck.mjs) so the element never makes the HTTP Range request a native
   <video src> does — some preview hosts answer it with an error. We fetch each file
   once, hand the element a blob URL, and reuse it. Only the active slide's clips
   play; the neighbouring slides' clips are warmed during idle, so a clip is ready
   the moment its slide is shown. No spinner, no new state — the poster covers any
   remaining gap. Legacy decks using data-vsrc keep working unchanged. */
(function(){
  var SEL = 'video[data-src],video[data-vsrc]';
  function srcOf(v){ return v.getAttribute('data-src') || v.getAttribute('data-vsrc'); }
  function vids(s){ return s ? [].slice.call(s.querySelectorAll(SEL)) : []; }
  function playSafe(v){ try{ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){} }

  // url -> Promise<objectURL>. Dedupes, so a warm() already in flight is reused
  // by the activate() that follows and a revisited clip never re-downloads.
  var blobs = Object.create(null);
  function ensure(url){
    if(blobs[url]) return blobs[url];
    var p = fetch(url)
      .then(function(r){ return r.ok ? r.blob() : Promise.reject(); })
      .then(function(b){ return URL.createObjectURL(b); });
    // A transient failure shouldn't poison the URL forever — drop it so a later
    // activate() can retry (and fall back to a direct src).
    p.catch(function(){ if(blobs[url] === p) delete blobs[url]; });
    blobs[url] = p;
    return p;
  }

  // Warm a slide's clips into blobs without attaching them — they stay on their
  // poster, paused, until their own slide is shown.
  function warm(s){ vids(s).forEach(function(v){ var u=srcOf(v); if(u) ensure(u); }); }

  // Attach the (now usually ready) clip and play it. Falls back to a direct src=
  // if the blob fetch fails — covers a network blip, and streams fine on a host
  // that does support Range.
  function attach(v){
    var url = srcOf(v);
    if(!url) return;
    if(v.dataset.vready){ playSafe(v); return; }
    ensure(url).then(function(obj){
      if(v.dataset.vready) return;
      v.dataset.vready='1'; v.src=obj; playSafe(v);
    }).catch(function(){
      if(v.dataset.vready) return;
      v.dataset.vready='1'; v.src=url; try{ v.load(); }catch(e){} playSafe(v);
    });
  }

  function activate(s){ vids(s).forEach(attach); }
  function deactivate(s){ vids(s).forEach(function(v){ try{ v.pause(); }catch(e){} }); }

  function adjacentSlide(s, dir){
    var n = s;
    while((n = dir > 0 ? n.nextElementSibling : n.previousElementSibling)){
      if(n.classList && n.classList.contains('slide')) return n;
    }
    return null;
  }
  var idle = window.requestIdleCallback || function(fn){ return setTimeout(fn, 200); };
  function prefetchAround(s){
    if(!s) return;
    idle(function(){
      warm(adjacentSlide(s, 1));   // next slide — the likely destination — first
      warm(adjacentSlide(s, -1));  // prev slide — cheap insurance for back-nav
    });
  }

  function init(){
    var stage=document.querySelector('deck-stage');
    if(!stage){ return setTimeout(init,50); }
    stage.addEventListener('slidechange', function(e){
      deactivate(e.detail.previousSlide);
      activate(e.detail.slide);
      prefetchAround(e.detail.slide);
    });
    var first = stage.querySelector('[data-deck-active]') || document.querySelector('section.slide');
    activate(first);
    prefetchAround(first);
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
</script>`;

// Ensure the deck carries the current lazy-video-loader. Idempotent: replaces an
// existing #lazy-video-loader in place (so a re-run upgrades an older player to
// the current one), else inserts it just before </body>. Only added when the deck
// actually has deferred clips. Returns { html, changed }.
function ensureVideoLoader(html) {
  if (!/<video\b[^>]*\bdata-(src|vsrc)\s*=/i.test(html)) return { html, changed: false };
  const existing = /<script\b[^>]*\bid\s*=\s*["']lazy-video-loader["'][^>]*>[\s\S]*?<\/script>/i;
  let out;
  if (existing.test(html)) {
    out = html.replace(existing, () => LAZY_VIDEO_LOADER);
  } else if (/<\/body>/i.test(html)) {
    out = html.replace(/<\/body>/i, () => LAZY_VIDEO_LOADER + "\n</body>");
  } else {
    out = html + "\n" + LAZY_VIDEO_LOADER + "\n";
  }
  return { html: out, changed: out !== html };
}

// Make any render-blocking Google Fonts stylesheet load asynchronously. A raw
// export links the webfont CSS as a normal <link rel="stylesheet">, which
// blocks the deck's first paint on a round-trip to fonts.googleapis.com. The
// deck defaults to the system font stack and uses font-display:swap, so the
// font can load lazily and swap in. The `media="print" onload` swap is the
// standard non-blocking pattern. Preconnect hints are left as-is (they help).
function rewriteFontLinks(html) {
  let count = 0;
  const out = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    if (!/href\s*=\s*["'][^"']*fonts\.googleapis\.com/i.test(tag)) return tag;
    if (/\bmedia\s*=\s*["']?print/i.test(tag) || /\bonload\s*=/i.test(tag)) return tag; // already async
    count++;
    return tag.replace(/\s*\/?>$/, ` media="print" onload="this.media='all'">`);
  });
  return { html: out, count };
}

// Strip the in-browser JSX edit-mode toolchain from a published export. A raw
// export ships a "Tweaks" authoring panel (deck-tweaks.jsx / tweaks-panel.jsx)
// plus the React, ReactDOM, and Babel-standalone CDN scripts that transform and
// run it in the browser. The panel only mounts inside the design editor (it
// listens for __activate_edit_mode) and at view time merely re-applies the
// theme/font defaults already on the export's <html>, so it's dead weight for
// visitors — and the only third-party-CDN dependency on the site. Drop the
// <script type="text/babel"> JSX tags and the React/Babel loaders that exist
// solely to serve them; the deck's own player (deck-stage.js / image-slot.js)
// is vanilla and untouched.
//
// Matches only *empty-bodied* <script ...></script> tags (every target is one),
// so it can never span the content of a bundler-style export, whose React/Babel
// refs live as escaped strings inside a __bundler/* manifest — those have a body
// and are left alone, matching the "bundles are already local" stance below.
function stripEditorScripts(html) {
  const isEditorLoader = (open) =>
    /\bsrc\s*=\s*["'][^"']*(react(-dom)?[@.]|@babel\/standalone|babel(\.min)?\.js)/i.test(open);
  let count = 0;
  const out = html.replace(
    /[ \t]*<script\b([^>]*)>\s*<\/script>[ \t]*\r?\n?/gi,
    (whole, attrs) => {
      const open = "<script" + attrs + ">";
      if (/\btype\s*=\s*["']?text\/babel/i.test(open) || isEditorLoader(open)) {
        count++;
        return "";
      }
      return whole;
    }
  );
  return { html: out, count };
}

function ffmpegPoster(videoAbs, posterAbs) {
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-ss", ss, "-i", videoAbs, "-frames:v", "1", "-q:v", "3", posterAbs],
    { stdio: ["ignore", "ignore", "inherit"] }
  );
}

// ---------------------------------------------------------------------------
// Image pass: downscale oversized slide images and re-encode them to WebP.
//
// A raw export ships slide images at full capture resolution as PNG/JPEG — the
// Ray-Ban Meta deck alone carries ~20 MB across them — and every slide is in the
// DOM at once, so the browser pulls all of it eagerly on first load, leaving a
// slide you reach early still waiting on the big ones behind it. WebP at a sane
// max edge cuts that ~6-20x with no visible loss at slide size, and (being
// alpha-capable) it stands in for both opaque and transparent PNGs. We rewrite
// the deck's references to the .webp and drop the originals.
//
// Needs `cwebp` (libwebp) to encode and `ffprobe` (ships with ffmpeg) to read
// dimensions. If cwebp is absent the whole pass is skipped — the deck still
// works, just heavier. Video posters (poster-*.jpg, owned by the video pass) and
// SVGs are left alone, and any image that doesn't actually get smaller as WebP
// (tiny icons, already-tight art) keeps its original.
let cwebpChecked = false, cwebpOK = false;
function haveCwebp() {
  if (!cwebpChecked) {
    cwebpChecked = true;
    try { execFileSync("cwebp", ["-version"], { stdio: "ignore" }); cwebpOK = true; }
    catch { cwebpOK = false; }
  }
  return cwebpOK;
}

function imageDims(abs) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", abs],
      { encoding: "utf8" }
    );
    const [w, h] = out.trim().split(",").map((n) => parseInt(n, 10));
    return w && h ? { w, h } : null;
  } catch { return null; }
}

function encodeWebp(srcAbs, outAbs, dims) {
  const a = ["-quiet", "-q", String(imgQuality), "-m", "6"];
  // Cap the longest side at maxEdge (cwebp -resize keeps aspect; 0 = auto).
  // Only ever downscale — never enlarge a smaller source.
  if (dims) {
    if (dims.w >= dims.h && dims.w > maxEdge) a.push("-resize", String(maxEdge), "0");
    else if (dims.h > dims.w && dims.h > maxEdge) a.push("-resize", "0", String(maxEdge));
  }
  execFileSync("cwebp", [...a, srcAbs, "-o", outAbs], { stdio: "ignore" });
}

// Find the deck's referenced raster images, convert each to a downscaled WebP,
// and — when that's actually smaller — rewrite every reference to it and delete
// the original. Returns the updated html plus a tally. Idempotent: a re-run sees
// only .webp references and finds nothing to do.
function optimizeImages(html, deckDir) {
  if (noImages) return { html, converted: 0, saved: 0, skipped: 0, unavailable: false };
  if (!haveCwebp()) return { html, converted: 0, saved: 0, skipped: 0, unavailable: true };

  const refs = new Set();
  const re = /(?:src|href|poster|data-src)\s*=\s*"((?:images|videos)\/[^"]+\.(?:png|jpe?g))"/gi;
  let m;
  while ((m = re.exec(html))) refs.add(m[1]);

  let converted = 0, saved = 0, skipped = 0;
  for (const rel of refs) {
    if (/(^|\/)poster-[^/]*$/i.test(rel)) continue; // video posters belong to the video pass
    const srcAbs = join(deckDir, rel);
    if (!existsSync(srcAbs)) continue;
    const outRel = rel.replace(/\.(png|jpe?g)$/i, ".webp");
    const outAbs = join(deckDir, outRel);
    const origSize = statSync(srcAbs).size;
    try {
      encodeWebp(srcAbs, outAbs, imageDims(srcAbs));
    } catch (e) {
      fail(`cwebp failed on ${rel} (is cwebp installed and on PATH?)\n${e.message}`);
    }
    const newSize = existsSync(outAbs) ? statSync(outAbs).size : Infinity;
    // Keep the WebP only when it's a clear win; otherwise discard it and leave
    // the original (covers tiny icons that bloat as WebP).
    if (newSize < origSize * 0.9) {
      html = html.split(rel).join(outRel);
      try { unlinkSync(srcAbs); } catch {}
      saved += origSize - newSize;
      converted++;
    } else {
      try { unlinkSync(outAbs); } catch {}
      skipped++;
    }
  }
  return { html, converted, saved, skipped, unavailable: false };
}

// ---------------------------------------------------------------------------
// Video pass: re-encode oversized slide clips to a much lower bitrate in place.
//
// A fresh export ships the demo clips straight from screen capture / motion
// tools at far higher bitrates than a muted, looping, slide-sized <video> needs
// — the Ray-Ban Meta deck alone carries ~80 MB across them, several clips topping
// 15 MB. Re-encoding to H.264 (yuv420p, faststart) at a constant-quality CRF,
// with a longest-edge cap, cuts the big ones ~3-13x with no visible loss at slide
// size. Audio is dropped (every clip is displayed muted), which also trims bytes.
//
// Re-encoding happens IN PLACE — same filename — so the deck's data-src/data-vsrc
// references and the poster-*.jpg stills (frame 0 is unchanged) stay valid with
// no markup edits. As in the image pass we only keep the re-encode when it's a
// clear win; an already-tight clip is instead stream-copied (lossless) just to
// carry the skip marker, so it isn't re-encoded on every run.
//
// Idempotency rides on a `comment` metadata sentinel baked into every clip we
// touch: a re-run probes it and skips, while a fresh re-export (which lands an
// un-stamped file under the same name) is picked up and recompressed. Needs
// ffmpeg/ffprobe; if either is absent the whole pass is skipped and the deck
// still works, just heavier.
const VIDEO_SENTINEL = "optimize-deck-v1";

let ffmpegChecked = false, ffmpegOK = false;
function haveFfmpeg() {
  if (!ffmpegChecked) {
    ffmpegChecked = true;
    try {
      execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
      execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
      ffmpegOK = true;
    } catch { ffmpegOK = false; }
  }
  return ffmpegOK;
}

// True when this exact file was already re-encoded (or stamped) by a prior run:
// our sentinel sits in the container-level `comment` tag. A fresh re-export
// overwrites the file without it, so the clip is recompressed again — exactly
// what we want.
function videoStamped(abs) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format_tags=comment", "-of", "default=nw=1:nk=1", abs],
      { encoding: "utf8" }
    );
    return out.trim() === VIDEO_SENTINEL;
  } catch { return false; }
}

// Re-encode srcAbs → outAbs: H.264 yuv420p at the configured CRF/preset, longest
// side capped at vMaxEdge (only ever downscaling; dimensions forced even for
// yuv420p), audio dropped, faststart, and our sentinel stamped into the comment.
// The `\,` escapes keep the commas inside min() from splitting the filtergraph.
function encodeVideo(srcAbs, outAbs) {
  const vf = `scale=w=min(${vMaxEdge}\\,iw):h=min(${vMaxEdge}\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2`;
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", srcAbs,
     "-vf", vf,
     "-c:v", "libx264", "-crf", String(vCrf), "-preset", vPreset, "-pix_fmt", "yuv420p",
     "-an", "-movflags", "+faststart",
     "-metadata", `comment=${VIDEO_SENTINEL}`, outAbs],
    { stdio: ["ignore", "ignore", "inherit"] }
  );
}

// Lossless stamp for a clip that wouldn't shrink: copy the video stream untouched
// but add the sentinel (and faststart), so the next run skips it instead of
// re-encoding it again. Audio is dropped to match the re-encode path.
function stampVideo(srcAbs, outAbs) {
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", srcAbs,
     "-c", "copy", "-an", "-movflags", "+faststart",
     "-metadata", `comment=${VIDEO_SENTINEL}`, outAbs],
    { stdio: ["ignore", "ignore", "inherit"] }
  );
}

// Find the deck's referenced clips (src/data-src/data-vsrc → a local .mp4),
// re-encode each in place when that's a clear win, and stamp the rest so they're
// skipped next time. Touches files only — the filename never changes, so no html
// is rewritten. Returns a tally. Idempotent: a re-run sees every clip stamped and
// does nothing.
function optimizeVideos(html, deckDir) {
  if (noVideos) return { converted: 0, stamped: 0, saved: 0, unavailable: false };
  if (!haveFfmpeg()) return { converted: 0, stamped: 0, saved: 0, unavailable: true };

  const refs = new Set();
  const re = /(?:src|data-src|data-vsrc)\s*=\s*"([^"]+\.mp4)"/gi;
  let m;
  while ((m = re.exec(html))) refs.add(m[1]);

  let converted = 0, stamped = 0, saved = 0;
  for (const rel of refs) {
    if (/^(https?:|data:|blob:)/i.test(rel)) continue; // remote/inline — not ours
    const srcAbs = join(deckDir, rel);
    if (!existsSync(srcAbs)) continue;                 // bundler/opaque — no file
    if (videoStamped(srcAbs)) continue;                // already done (idempotent)

    const origSize = statSync(srcAbs).size;
    const tmpAbs = join(deckDir, dirname(rel), `.optdeck-${basename(rel)}`);
    try {
      encodeVideo(srcAbs, tmpAbs);
    } catch (e) {
      try { unlinkSync(tmpAbs); } catch {}
      fail(`ffmpeg failed re-encoding ${rel} (is ffmpeg installed and on PATH?)\n${e.message}`);
    }
    const newSize = existsSync(tmpAbs) ? statSync(tmpAbs).size : Infinity;
    if (newSize < origSize * 0.9) {
      renameSync(tmpAbs, srcAbs); // keep the smaller re-encode (sentinel baked in)
      saved += origSize - newSize;
      converted++;
    } else {
      try { unlinkSync(tmpAbs); } catch {}
      // Not worth re-encoding — stamp the original (lossless) so we skip it later.
      try {
        stampVideo(srcAbs, tmpAbs);
        renameSync(tmpAbs, srcAbs);
        stamped++;
      } catch { try { unlinkSync(tmpAbs); } catch {} }
    }
  }
  return { converted, stamped, saved, unavailable: false };
}

function processDeck(indexPath) {
  const deckDir = dirname(indexPath);
  const slug = basename(deckDir);
  let html = readFileSync(indexPath, "utf8");

  // Render-blocking webfont CSS → async (independent of whether there's video).
  const fonts = rewriteFontLinks(html);
  html = fonts.html;

  // Drop the editor-only React/Babel/tweaks-panel scripts (view-time dead weight).
  const editors = stripEditorScripts(html);
  html = editors.html;

  let rewritten = 0, postersMade = 0, skipped = 0;
  const seen = new Set();

  for (const tag of (html.match(/<video\b[^>]*>/gi) || [])) {
    if (seen.has(tag)) continue; // identical tags: one replaceAll covers all
    seen.add(tag);

    const src = attr(tag, "src");
    if (!src) { skipped++; continue; }
    const videoAbs = join(deckDir, src);
    // Bundler exports inline their media behind opaque ids (no file on disk),
    // and remote srcs aren't ours to poster. Leave those tags alone — their
    // bytes are already local (bundle) or external.
    if (/^(https?:|data:|blob:)/i.test(src) || !existsSync(videoAbs)) { skipped++; continue; }

    const hadPoster = attr(tag, "poster") != null;
    const posterRel = join(dirname(src), `poster-${basename(src, extname(src))}.jpg`).replace(/\\/g, "/");
    const posterAbs = join(deckDir, posterRel);

    // Generate a poster when one is needed and missing (or --force).
    if ((!hadPoster && !existsSync(posterAbs)) || force) {
      try {
        ffmpegPoster(videoAbs, posterAbs);
        postersMade++;
      } catch (e) {
        fail(`ffmpeg failed on ${src} (is ffmpeg installed and on PATH?)\n${e.message}`);
      }
    }

    const next = rewriteTag(tag, posterRel, hadPoster);
    if (next !== tag) {
      html = html.split(tag).join(next);
      rewritten++;
    }
  }

  // Downscale + WebP the slide images, rewriting references to match.
  const images = optimizeImages(html, deckDir);
  html = images.html;

  // Re-encode oversized slide clips in place (same filenames; refs/posters keep).
  const videos = optimizeVideos(html, deckDir);

  // Inject (or refresh) the lazy/prefetch video player so a re-export gets it back.
  const loader = ensureVideoLoader(html);
  html = loader.html;

  if (rewritten || postersMade || fonts.count || editors.count || images.converted || videos.converted || videos.stamped || loader.changed) {
    writeFileSync(indexPath, html);
    const bits = [`${rewritten} tag(s) rewritten`, `${postersMade} poster(s) generated`];
    if (loader.changed) bits.push("video loader refreshed");
    if (fonts.count) bits.push(`${fonts.count} font link(s) made async`);
    if (editors.count) bits.push(`${editors.count} editor script(s) stripped`);
    if (images.converted) bits.push(`${images.converted} image(s) → webp (−${(images.saved / 1048576).toFixed(1)}MB)`);
    if (videos.converted) bits.push(`${videos.converted} video(s) re-encoded (−${(videos.saved / 1048576).toFixed(1)}MB)`);
    if (videos.stamped) bits.push(`${videos.stamped} video(s) stamped`);
    if (images.unavailable) bits.push("images skipped (no cwebp)");
    if (videos.unavailable) bits.push("videos skipped (no ffmpeg)");
    console.log(`✓ ${slug}: ${bits.join(", ")}${skipped ? `, ${skipped} skipped` : ""}`);
  } else {
    const notes = [];
    if (images.unavailable) notes.push("cwebp not found — image pass skipped");
    if (videos.unavailable) notes.push("ffmpeg not found — video pass skipped");
    const note = notes.length ? ` (${notes.join("; ")})` : "";
    console.log(`· ${slug}: already optimized${skipped ? ` (${skipped} non-file src skipped)` : ""}${note}`);
  }
}

const indexes = all ? discoverDecks() : targets.map(resolveIndex);
if (!indexes.length) fail("nothing to do — pass a <slug>, a path, or --all");
indexes.forEach(processDeck);
