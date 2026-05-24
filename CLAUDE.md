# CLAUDE.md

## Project Overview

Personal site for Zachary Halvorson — a product designer based in Seattle, currently at Meta Reality Labs. Deployed at [www.zacharyhalvorson.com](https://www.zacharyhalvorson.com).

The site is a single-page, scroll-snapped portfolio: an intro section followed by one full-viewport section per project (Meta Ray-Ban Display → Ray-Ban Meta → Clio Scheduler → Dooly), each with a representative image, then a closing colophon with education and contact.

Intentionally minimal: hand-written **HTML and CSS**, plus **one small vanilla-JS progressive-enhancement file** (`script.js`) that powers the project media stacks and fullscreen lightbox. No frameworks, no build tools, no package manager. With JS disabled, the site fully degrades (media falls back to a native scroll-snap strip).

## Tech Stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid, `scroll-snap`, scroll-driven animations, `clamp()`, `svh`
- **Vanilla JS** — one small progressive-enhancement file (`script.js`), no framework, no build
- **No build step** — files served as-is
- **No package.json** — zero npm dependencies

## Repository Structure

```
/
├── index.html              # The entire site — intro + 4 project chapters + colophon
├── style.css               # All styles
├── script.js               # Progressive enhancement: media stacks + lightbox
├── CNAME                   # GitHub Pages custom domain (www.zacharyhalvorson.com)
├── favicon.ico             # Favicon
├── favicon-152.png         # Apple touch icon (152px)
├── apple-touch-icon.png    # Apple touch icon
├── embed-image.png         # Open Graph / social preview image
└── images/
    ├── me/                 # Profile photos (400w, 600w, 1200w, full)
    ├── socials/            # Social media icons (GitHub, LinkedIn, etc.)
    └── work/               # One representative image per project
```

## Development

### Local server

No build step. Use any static server:

```sh
python3 -m http.server 8000
# or
npx serve .
```

### Deployment

Deployed via **GitHub Pages** from the `master` branch. Push to `master` and the site updates. The `CNAME` file configures the custom domain.

## Architecture & Conventions

### HTML (`index.html`)

- One `<main>` with seven scroll-snapped `<section class="chapter">` elements
- Each chapter has the same skeleton: `.chapter_meta` (index, role, dates, location) on the left, `.chapter_body` (display heading, lede, bullets) on the right
- Dates use `<time datetime="YYYY-MM">` for machine-readability
- Fixed `<nav class="rail">` with anchor links to each section
- Skip link to `#intro` for keyboard users
- Responsive images via `<picture>` + `srcset`/`sizes`; `fetchpriority="high"` on the intro photo
- Full Open Graph + Twitter Card meta block
- External links use `target="_blank" rel="noopener noreferrer"`

### JavaScript (`script.js`)

- A single hand-written IIFE, loaded with `defer`. No framework, no build, no dependencies.
- Enhances every `<ul class="media" data-media>` block:
  - **One item** → click/Enter opens it fullscreen.
  - **Multiple items** → a fanned, iMessage-style stack with no visible chrome: the top card tracks your drag and settles on release (or arrow keys when focused); a plain tap/click opens fullscreen.
- **Lightbox**: one shared native `<dialog>` (`showModal()` for focus trapping + Escape), with prev/next, counter, swipe, arrow keys, and backdrop-click to close. Supports `<img>` and `<video>`.
- **Progressive enhancement is mandatory.** Media is authored as a plain `<ul>`/`<li>` list of `<img>`/`<video>`; with JS off it renders as a native scroll-snap strip. Keep it that way.

### CSS (`style.css`)

- **Mobile-first** responsive design
- **CSS custom properties** in `:root`, with full **dark mode** parity via `@media (prefers-color-scheme: dark)`
- **Scroll-snap**: `html { scroll-snap-type: y mandatory }` + `.chapter { scroll-snap-align: start; min-height: 100svh }`
- **Entrance reveals**: CSS scroll-driven animations (`animation-timeline: view()`) inside `@supports` — graceful degradation
- **Scroll progress bar**: `animation-timeline: scroll(root)` on a fixed 2px top bar
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables snap, smooth scroll, and all animations
- **Print stylesheet**: flattens scroll-snap and prints as a clean resume
- Component sections separated by comments: `/* ---------- chapter: meta column ---------- */`
- Naming: `.chapter`, `.chapter_meta`, `.rail`, `.rail_dot`, etc. — component name then underscore-separated element. State modifiers prefixed with `-` (`.-dark`, `.-light`)
- System font stack (sans + mono) — no external font loading
- Layout breakpoint: `760px` (single column → two-column chapter grid)

### Key CSS variables

| Variable | Light | Dark |
|---|---|---|
| `--text-default` | `#2a2a2a` | `#f2efe9` |
| `--text-soft` | `#565656` | `#d3cfc6` |
| `--text-light` | `#817e7e` | `#8f8a82` |
| `--base` | `#fafaf7` | `#1c1b19` |
| `--surface` | `#ffffff` | `#262522` |
| `--highlight` | `#fff3d6` | `#4a3a16` |
| `--highlight-deep` | `#f3e5b8` | `#6b5520` |
| `--link` | `#0066cc` | `#7cc4ff` |

### Images

Profile photos are provided at multiple resolutions for responsive loading. When adding or replacing images, provide variants at 400w and 600w minimum, and use `srcset`/`sizes`.

## Guidelines for Changes

- **Keep it simple.** This site is intentionally minimal. No frameworks, no build tools, no CSS preprocessors, no npm. The only JavaScript is the single hand-written `script.js`; if you extend it, keep it vanilla and dependency-free.
- **Preserve the file architecture.** All markup in `index.html`, all styles in `style.css`, all behavior in `script.js`.
- **Everything must work without JS.** Any new interactive feature has to degrade gracefully when scripting is unavailable.
- **Maintain dark mode support.** Any new color values should have both light and dark variants via CSS custom properties.
- **Maintain accessibility.** Use semantic HTML, proper `alt` text, `aria-hidden` on decorative elements, visible focus rings, and the skip link.
- **Respect `prefers-reduced-motion`.** New animations should be inside `@supports` and disabled in the reduced-motion block.
- **Optimize images.** Provide multiple resolutions; use `srcset`/`sizes`; `loading="lazy"` for below-fold imagery.
- **Test both color schemes.** Verify changes look correct in light and dark mode.
- **Test responsive layout.** Check mobile (< 600px), tablet (~ 760px), and desktop.
- **Test the print stylesheet.** This site IS the resume — `Cmd-P` should produce a clean printable page.
- **Test with reduced motion.** Toggle the OS setting and confirm snap + reveals disable.
