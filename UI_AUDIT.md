# UI Audit Report

Generated from static inspection plus local Hugo preview checks on desktop (~1280px), tablet (~768px), and mobile (~390px). Content placeholders and content correctness are intentionally out of scope; findings focus on UI, interaction behavior, visual consistency, responsive layout, motion, component states, and resource loading.

## Executive Summary

- No critical findings found.
- The largest UX risk is performance: every page loads a broad global dependency set, including KaTeX, Prism, Bootstrap JS, multiple font families, and icon fonts, even when most pages do not use them.
- Mobile project controls and the shared signature command console have the weakest interaction predictability. Several controls are icon-only, hidden until gesture/focus, or visually de-emphasized enough to look decorative.
- Motion is generally polished but uneven: some transitions use tokens, while others hard-code durations or rely on invalid transition declarations.
- Credentials and project pages need the most layout polish, mostly around dense text, image sizing, filter usefulness, and mobile control affordance.

## Owner Decisions

- Keep the existing type system; optimize by gating font loading by actual page usage.
- Keep credential abstract density, certificate vertical rhythm, signature discoverability, sparse project-gallery appearance, and low-eyeprint mobile page-console direction as intentional.
- Implement notification-pill feedback except for signature/navigation moved and SPA navigation failure notices.

## Prioritized Fix Order

### Major

1. Split heavy global resources by page need.
2. Make the signature command console activation predictable and explicitly focusable/clickable.
3. Restore a visible mobile affordance for the project page console.
4. Optimize large project images and add responsive image sizing.
5. Fix mobile home clipping/edge spacing and scroll-lock fragility.
6. Improve modal focus behavior for command palette and shortcut hints.
7. Reduce dense credential abstract text and improve narrow-screen readability.
8. Make project filters conditional or more useful with the current visible project set.

### Minor

1. Remove `.DS_Store` files from static output.
2. Normalize motion declarations and remove invalid transitions.
3. Improve microcopy and state feedback in overlays and utility controls.
4. Make non-clickable credential IDs render as non-interactive badges.
5. Harden toast behavior for longer messages and variants.

## Findings

### 1. Global dependency payload is loaded on every page

- `Severity`: major
- `Location/Page`: all pages; `layouts/_default/baseof.html`
- `Viewport`: all
- `Category`: performance
- `Problem`: Every generated page loads Bootstrap CSS/JS, Bootstrap Icons, KaTeX CSS/JS, Prism CSS/JS plus MATLAB grammar, command palette JS, scroll arc JS, shortcut hints JS, and the shared site JS. Static inspection of generated pages shows 8 stylesheets and 9-10 scripts on routes including `/about/`, `/now/`, `/credentials/`, `/projects/`, and `/404.html`.
- `Why it matters`: Pages that do not render math, code, Bootstrap JS components, or project controls still pay network, parse, and execution cost. This slows first paint and makes interactions feel less responsive on mobile connections.
- `Recommended fix`: Gate KaTeX and Prism behind page params or content detection, remove Bootstrap JS if no Bootstrap JS widgets are used, and only load `projectScript.js`, `scrollArc.js`, and page-console dependencies on project pages that render those controls.

### 2. Font loading is oversized for the visual system

- `Severity`: major
- `Location/Page`: all pages; `layouts/_default/baseof.html`, `static/css/style.css`
- `Viewport`: all
- `Category`: performance
- `Problem`: The base layout requests a large Google Fonts bundle with seven font families and broad weight ranges, plus two separate Material Symbols stylesheets. The CSS then mixes multiple serif, cursive, UI, article, and code families across pages.
- `Why it matters`: Font CSS and font files are render-blocking or near-render-blocking in practice, and the broad family/weight set increases layout shift risk and perceived latency. It also makes typography feel less consistent between components.
- `Recommended fix`: Reduce to a smaller type system: one display serif, one UI sans, one monospace, and one icon strategy. Narrow requested weights to actually used values, and consider self-hosting or subsetting fonts for stable caching.

### 3. Static `.DS_Store` files are copied into the public site

- `Severity`: minor
- `Location/Page`: generated output; `public/.DS_Store`, `public/resources/.DS_Store`, `public/resources/home/.DS_Store`, `public/resources/creds/.DS_Store`
- `Viewport`: all
- `Category`: performance
- `Problem`: macOS `.DS_Store` files exist under `static/` and are copied by Hugo into `public/`.
- `Why it matters`: These files are unnecessary deployment artifacts. They add small payload/noise and make the public output less clean.
- `Recommended fix`: Remove `.DS_Store` from `static/`, add it to `.gitignore` if needed, and optionally configure the build/deploy process to exclude hidden Finder metadata.

### 4. Project imagery is large and lacks responsive variants

