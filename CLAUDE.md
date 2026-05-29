# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
# Local dev server with live reload
hugo server

# Production build (matches CI)
hugo --minify --baseURL "https://rajnoor.in/"
```

Hugo version: **0.128.0 Extended** (pinned in `.github/workflows/hugo.yml`; local dev may run newer). Extended adds SCSS support via Dart Sass.
No Node/npm. All CSS and JS are hand-written — no webpack, Vite, or Tailwind.

Deployment: GitHub Actions pushes to GitHub Pages on every merge to `main` (`.github/workflows/hugo.yml`).

## Architecture

### Layouts
- **Base:** `layouts/_default/baseof.html` — loads CDN assets (Bootstrap 5.3, KaTeX, Prism, Bootstrap Icons, Material Symbols, Google Fonts), sets up theme before first paint, renders the animated SVG signature pill, defines the `main` placeholder.
- **Default body:** `layouts/_default/default.html` and `layouts/_default/list.html` are both minimal `{{ define "main" }}{{ .Content }}{{ end }}` shims.
- **Section overrides:**
  - `layouts/projects/list.html` — the `/projects/` gallery page (iterates `data/projects.yaml`)
  - `layouts/projects/default.html` — single-project page (TOC, abstract, code-block layout, project-nav-quad)
  - `layouts/notebook/list.html` — notebook index
  - `layouts/notebook/single.html` — single notebook entry
- **Search index template:** `layouts/index.json` — builds `/index.json` for the command palette; joins each project page to `data/projects.yaml` for tags/show.

### Content Convention
All content files are **HTML** (not Markdown — except `.md` for code-heavy projects with code-block parsing) with YAML front matter. Recommended keys:

```yaml
---
title: "Page Title"           # required everywhere — drives <title>, search index, nav labels
description: "…"              # recommended — drives <meta description> + search index
active_nav: "projects"        # section name, no leading '#' — values: home | projects | notebook | about | now | credentials | ""
pageScript: "/js/foo.js"      # OPTIONAL — base template wraps in {{ with }}, so omitted = no <script> tag
pageStyle:  "/css/foo.css"    # OPTIONAL — same as above
url: "/custom-slug"           # OPTIONAL — only when overriding Hugo's default URL
layout: default               # OPTIONAL — only when forcing a non-default; sections with their own list.html/single.html don't need it
---
```

Project pages no longer carry card metadata in frontmatter — that lives in `data/projects.yaml`.

### Static Assets
Page-specific files live in parallel pairs under `static/`:
- `static/css/<page>Style.css` + `static/js/<page>Script.js`
- `static/css/style.css` + `static/js/script.js` — loaded on every page

### `data/` directory
YAML data drives several surfaces — prefer adding to a data file over hand-writing markup that repeats a pattern.

| File | Drives | Consumers |
|---|---|---|
| `data/credentials.yaml` | Credentials page sections + entries (each section has a `type` of `publication` or `certificate`) | `shortcodes/credentialsList.html` + `partials/credCertificate.html` + `partials/credPublish.html` |
| `data/now.yaml` | `/now/` page list + home-page snippet | `shortcodes/nowList.html` |
| `data/projects.yaml` | Project gallery cards (`cardImage`/`cardTitle`/`cardText`/`weight`/`group`/`show`/`tags`), keyed by slug, with `path` for `site.GetPage` resolution | `layouts/projects/list.html`, `layouts/projects/default.html` (prev/next nav), `layouts/index.json` (search-index tags) |
| `data/projectGroups.yaml` | Project gallery section headers (`name`, `description`, `weight`) | `layouts/projects/list.html` |

### Shortcodes
Under `layouts/shortcodes/`:

| Shortcode | Purpose |
|---|---|
| `credentialsList.html` | Iterates `data/credentials.yaml`, dispatches each entry to `partials/credCertificate.html` or `partials/credPublish.html` |
| `nowList.html` | Renders `data/now.yaml`. Positional arg: `"full"` (full `/now/` page) or `"snippet"` (home page slice, gated by `features.nowPage`) |
| `fig.html` | Inline figure: `{{< fig src="…" alt="…" caption="…" size="col-11" >}}` |

### Partials
Under `layouts/partials/`:

| Partial | Purpose |
|---|---|
| `project-card.html` | Renders one gallery card. Takes a dict `{href, cardImage, cardTitle, cardText, tags, group, show}`. Called from `layouts/projects/list.html` |
| `credCertificate.html` | Certificate card. Takes one entry from `data/credentials.yaml` as context |
| `credPublish.html` | Publication card. Same |

### JS module map
- **Global** (loaded by `baseof.html` on every page):
  - `static/js/script.js` — theme cycle (`setTheme(mode)`), signature corner-drag/keyboard/mini-map, command-box open/close, SPA `navigateTo` + `__pageCleanup` invocation. Exposes `clearAllTimeouts(arr)` helper.
  - `static/js/command-box.js` — `Shift+Space` command palette (search index from `/index.json`)
  - `static/js/shortcutHints.js` — `?` overlay
  - `static/js/scrollArc.js` — corner scroll-progress arc (gated by `features.scrollArc`)
- **Per-page** (loaded only when frontmatter sets `pageScript`):
  - `static/js/homeScript.js` — typed hero, GTD undraw, about lines
  - `static/js/projectScript.js` — text/image-size sliders (`initRangeSlider` factory), TOC heading-mode cycle, filter chips
  - `static/js/404.js` — error page bits

#### SPA cleanup contract
Modules that attach listeners or start timers must register a callback via the chain pattern:

```js
window.__pageCleanup = (function (prev) {
  return function () {
    /* this module's cleanup — remove listeners, clear timers, disconnect observers */
    if (typeof prev === 'function') {
      try { prev(); } catch (e) { console.error('pageCleanup chain error:', e); }
    }
    window.__pageCleanup = null;
  };
})(window.__pageCleanup);
```

The chain is invoked from `script.js`'s `navigateTo` before each content swap. Each `prev()` call is wrapped in `try/catch` so one bad cleanup can't orphan the rest. Registered in `script.js` (timer arrays), `projectScript.js` (TOC + text-size toggle), `command-box.js`, `shortcutHints.js`, `scrollArc.js`, `homeScript.js` (timers).

### Theming
Three-mode cycle: **Light → Dark → Auto** (system `prefers-color-scheme`). Persisted in `localStorage` as `theme`. A blocking inline script at the top of `baseof.html` applies the saved theme before first paint to avoid flash. `data-bs-theme` on `<html>` drives all theme-dependent CSS — no JS-set inline colours anywhere.

**Theme-aware images:** pair `<img>` elements with `.theme-img--light` / `.theme-img--dark` — CSS hides the non-matching variant. **Both variants are always downloaded**; this is acceptable for icons ≤50 KB. For larger images, prefer a JS swap on theme change instead of the CSS-hide pattern.

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
| `--my-theme-day` | `#FCA61C` | *(light only)* | Warm amber glow — theme-toggle hover, day accent |
| `--my-theme-night` | *(light only)* | `#7EB2FF` | Cool blue glow — theme-toggle hover in dark mode |
| `--my-theme-accent` | `#0047AB` | `#6B9EFF` | Focus rings, subtle icon glows |

