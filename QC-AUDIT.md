# QC Audit — Performance, Motion & Graceful Degradation

**Date:** 2026-06-19
**Scope:** Animation smoothness, transition/transform integrity, structural stability during "vulnerable" moments (transitions, font swap, theme change), and grace under slow/failed network — judged against the two house doctrines:

> - **"All or Nothing"** — an element appears only when it is *fully* ready.
> - **"Better invisible than broken"** — if styling/script isn't available, hide (with a self-contained, CSS-free placeholder) rather than show a broken element.

**Method:** Static read of every CSS/JS bundle part + layouts, plus live profiling on a running `hugo server` (home, projects gallery, `ellipsoidal-channel` project page at 1280×800 and 375×812) — Performance API, resource-timing, computed-style probes, a slow-fetch simulation, and screenshots.

**Headline:** The site is in excellent shape. The audit found one measurable performance defect and three resilience/correctness gaps — **all four now fixed and verified**. Everything else verified as passing.

> ⚠️ **Verification limitation:** the automated preview tab runs `visibilityState: "hidden"`, so `requestAnimationFrame` and CSS transitions/animations **do not tick** there. Motion (the theme crossfade, SPA swipe/fade) cannot be watched frame-by-frame in-harness — those are validated by *deterministic* measurements (forced style-recalc cost), static end-state screenshots, and code review. The "stuck `page-leaving` class" seen while probing is a hidden-tab artifact (the rAF-gated enter phase never fires when hidden), **not** a real bug.

---

## ✅ Fixed this pass

### M1 — Theme-toggle jank on KaTeX-heavy pages  *(was ~171 ms → now ~17 ms)*
On `/projects/ellipsoidal-channel/` (5,483 DOM nodes; 3,761 KaTeX spans) the theme toggle forced a **~171 ms** style recalc — a visible hitch — caused entirely by `html.theme-transitioning *` instantiating a transition on every node.

**Fix** (`assets/css/style/00-foundations.css`): scope the rule to exclude the two heavy *generated* subtrees:
```css
html.theme-transitioning *:not(.katex):not(.katex *):not(.token):not(.token *), …::before, …::after {
  transition: background-color var(--motion-base) ease-in, color var(--motion-fast) ease-out;
}
```
- **KaTeX** (`.katex *`) still fades — it inherits its colour from the transitioning `.article` ancestor, so excluding its 3.7k spans from *per-element* transitions costs nothing visually.
- **Prism tokens** (`.token`) snap — imperceptible under the code block's own background fade.

Measured: universal `*` ≈ 171 ms → scoped ≈ 17 ms (baseline no-transition ≈ 8 ms). 10× faster; the home page (few nodes) was never affected.

**Plus** (`assets/js/script/20-theme-and-toast.js`): the toggle added `.theme-transitioning` and changed the theme in the *same* style recalc, so per CSS-transition rules the crossfade could be skipped (snap). Added `void documentElement.offsetWidth` after the class add (both the manual-toggle and system-auto paths) to commit the before-state so the transition reliably fires.

### m1 — Home bio invisible without JS
`#about` shipped `d-none` + `opacity:0`, revealed only by `homeScript.js` → a no-JS visitor saw only the calligraphy, never the bio. Added a self-contained `<noscript>` reveal in `content/_index.html` (drops the intro calligraphy, shows the bio statically). `<noscript>` is fully inert when JS is on → zero risk to normal visitors.
*(Caught & fixed in the same pass: the explanatory `{{/* … */}}` Go-template comment renders as literal text inside a **content** file — switched to an HTML comment.)*

### m2 — `theme-color` meta flashed the wrong colour at first paint
`baseof.html` hard-coded `<meta name="theme-color" content="#fff">`, so dark-mode visitors got a white mobile-chrome flash until JS corrected it (and `#fff` ≠ the light bg `#f9f9f9`). Now the blocking `<head>` script creates the meta from the **resolved** theme, with values injected from `data/colors.yaml › my-background` (no hard-coded hex).

### m3 — `setTheme()` chrome colour lagged one toggle  *(bug found while verifying m2)*
`setTheme()` read `--my-background` **before** applying the new theme, so the meta always reflected the *previous* theme. Reordered to read after the switch. Verified: `#181818` ↔ `#f9f9f9` now track the theme exactly.

---

## 🟡 Remaining recommendation (not done — needs a larger change)

### r1 — Font-swap layout shift on slow networks
Google Fonts load with `display=swap`: on a slow link, display text (Spectral titles, the hero) first renders in a fallback serif, then reflows when the web font arrives — a CLS jolt on multi-line titles. This is the one slow-network layout-stability gap left. Proper fix = a fallback `@font-face` with `size-adjust`/`ascent-override`/`descent-override` tuned to each face (so the fallback occupies the same metrics), which pairs best with self-hosting the fonts. Deferred: it touches the whole font-loading path and warrants its own pass. `swap` is otherwise the right call for a typography-forward site (the brand font always wins eventually).

---

## ✅ Verified passing (no action)

Probed live; recorded so the next pass needn't re-check:

- **All-or-Nothing on first paint:** all 6 stylesheets (Bootstrap, bootstrap-icons, 3× Google Fonts, local style + page style) are render-blocking → **no FOUC**; the page does not paint until styling is ready. Correct per doctrine (a dead CDN ⇒ blank, the doctrine-preferred failure mode).
- **SPA stylesheet swap is flash-free:** the browser *retains the old `<link>`'s parsed rules until the new href finishes loading* (`stylesRetainedDuringLoad: true`) — swapping `#page-style` mid-navigation never exposes unstyled content.
- **SPA slow-fetch grace (simulated 1.2 s fetch):** direction resolves correctly (`gallery→article` = `left` swipe), the `#nav-arc` spinner fades in only past the 150 ms threshold, the **old content persists** the whole time (no blank), and the **body background stays light throughout — no black flash.** The post-VT directional-keyframe system (swipe up/down for top-level, left/right for projects, fade otherwise, landmarks persist) is intact.
- **Images:** rasters carry explicit `width`/`height` (no CLS); shimmer placeholder while loading → `@starting-style` opacity fade on arrival → `/resources/img_placeholder.svg` + debounced toast on error.
- **Material Symbols** load `display=block` (no ligature-name flash) and every glyph sits inside the collapsed tray/overlays (`display:none` at rest) — a slow icon font never shows raw text in resting chrome.
- **Signature degrades without JS:** the "R" monogram draws via pure-CSS `writeStroke` + the pill fades in via CSS `fadeIn forwards`; only expand/drag need JS.
- **Reduced motion** comprehensively handled — global clamp in `40-motion.css` plus bespoke overrides for the hero, scroll arc, toast, spotlight, and the SPA `navigateTo` (`ANIM_MS`/`ARC_MS = 1`).
- **No horizontal overflow** at 1280×800 or 375×812; `overflow-x: clip` + `scrollbar-gutter: stable both-edges`. Wide display math fits/scrolls within its container on mobile — 0 clipped of 11.
- **Corner-shift / drag** use FLIP `translate3d` (layout-free) with `transition:none` during drag; command-console panels open/close on transform+opacity with JS teardown timers kept in lock-step with CSS via shared `data/script.yaml` durations.