- `Severity`: major
- `Location/Page`: `/projects/`, `/projects/ellipsoidal-channel/`; `static/resources/Ellipsoidal_Channel/*`
- `Viewport`: all, most visible on mobile
- `Category`: performance
- `Problem`: Several project PNGs are large for web delivery, including `Cylinder_Stack_Right.png` (~990 KB), `Skeleton.png` (~840 KB), `Shadowed_Tunnel.png` (~666 KB), and multiple 400-500 KB images. The project card and article figures use the same static assets without responsive source sets.
- `Why it matters`: Large images dominate network cost, delay image reveal, and can make page transitions feel sluggish on mobile. Using full-size figures for card thumbnails wastes bandwidth.
- `Recommended fix`: Generate WebP/AVIF variants and thumbnails through Hugo image processing, use `srcset`/`sizes`, set explicit dimensions/aspect ratios, and use smaller card images than article figures.

### 5. Mobile home hero can clip and feels edge-bound

- `Severity`: major
- `Location/Page`: `/`; `content/_index.html`, `static/css/homeStyle.css`
- `Viewport`: mobile
- `Category`: responsive
- `Problem`: The mobile home view shows the hero heading pushed to the right edge with the caret at the viewport boundary, while supporting text starts flush at the left edge. The page uses fixed `100vw`/`100vh` sizing and `html, body { overflow-y: hidden; }`.
- `Why it matters`: The composition feels less intentional on narrow screens and can clip if text, font metrics, browser chrome, or localization changes. Scroll locking also removes a fallback path when vertical content exceeds the viewport.
- `Recommended fix`: Add safe horizontal padding to the hero text block, constrain the heading width with a mobile max-width, avoid viewport-width-only sizing, and allow vertical scroll or use `min-height: 100svh` with overflow fallback.

### 6. Signature command console activation is not predictable enough

- `Severity`: major
- `Location/Page`: all pages; command console in `layouts/_default/baseof.html`, behavior in `static/js/script.js`
- `Viewport`: all
- `Category`: interaction
- `Problem`: The signature pill is both a decorative brand mark and the primary navigation trigger. It uses hover/focus/tap/drag behavior, but the visible state gives little indication that it opens navigation. During browser verification, clicking the signature left `#command-box`, `#nav-panel`, and `#action-panel` in their hidden state, which suggests the activation path is fragile or hard to exercise consistently.
- `Why it matters`: Primary navigation should be predictable. A hidden gesture target makes the site feel mysterious, and failures here block navigation, theme controls, shortcut hints, and corner controls.
- `Recommended fix`: Treat the signature as an explicit button with `aria-expanded`, a clear focus-visible ring, and a simple click/tap handler that toggles the panel. Keep drag as a secondary behavior only after a movement threshold. Add a small hover/focus cue that communicates interactivity without relying on discovery animation alone.

### 7. Mobile project page-console is too hidden when contracted

- `Severity`: major
- `Location/Page`: project detail pages; `static/css/style.css`, `layouts/projects/default.html`
- `Viewport`: mobile
- `Category`: interaction
- `Problem`: On mobile project detail pages, the page-console starts contracted and CSS removes the pill background, shadow, and blur, leaving a single chevron tucked near the right edge.
- `Why it matters`: The control looks like a stray glyph instead of a tappable utility panel. Users may miss text-size, image-size, ToC, and scroll controls entirely.
- `Recommended fix`: Keep a minimal visible pill or circular button in contracted mobile state, preserve a 44px tap target, and add a stronger pressed/expanded state. Avoid negative edge margins that make the control feel partially off-screen.

### 8. Overlay dialogs do not manage focus like modal UI

- `Severity`: major
- `Location/Page`: command palette and shortcut hints; `layouts/_default/baseof.html`, `static/js/command-box.js`, `static/js/shortcutHints.js`
- `Viewport`: all
- `Category`: interaction
- `Problem`: Both overlays declare `role="dialog"` and `aria-modal="true"`, but the scripts do not trap focus, mark background content inert, or restore focus to the opener on close.
- `Why it matters`: Keyboard and assistive-technology users can lose context or navigate behind an open modal. Even visually, focus return matters for perceived predictability after closing a transient command surface.
- `Recommended fix`: Store the opener before opening, focus the first useful control, trap Tab/Shift+Tab inside the panel, close on Escape, and restore focus to the opener. Consider `inert` on background content while the modal is open.

### 9. Command palette error states are uneven

- `Severity`: minor
- `Location/Page`: command palette; `static/js/command-box.js`
- `Viewport`: all
- `Category`: loading/error/empty state
- `Problem`: Timeout shows a retry button, but non-timeout fetch failure only shows “Could not load index.” with no retry. The empty state says only “No results.” without guidance.
- `Why it matters`: Users have no recovery path for common transient failures, and empty search feedback feels abrupt.
- `Recommended fix`: Reuse the retry action for all index-load failures and use slightly more helpful empty copy such as “No matching pages.” Keep it short and consistent with the minimalist tone.

