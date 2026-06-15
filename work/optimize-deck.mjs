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
// This rewrites each deck's <video> tags to load lazily and gives every clip a
// poster still, so:
//   • the browser fetches a clip only when its slide is actually shown — the
//     reader shell (work/index.html) plays the on-screen slide's videos and
//     pauses the rest — and
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
// The playback half is automatic for every deck (handled by the shell), so the
// ONLY per-export step is running this script. Re-run it after every re-export.
//
// Usage:
//   node work/optimize-deck.mjs <slug|path> [<slug|path> ...]
//   node work/optimize-deck.mjs --all          # every deck under work/
//   node work/optimize-deck.mjs <slug> --force # regenerate posters too
//   node work/optimize-deck.mjs <slug> --ss 0.5  # grab posters at 0.5s in
//
// Requires ffmpeg on PATH (only invoked when a poster needs generating).
// Idempotent: posters already on disk are reused unless --force is passed, and
// re-running on an already-optimized deck makes no changes.
// ---------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const WORK_DIR = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let force = false;
let ss = "0"; // poster timestamp; frame 0 matches playback start (no jump)
let all = false;
const targets = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--force") force = true;
  else if (a === "--all") all = true;
  else if (a === "--ss") ss = String(args[++i]);
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

// Rewrite a single <video> opening tag: drop autoplay, force preload="none",
// and ensure a poster. Existing class/loop/muted/playsinline/style/data-* are
// left untouched.
function rewriteTag(tag, posterRel, hadPoster) {
  let out = tag;
  // Drop autoplay (bare `autoplay` or `autoplay="..."`).
  out = out.replace(/\s+autoplay(\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/i, "");
  // Normalize preload to none (replace existing, else add).
  if (/\spreload\s*=/i.test(out)) {
    out = out.replace(/\spreload\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, ' preload="none"');
  } else {
    out = out.replace(/<video\b/i, '<video preload="none"');
  }
  if (!hadPoster) out = out.replace(/<video\b/i, `<video poster="${posterRel}"`);
  return out;
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

  if (rewritten || postersMade || fonts.count || editors.count) {
    writeFileSync(indexPath, html);
    const bits = [`${rewritten} tag(s) rewritten`, `${postersMade} poster(s) generated`];
    if (fonts.count) bits.push(`${fonts.count} font link(s) made async`);
    if (editors.count) bits.push(`${editors.count} editor script(s) stripped`);
    console.log(`✓ ${slug}: ${bits.join(", ")}${skipped ? `, ${skipped} skipped` : ""}`);
  } else {
    console.log(`· ${slug}: already optimized${skipped ? ` (${skipped} non-file src skipped)` : ""}`);
  }
}

const indexes = all ? discoverDecks() : targets.map(resolveIndex);
if (!indexes.length) fail("nothing to do — pass a <slug>, a path, or --all");
indexes.forEach(processDeck);
