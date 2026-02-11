# CLAUDE.md

## Project Overview

Personal portfolio website for Zachary Halvorson — a product designer and prototyper based in Vancouver. Deployed at [www.zacharyhalvorson.com](https://www.zacharyhalvorson.com).

This is an intentionally minimal static site built with **plain HTML and CSS only**. No JavaScript frameworks, no build tools, no package manager. It was deliberately simplified from a previous Gatsby-based implementation.

## Tech Stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid layout, media queries
- **No JavaScript** (except redirect pages)
- **No build step** — files are served as-is
- **No package.json** — zero npm dependencies

## Repository Structure

```
/
├── index.html              # Main landing page (single entry point)
├── style.css               # All styles (single stylesheet)
├── CNAME                   # GitHub Pages custom domain (www.zacharyhalvorson.com)
├── favicon.ico             # Favicon
├── favicon-152.png         # Apple touch icon (152px)
├── apple-touch-icon.png    # Apple touch icon
├── embed-image.png         # Open Graph / social preview image
├── portfolio/
│   └── index.html          # JS redirect to iCloud Keynote portfolio
├── resume/
│   └── index.html          # JS redirect to Dropbox Paper resume
└── images/
    ├── me/                 # Profile photos (multiple resolutions)
    │   ├── me.jpg          # Full resolution
    │   ├── me-1200w.jpg    # 1200px wide
    │   ├── me-600w.jpg     # 600px wide
    │   └── me-400w.jpg     # 400px wide
    └── socials/            # Social media icons (SVG/PNG)
```

The `.cache/` directory is a leftover from the old Gatsby setup and is git-ignored.

## Development

### Local Server

There is no build step. To preview locally, use any static file server:

```sh
python3 -m http.server 8000
# or
npx serve .
```

### Deployment

The site is deployed via **GitHub Pages** from the `master` branch. Push to `master` and the site updates automatically. The `CNAME` file configures the custom domain.

## Architecture & Conventions

### HTML (`index.html`)

- Semantic HTML5 (`<header>`, `<section>`, proper `<meta>` tags)
- Responsive images using `srcset` and `sizes` attributes
- Performance: `fetchpriority="high"` on above-fold image, `loading="lazy"` on below-fold images
- Accessibility: descriptive `alt` text on meaningful images, `aria-hidden="true"` on decorative icons
- External links use `target="_blank" rel="noopener noreferrer"`

### CSS (`style.css`)

- **Mobile-first** responsive design
- **CSS custom properties** for theming (defined in `:root`)
- **Dark mode** via `@media (prefers-color-scheme: dark)`
- Component sections separated by comments: `/* ---------- component: name ----------- */`
- Naming: component-based (`.bio`, `.profilePhoto`, `.socialsLink`), with BEM-inspired elements (`.socialsLink_githubLogo`) and state modifiers (`.-dark`, `.-white`)
- System font stack — no external font loading
- Layout breakpoints: `600px` (two-column grid), `800px` (wider gap), `860px` (larger heading)
- Two-column desktop layout: CSS Grid with `2fr 5fr` columns

### Key CSS Variables

| Variable | Light | Dark |
|---|---|---|
| `--text-default` | `#565656` | `white` |
| `--text-light` | `#817E7E` | `#C4C4C4` |
| `--base` | `white` | `#262626` |
| `--highlight` | `#FFF7E5` | `#E5D9BD` |
| `--link-color` | `#0099FF` | `#0099FF` |

### Images

Profile photos are provided at multiple resolutions for responsive loading. When adding or replacing images, provide variants at 400w and 600w minimum, and use `srcset`/`sizes` in the HTML.

## Guidelines for Changes

- **Keep it simple.** This site is intentionally minimal. Do not add JavaScript frameworks, build tools, or CSS preprocessors.
- **Preserve the two-file architecture.** All markup in `index.html`, all styles in `style.css`.
- **Maintain dark mode support.** Any new color values should have both light and dark variants via CSS custom properties.
- **Maintain accessibility.** Use semantic HTML, proper alt text, and `aria-hidden` for decorative elements.
- **Optimize images.** Provide multiple resolutions and use `srcset`/`sizes`. Use `loading="lazy"` for below-fold images.
- **Test both color schemes.** Verify changes look correct in both light and dark mode.
- **Test responsive layout.** Check mobile (< 600px) and desktop (>= 600px) layouts.