### 10. Project filters are currently low-value and visually under-explained

- `Severity`: major
- `Location/Page`: `/projects/`; `layouts/projects/list.html`, `static/js/projectScript.js`, `static/css/projectStyle.css`
- `Viewport`: all
- `Category`: component state
- `Problem`: The current visible project set has one card with two tags, so opening filters cannot meaningfully narrow the list or demonstrate the empty state. The toggle itself is a small icon beside the breadcrumb with little button affordance.
- `Why it matters`: A control that does not produce a meaningful result makes the page feel unfinished and reduces trust in interactive affordances.
- `Recommended fix`: Hide the filter toggle until there are at least two visible projects or a filter can change results. If kept, make it a clearer icon button with a visible active state and optional result-count toast after chip changes.

### 11. Credential abstracts are too dense on narrow screens

- `Severity`: major
- `Location/Page`: `/credentials/`; publication cards in `layouts/partials/credPublish.html`, `static/css/credStyle.css`
- `Viewport`: mobile and tablet
- `Category`: typography/readability
- `Problem`: Publication abstracts render at `0.7em` and are justified. On mobile/tablet this creates dense blocks with uneven word spacing and weak scanability.
- `Why it matters`: The card footer becomes visually heavier than the citation header, making the credential page harder to scan and reducing perceived polish.
- `Recommended fix`: Use left-aligned text on narrow screens, raise abstract size to roughly `0.82-0.9rem`, increase line-height, and consider clamping abstracts behind a “More” affordance if the goal is quick credential scanning.

### 12. Credential certificate cards have uneven vertical rhythm

- `Severity`: minor
- `Location/Page`: `/credentials/`; `layouts/partials/credCertificate.html`, `static/css/credStyle.css`
- `Viewport`: mobile
- `Category`: spacing/alignment
- `Problem`: Certificate cards reserve a square icon area with generous padding, which creates large blank vertical zones for academic logos compared with the denser publication cards.
- `Why it matters`: Mixed card types feel less like one system, and the academic section becomes visually heavier without adding information.
- `Recommended fix`: Use a fixed responsive logo band with max-height, reduce mobile padding, and align card body/footer spacing to the publication card rhythm.

### 13. Non-linked credential IDs look interactive

- `Severity`: minor
- `Location/Page`: `/credentials/`; `layouts/partials/credCertificate.html`
- `Viewport`: all
- `Category`: component state
- `Problem`: Entries with an ID but no link render as `<a href="javascript:void(0)" class="btn">`.
- `Why it matters`: A link-like button that does nothing violates interaction predictability and can frustrate keyboard or screen-reader users.
- `Recommended fix`: Render non-linked IDs as a non-interactive badge or text element. If it is meant to copy, make it a real button with copy behavior and toast feedback.

### 14. Project detail sliders have weak labels and reset affordance

- `Severity`: major
- `Location/Page`: project detail pages; text/image size panel in `layouts/projects/default.html`, `static/css/projectStyle.css`, `static/js/projectScript.js`
- `Viewport`: all, strongest on mobile
- `Category`: form usability
- `Problem`: Text/image size controls rely on icon/letter endpoints and a tiny reset dot. The reset dot is visually 8px with an extended but still subtle hit area, and right-click reset is only documented in code comments.
- `Why it matters`: Users may not understand what changed, how to reset it, or that the preference was saved. This makes the controls feel like hidden power-user UI rather than polished utility controls.
- `Recommended fix`: Add compact visible labels or tooltips, expose current value or default marker, increase the visible reset target, and use the notification pill for “Text size reset” / “Image size reset.”

### 15. Motion declarations are inconsistent and include invalid transitions

- `Severity`: minor
- `Location/Page`: shared and project CSS; `static/css/style.css`, `static/css/projectStyle.css`, `static/css/homeStyle.css`
- `Viewport`: all
- `Category`: motion
- `Problem`: The codebase defines motion tokens, but several transitions still hard-code durations (`0.25s`, `0.45s`, `0.1s`, `3.8s`) and two declarations contain invalid trailing comma syntax: `transition: display ... color 0s, ;`. Some hover effects animate letter spacing.
- `Why it matters`: Mixed motion timing weakens the sleek/minimalist feel and makes future tuning harder. Letter-spacing animation can cause small layout shifts.
- `Recommended fix`: Normalize transitions to the existing `--motion-*` tokens, remove invalid transition declarations, avoid animating `display`, and prefer transform/opacity/filter for subtle motion.

### 16. Toast pill can overflow and lacks variants

