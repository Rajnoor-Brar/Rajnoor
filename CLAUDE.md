# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
# Local dev server with live reload
hugo server

# Production build (matches CI)
hugo --minify --baseURL "https://rajnoor.in/"
```

Hugo version: **0.128.0 Extended** (required — Extended adds SCSS support via Dart Sass).  
No Node/npm. All CSS and JS are hand-written — no webpack, Vite, or Tailwind.

Deployment: GitHub Actions pushes to GitHub Pages on every merge to `main` (`.github/workflows/hugo.yml`).

## Architecture

### Single Layout
Every page uses one template: `layouts/_default/default.html`. It loads CDN assets (Bootstrap 5.3, KaTeX, Prism, Bootstrap Icons, Material Symbols, Google Fonts) and the animated SVG signature header.

### Content Convention
All content files are **HTML** (not Markdown) with YAML front matter. Required front matter keys:

```yaml
---
layout: default
title: "Page Title"
active_nav: "#home-nav"   # controls header nav highlight
pageScript: "/js/homeScript.js"
pageStyle: "/css/homeStyle.css"
url: "/"
description: "Page description for meta tag"
---
```

### Static Assets
Page-specific files live in parallel pairs under `static/`:
- `static/css/<page>Style.css` + `static/js/<page>Script.js`
- `static/css/style.css` + `static/js/script.js` — loaded on every page

### Shortcodes
Custom shortcodes in `layouts/shortcodes/`:
- `projectCards.html` — project gallery cards
- `projectNav.html` — breadcrumb nav for project detail pages
- `credCertificate.html`, `credPublish.html` — credentials display
- `dump.html` — debug helper

### Theming
Three-mode cycle: **Light → Dark → Auto** (system `prefers-color-scheme`). Persisted in `localStorage` as `theme`. A blocking inline script at the top of `default.html` applies the saved theme before first paint to avoid flash. `data-bs-theme` on `<html>` drives all theme-dependent CSS — no JS-set inline colours anywhere.

### Math
KaTeX auto-render is included when `params.math = true` in `hugo.toml` (currently always on).

## Design System Rules

### CSS Tokens — never use raw hex
All colours are CSS custom properties. **Always reference `var(--my-*)`, never hard-code hex.** Tokens are defined in `static/css/style.css` at `:root` (light) and `html[data-bs-theme="dark"]` (dark).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--my-background` | `#f9f9f9` | `#181818` | Page background |
| `--bs-body-color` | `#222` | `#fbfbfb` | Primary text |
| `--my-white` | `#fff` | `#111` | Cards, form inputs (theme-aware "surface") |
| `--my-black` | `#111` | `#fff` | Maximum-contrast text / strokes (theme-aware "ink") |
| `--my-silver-1` | `#ddd` | `#2d2d2d` | Hairline secondary surfaces |
| `--my-silver-2` | `#f5f5f5` | `#222` | Subtle alt surface |
| `--my-gray-1` | `#777` | `#ccc` | Muted body / captions |
| `--my-gray-2` | `#555` | `#bbb` | Mid-emphasis text |
| `--my-gray-3` | `#333` | `#aaa` | Heading-adjacent text |
| `--my-border-color` | `rgba(34,34,34,0.13)` | `rgba(251,251,251,0.13)` | Hairlines — structural only |
| `--my-shadow-color` | `rgba(17,17,17,0.20)` | `rgba(253,253,253,0.20)` | Elevation |
| `--my-theme-glow` | `#fcb11c` | `#e7dcc8` | Hover accent — use for glow/focus only |

Page-specific extension tokens (`projectStyle.css`) for code blocks: `--page-color`, `--page-border`, `--code-color`, `--punctuation`, `--string`, `--keyword`, `--function`, `--number`, `--operation`, `--comment`, `--subtitle-color`, `--abstract-bg`. All have dark-mode overrides.

The signature stroke colour is always `--my-black` — never inverted, never tinted (in dark mode `--my-black` resolves to white, which is the intended behaviour).

### Typography roles
| Font | Use |
|---|---|
| **Montserrat** | UI, body, form inputs, buttons (loaded via Google Fonts) |
| **Spectral** | Display, heroes, card titles, section headers, nav links |
| **Edu AU VIC WA NT Pre** | Stylistic accent (hand-lettered hero SVG) |
| **Edu SA Beginner** | Subtitle accent on project pages |
| **Slabo 27px** | Long-form article body on project pages |

Fluid type via `clamp()`. Example: page headings use `clamp(2rem, 4vw, 3rem)`; about hero uses `max(clamp(2rem, 7vw, 5.5rem), clamp(2rem, 8vh, 5.5rem))`.

### Animations
All animations are CSS-driven. **Prefer `transform` + `opacity` over layout-triggering properties** (`width`, `height`, `top/left`, etc.) where possible — the current code has some layout-tweening that should migrate to `transform: scale()` / `transform: translate3d()` over time. `prefers-reduced-motion: reduce` should short-circuit every `transition-duration` / `animation-duration` to `0.01ms`. No bounce or spring by default — easing is `ease`, `ease-in`, `ease-out`, or `linear`; the one exception is the signature corner-shift, which may use a snappy `cubic-bezier(0.22, 1, 0.36, 1)`.

### localStorage keys
| Key | Values | Purpose |
|---|---|---|
| `theme` | `light` \| `dark` \| `auto` | Theme mode |
| `navVert` | `top` \| `bottom` | Signature vertical position |
| `navHorz` | `left` \| `right` | Signature horizontal position |

`sessionStorage` keys: `rj_hero_seen` — set after the home hero animation completes, used to skip it on subsequent visits within the session.

### Naming conventions
- CSS tokens: `--my-kebab-case` for site-specific design tokens; `--bs-*` for Bootstrap overrides
- State classes: kebab-case verbs/adjectives (`hide`, `show`, `contract`, `active`, `dragging`)
- SVG path IDs in the signature: PascalCase mirroring letter (`NameR1`, `NameJdot`, `NameA`)
- JS: camelCase functions (`shiftSignature`, `openNavPanel`)

### Hover states
- Interactive text (`.hover-grow`): `transform: scale(1.05)` + `letter-spacing: 0.05em`
- Theme toggle icon: `text-shadow: var(--my-theme-glow) 0 0 4px`
- Cards: shadow lift via `box-shadow: 0 0 10px 0 var(--my-shadow-color)` + `transform: translateY(-2px)`
- No background fills on hover. No colour changes on hover.

### Signature navigation island
The fixed-position signature pill (`#signature-box`) is the only global chrome. It:
- Lives in one of four corners (`.top.left`, `.top.right`, `.bottom.left`, `.bottom.right`); the user can drag it to a corner, swipe/throw, press an arrow key while focused, or tap a dot in the 2×2 mini-map inside the action panel
- Has stable anchor classes — corner-shifts use `transform: translate3d()` for layout-free 60fps
- Expands on hover/focus into `#commandBox` containing `#navPanel` (page links) and `#actionPanel` (theme toggle + corner mini-map)
