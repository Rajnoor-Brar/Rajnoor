# Refinements Plan v2 — Phased

Reflects feedback. Explicitly out of scope per your direction: image optimization, Color Namer / `colorScript.js` (left as inactive wreckage), empty placeholder JS files (kept for standardization), contact column layout (was preview-window artifact).

---

## Phase 1 — Isolated Tier-1 Bugs

Low-risk surgical fixes; can land independently.

| Item | Change | File |
|---|---|---|
| 1.3 | `class="sub-secsection"` → `class="sub-section"` | `content/projects/Ellipsoidal_Channel.html:259` |
| 1.4 | Define `--text-muted` in `:root` and `[data-bs-theme="dark"]` | `static/css/projectStyle.css` |
| 1.6 | `calc(0.25var(--navExpandedHeight))` → `calc(0.25 * var(--navExpandedHeight))` | `static/css/projectStyle.css:283,289` |
| ✅ | Project card title visible in dark mode (done in this session) | `static/css/projectStyle.css:55–58` |

**Verify**: `hugo --gc --minify` — no warnings; visual check `/projects/ellipsoidal-channel/` in dark mode, the affected `sub-section` block now styled.

---

## Phase 2 — Link & Markup Hardening

External-link safety + accessibility on existing markup. All template-level.

| Item | Change | File |
|---|---|---|
| ext links | Add `rel="noopener noreferrer"` to every `target="_blank"` link | `content/contact.html:16,20,28`; `layouts/shortcodes/credCertificate.html:36`; `content/projects/Ellipsoidal_Channel.html:567` |
| img alt | Add `alt="{{ .Params.cardTitle }}"` to `<img>` in projectCards shortcode | `layouts/shortcodes/projectCards.html:4` |
| 2.3 | Convert `#themeToggle` (and `#cornerPicker` wrapper if relevant) from `<div role="button">` → `<button type="button">`; remove redundant `tabindex` | `layouts/_default/default.html`; possibly minor CSS reset for native button |
| breadcrumb | `projectNav.html` builds URLs by lowercasing label text — switch to explicit `(url, label)` pairs in the shortcode params | `layouts/shortcodes/projectNav.html` |

**Verify**: Tab-only navigation reaches and activates the theme toggle; right-click any social-link on contact and confirm "no referrer" semantics; check Lighthouse a11y delta.

---

## Phase 3 — Design System Compliance

Token discipline + missing affordances.

| Item | Change | File |
|---|---|---|
| 3.1 | `rgba(0, 0, 0, 0.2)` → `var(--my-shadow-color)` | `static/css/projectStyle.css:27` |
| 3.3 | Add `transform: translateY(-2px)` to `.card:hover` and `transition: transform 0.2s ease` on `.card` | currently duplicated; merge per 3.7 |
| 3.5 | Pick source of truth: keep `Edu SA Beginner` (add to CLAUDE.md font system) OR swap to `Edu AU VIC WA NT Pre` in `projectStyle.css:100` — **recommend keeping current** since it's the only project-subtitle font and the Google Fonts link already loads it; just update CLAUDE.md | `CLAUDE.md` |
| 3.7 | Move `.card` + `.card:hover` rules from `credStyle.css` and `projectStyle.css` into `static/css/style.css`; delete duplicates | three files |

**Verify**: Visual diff on Projects, Credentials, and a project detail page — cards lift on hover with shadow + 2px translate.

---

## Phase 4 — Theme System Hardening

Tight cluster of related bugs in `script.js`. Do these together — they share the same handler chain.

| Item | Change |
|---|---|
| 1.11 | Stop writing `themeIcon.style.transform` in `applyTheme()`. Replace with toggling a `.spinning` class; clear it on `animationend`. Inline `transform` currently shadows any CSS hover rule. |
| **New #1** | `setDarkTheme()` and `setLightTheme()` must set `themeIcon.innerText`. On init, the icon shows whatever HTML default is, so a "dark"-saved user sees the wrong glyph. |
| **New #5** | Rapid-click rotate restart: in the click handler, do `themeIcon.classList.remove("rotate"); void themeIcon.offsetWidth; themeIcon.classList.add("rotate");` so the CSS animation actually restarts on each click. |
| **New #6** | Skip the `opacity` fade in `applyTheme()` when it's the *first* call (init), not user-triggered. Add a `firstApply` flag; only run the fade when a user toggle caused the change. |
| 3.4 | After 1.11 lands, `#themeToggle:hover { transform: rotate(-12deg); }` in CSS is no longer overridden — add it. |

**Verify**:
1. Clear `localStorage`, reload Home — icon matches the actual rendered theme.
2. Click theme toggle rapidly 5× — icon spins each time, no glitch.
3. Hover theme toggle — visible -12° tilt + glow.
4. In auto mode with macOS scheduled theme switching, page load shouldn't flash the icon.