- `Severity`: minor
- `Location/Page`: all pages; `#rj-toast` in `layouts/_default/baseof.html`, `static/css/style.css`, `static/js/script.js`
- `Viewport`: mobile
- `Category`: component state
- `Problem`: The toast uses `white-space: nowrap`, a single visual style, and a critical z-index. It works for short messages like theme changes, but longer status text can overflow on narrow screens and it cannot distinguish success, warning, error, or neutral feedback.
- `Why it matters`: The pill is a good interaction feedback surface, but without width wrapping and variants it will be hard to reuse safely.
- `Recommended fix`: Add `max-width: calc(100vw - 2rem)`, allow wrapping or ellipsis for long messages, add neutral/success/warning/error variants, and keep it above page chrome but below blocking modal overlays unless the toast belongs to the modal.

### 17. Image loading placeholders do not reserve all final dimensions

- `Severity`: minor
- `Location/Page`: cards and figures; `static/css/style.css`, credential/project partials
- `Viewport`: all
- `Category`: loading/error/empty state
- `Problem`: Card images get a min-height and shimmer, but publication/certificate icons and article figures rely heavily on intrinsic image dimensions. Some images lack explicit width/height or aspect-ratio constraints in markup.
- `Why it matters`: Images can shift layout when metadata arrives, especially on slower connections. The shimmer can also look inconsistent between card types.
- `Recommended fix`: Add explicit dimensions or CSS aspect-ratio wrappers for card images, credential logos, and figures. Use consistent skeleton surfaces for repeated card components.

### 18. Shortcut hints explain commands after discovery, not discovery itself

- `Severity`: minor
- `Location/Page`: shortcut hints overlay; `layouts/_default/baseof.html`
- `Viewport`: all
- `Category`: copy/microcopy
- `Problem`: The overlay includes “Signature open” and “Move to corner,” but does not explain how to open the signature navigation. This is especially noticeable because signature open is prerequisite state for those arrow-key commands.
- `Why it matters`: The help surface should close the loop on the most unusual interaction pattern.
- `Recommended fix`: Add a short shortcut row such as “Click / tap signature: Open navigation” or rename the section to clarify that arrow keys apply once the signature panel has focus.

### 19. Project card grid has weak desktop hierarchy with one visible item

- `Severity`: minor
- `Location/Page`: `/projects/`; `layouts/projects/list.html`, `layouts/partials/project-card.html`, `static/css/projectStyle.css`
- `Viewport`: desktop
- `Category`: visual hierarchy
- `Problem`: With one visible project, the card sits in a narrow centered column under a broad heading area, leaving a lot of empty horizontal space. The layout reads like a sparse grid rather than a deliberate featured project view.
- `Why it matters`: The page can feel underpopulated even when the project itself is visually strong.
- `Recommended fix`: When only one project is visible, use a featured single-card layout with wider media, better text measure, and aligned heading width. Fall back to grid when multiple projects are visible.

### 20. Page-console and command-console use similar surfaces but different mobile rules

- `Severity`: minor
- `Location/Page`: shared shell and project detail pages; `static/css/style.css`
- `Viewport`: mobile and tablet
- `Category`: consistency
- `Problem`: The signature command console remains a full pill on mobile, while the mirrored page-console collapses into a bare chevron. Both represent floating utility chrome but use different visual affordance rules.
- `Why it matters`: Inconsistent chrome behavior makes controls harder to predict and weakens the site’s system-level polish.
- `Recommended fix`: Define one floating-control pattern for mobile: visible compact pill, clear icon, 44px target, consistent backdrop, and consistent expanded/collapsed motion.

## Notification Pill Opportunities

- Theme change confirmation, already started with “Theme: Light/Dark/Auto.”
- Command palette index feedback: “Search ready,” “Search failed,” and “Retrying search.”
- Copy confirmations for DOI, project links, headings, and credential IDs.
- Project filter feedback: “1 project shown,” “No matching projects,” or “Filters cleared.”
- Text/image size controls: “Text size reset,” “Image size 80%,” or “Reading preferences saved.”
- Page-console and signature preferences: “Navigation moved,” “Page tools collapsed,” “Corner saved.”
- Offline/slow navigation feedback when SPA fetch falls back to a full navigation.
- Image error summary only when useful, such as “Some images could not load,” avoiding one toast per image.
- Shortcut hint confirmations for first-time discovery, such as “Press ? anytime for shortcuts.”
- Non-blocking success/error variants for future forms or downloads.

## Verification Notes

- `hugo --minify` passed before report creation.
- Checked representative routes in local preview: `/`, `/about/`, `/credentials/`, `/now/`, `/projects/`, `/projects/ellipsoidal-channel/`, and `/404.html`.
- Checked representative viewports around 390px, 768px, and 1280px.
- Checked command palette normal and no-results states, shortcut overlay, project filters, mobile project console, and theme toast behavior.
- No screenshots are embedded in this report.