**Motion tokens** (defined in `:root` in `style.css`):

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | `120ms` | Colour, text, small state flips |
| `--motion-base` | `200ms` | Transform, opacity, hover |
| `--motion-slow` | `350ms` | Panel choreography, corner-shift |
| `--motion-loader` | `1.2s` | Spinner + shimmer — tune both as one knob |

**Z-index scale** (defined in `:root` in `style.css`):

| Token | Value | Use |
|---|---|---|
| `--z-rail` | `1` | Active/hover indicator rails inside panels |
| `--z-pill` | `8` | Signature island (`#signature-panel`) |
| `--z-fixed` | `10` | Always-visible fixed islands (`#command-console`, `#page-console`) |
| `--z-overlay` | `1400` | Command-palette backdrop |
| `--z-hints` | `1500` | Shortcut-hints overlay (`?` panel) |
| `--z-toast` | `1501` | Notification toast pill (`#rj-toast`) |
| `--z-critical` | `9000` | Reserved — above all chrome (unused currently) |

Between `--z-pill` (8) and `--z-fixed` (10), drag-targets and the scroll-arc sit at `calc(var(--z-pill) + 1)`.

**Shadow scale** (defined in `:root` in `style.css`):

Elevation (`box-shadow`) — always references `--my-shadow-color`:

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 0 8px 0 var(--my-shadow-color)` | Interactive button hover (nav-quad, small pills) |
| `--shadow-md` | `0 0 10px 0 var(--my-shadow-color)` | Card hover, project-card hover |
| `--shadow-lg` | `0 12px 48px var(--my-shadow-color)` | Overlay panels (command palette, shortcut hints) |

Glow (`text-shadow` for icon buttons) — always references `--my-theme-accent`:

| Token | Value | Use |
|---|---|---|
| `--glow-sm` | `var(--my-theme-accent) 0 0 1px` | Utility toggles (`#text-size-toggle`, `#page-console-toggle`, chevrons) |
| `--glow-md` | `var(--my-theme-accent) 0 0 4px` | Standard interactive icons (`.head-item`, nav links) |
| `--glow-lg` | `var(--my-theme-accent) 0 0 8px` | Prominent glow — dark-mode `#shortcut-hints-toggle` |