---

## Phase 5 — SPA Navigation Polish

The interceptor in `script.js:476+` is solid for the common path; fix edge cases.

| Item | Change |
|---|---|
| **New #3** | After content swap, if `url.hash` is present, `document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' })` instead of `window.scrollTo(0,0)`. |
| **New #7** | Bail out earlier in the link-click handler: if `url.pathname === location.pathname && url.hash === location.hash`, don't `preventDefault` — let the browser no-op. |
| **New #2** | (Low priority — bundle in.) Before `pushState`, save `scrollY` into the current history entry: `history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.pathname)`. On `popstate`, if `event.state?.scrollY` exists, restore it after swap. |

**Verify**: Click `/projects/ellipsoidal-channel#abstract` from somewhere → page loads and scrolls to abstract. Scroll halfway down `/credentials`, navigate to `/projects`, hit back — Credentials restores scroll position.

---

## Phase 6 — Nav-Island Animation Rework

Riskier; isolate from other work. The current height/width keyframes work but burn paint budget.

| Item | Change |
|---|---|
| 2.6 | Re-author `navExpand` / `navCollapse` / `actionExpand` / `actionCollapse` as `transform: scale(...)` from a fixed final size with `transform-origin` set per active corner. Set the origin in `attachCornerPickerHandlers` / on shift. Drop the dual layout-tweening keyframes. |
| 2.10 | Scope the universal transition: replace `* { transition: bg-color, color }` with a single class `html.theme-transitioning *` that's added for ~250 ms on theme toggle, then removed. Eliminates the perceived "lag" on inputs / hover state changes. |
| 2.11 | Bump `.action-item` height multiplier from `0.4` → `0.55` (≈ 44 px). Audit `corner-dot` similarly — they currently inherit from `--signture-height * 0.4`. |

**Verify**: DevTools → Performance → record a panel open. Expect zero layout events, only composite. Tap-targets pass 44px in DevTools' device toolbar.

---

## Phase 7 — Build & Deploy Hygiene

| Item | Change |
|---|---|
| 4.1 | Add `integrity="sha384-..."` + `crossorigin="anonymous"` to Bootstrap CSS, Bootstrap Icons CSS, Bootstrap JS bundle (3 lines in `default.html`). Fetch hashes from jsdelivr or generate locally. Google Fonts excluded (no SRI). |
| 4.2 | Move inline styles: `content/contact.html:34` → `contactStyle.css`; `content/projects.html:11` → `projectStyle.css`; `content/projects/Ellipsoidal_Channel.html:567` (the GitHub-icon button) → `projectStyle.css` as a `.my-btn-icon` rule. |
| 4.5 | `script.js:229, 265, 266` (and any others) `==` → `===`. |
| 4.7 | Add `.DS_Store`, `**/.DS_Store`, `.hugo_build.lock` to `.gitignore`. Run `git rm --cached .DS_Store static/.DS_Store layouts/.DS_Store` after confirming. |
| CDN gate | Add `math: true`, `code: true` front-matter checks in `default.html` head for KaTeX and Prism scripts. Home + Contact don't need either; cuts ~150 KB on those pages. |
| CI smoke | Add a single-step in `hugo.yml` after build: `test -f public/projects/index.html && test -f public/credentials/index.html && test -f public/contact/index.html` — fails the workflow if any is missing. Catches the kind of regression Chat_Review.md flagged. |

**Verify**: Network panel on Home and Contact — no KaTeX/Prism requests. `git status` clean after deletes. CI run on a branch passes.

---

## Phase 8 — Cleanup & Doc Sync

Pure deletes and CLAUDE.md updates; do last so prior phases can reference any removed concepts.

| Item | Change |
|---|---|
| `dump.html` | Delete `layouts/shortcodes/dump.html`. |
| 4.4 | Remove `rj_page` row from CLAUDE.md localStorage table — it's never implemented. |
| CLAUDE.md sync | Per Phase 3.5 decision: add `Edu SA Beginner` to the typography roles section as "Subtitle accent on project pages" (already in CLAUDE.md actually — just confirm). |
| Image carry-over | Document in code comment near any reference that `YaEWYntB.jpg` is intentionally retained but unused — or accept it as untracked clutter (no action). |

**Verify**: `grep -r "rj_page" .` returns nothing in CLAUDE.md; `hugo --gc` doesn't complain about the missing shortcode (nothing should reference `dump`).

---

## Recommended Land Order

Phase 1 → 2 → 3 → 4 → 7 → 5 → 8 → 6.

(Phase 6 last because it's the highest-risk visual change and benefits from the other fixes being stable; Phase 4 before 7 because the theme cluster is self-contained and high-value.)

---

If this shape is right, say "go" and I'll start Phase 1. If you want a phase reordered, items moved, or anything elaborated, point at it.