Exceptions that intentionally do not use these tokens: structural panel shadows (`var(--my-border-color) 0 3px 6px`), the `discoverPulse` keyframe accent glow, `.size-reset-dot` accent box-glow, and the theme-toggle day/night glow (uses `--my-theme-day` / `--my-theme-night`).

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
All animations are CSS-driven. **Prefer `transform` + `opacity` over layout-triggering properties** (`width`, `height`, `top/left`, etc.) where possible. `prefers-reduced-motion: reduce` should short-circuit every `transition-duration` / `animation-duration` to `0.01ms`. No bounce or spring by default — easing is `ease`, `ease-in`, `ease-out`, or `linear`. The signature corner-shift uses `cubic-bezier(0.32, 0.72, 0, 1)` (Apple-style strong-ease) at `--motion-slow` (350ms). **Always use the motion tokens** — never hard-code `ms` or `s` durations for transitions.

### Persistence keys
| Key | Storage | Values | Purpose |
|---|---|---|---|
| `theme` | local | `light` \| `dark` \| `auto` | Theme mode |
| `navVert` | local | `top` \| `bottom` | Signature vertical anchor |
| `navHorz` | local | `left` \| `right` | Signature horizontal anchor |
| `rj_doc_font_size` | local | `0.8`–`1.6` (rem) | Project page font-size slider |
| `rj_doc_img_size` | local | `40`–`100` (%) | Project page image-size slider |
| `rj_toc_mode` | local | `none` \| `l1` \| `l2` | Project page TOC heading mode (none / h2-only / h2+h3) |
| `rj_page_console_contracted` | local | `0` \| `1` | Page-console contract state |
| `rj_chapter_strip_collapsed` | local | `0` \| `1` | Chapter-strip collapse state on multi-page projects |
| `rj_hero_seen_at` | local | integer ms timestamp | Skip the home hero typing if last shown < 12h ago; otherwise re-run the animation |
| `rj_signature_seen_at` | local | integer ms timestamp | Skip the signature pill discover-pulse if last shown < 12h ago; otherwise re-run |

Conventions: `rj_*` prefix for site-specific keys; primitives only (no JSON-encoded objects); short string values.

### Responsive breakpoints
Site uses **only Bootstrap breakpoints** — never custom `px` values in `@media` queries.

| Token | Value | Bootstrap name |
|---|---|---|
| sm | `576px` | Small |
| md | `768px` | Medium |
| lg | `992px` | Large |
| xl | `1200px` | X-Large |
| xxl | `1400px` | XX-Large |

### Naming conventions
- CSS tokens: `--my-kebab-case` for site-specific design tokens; `--bs-*` for Bootstrap overrides; `--rj-*` for per-page user-tunable vars (font-size, image-size, etc.)
- State classes: kebab-case verbs/adjectives (`hide`, `show`, `contract`, `active`, `dragging`)
- SVG path IDs in the signature: PascalCase mirroring letter (`NameR1`, `NameJdot`, `NameA`)
- JS: camelCase functions (`shiftSignature`, `openNavPanel`, `setTheme`); `rj_*` prefix for localStorage / sessionStorage keys

#### CSS selector conventions
- **BEM for sub-elements of named components**: `.chapter-strip__item`, `.toc-list__item`, `.toc-list__item--active`, `.project-nav-quad__btn--outer-prev`
- **Flat kebab-case for standalone utilities and page-level components**: `.filter-toggle`, `.project-card`, `.home-card`, `.page-summoned`
- **Bootstrap conventions kept when directly overriding Bootstrap**: `.btn.page-nav`, `.breadcrumb-item`
- **`!important` policy**: avoid it for site-authored rules. Use compound ID selectors (specificity 1,1,0) to override base element rules instead. Reserve `!important` only for Bootstrap overrides where the Bootstrap rule itself uses `!important` and a compound selector is impractical.

### Hover states
- Interactive text (`.hover-grow`): `transform: scale(1.05)` + `letter-spacing: 0.05em`
- Theme toggle icon: `text-shadow: var(--my-theme-day/night) 0 0 4-8px` (day/night colour, not accent)
- Icon buttons (`.head-item`): `text-shadow: var(--glow-md)` — utility toggles use `var(--glow-sm)` instead
- Cards: `box-shadow: var(--shadow-md)` + `transform: translateY(-2px)`
- No background fills on hover. No colour changes on hover.

### Signature navigation island
The fixed-position signature pill (`#signature-box`) is the only global chrome. It:
- Lives in one of four corners (`.top.left`, `.top.right`, `.bottom.left`, `.bottom.right`); the user can drag it to a corner, swipe/throw, press an arrow key while focused, or tap a dot in the 2×2 mini-map inside the action panel
- Has stable anchor classes — corner-shifts use `transform: translate3d()` for layout-free 60fps
- Expands on hover/focus into `#commandBox` containing `#navPanel` (page links) and `#actionPanel` (theme toggle + corner mini-map)
