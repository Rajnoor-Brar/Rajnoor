# Expansion Plan

Phased implementation plan for new portfolio features.

**Two tracks:**
- **Track A — Projects upgrade** (ships enabled): tags, filtering, groups, prev/next nav.
- **Track B — New surface area** (ships behind dev flags, default off): Notebook, `/now`, Command Box (⌘K), Scroll Arc, Shortcut Hints.

Each phase is independently shippable. Test after each.

---

## Prereq — Feature flag scaffolding

Done once, used by Track B.

**Files**
- `hugo.toml` — add a `[params.features]` table:
  ```toml
  [params.features]
    notebook        = false
    nowPage         = false
    commandPalette  = false
    scrollArc       = false
    shortcutHints   = false
  ```
- `layouts/_default/default.html` — gate page-script/page-style includes and conditional script blocks behind `{{ if site.Params.features.X }}`.
- `static/js/script.js` — read flags from a `<meta name="features" content="...">` written by the layout, expose as `window.__features` so JS can early-return if a feature module is accidentally loaded.

**Pattern for each Track B feature**
1. `{{ if site.Params.features.X }}` wraps the layout markup, link tags, and `<script>` for the feature.
2. Content directories (notebook posts, `/now`) live in `content/` regardless — the *render* is gated, not the source files. Set `draft: true` on individual posts if needed.
3. To enable for local dev: flip the flag in `hugo.toml` and `hugo server`. No code change.

Effort: **S**. Lands before any of Phases B1–B5.

---

# Track A — Projects upgrade

## Phase A1 — Auto-discovered project cards

**Problem.** `content/projects/_index.html` hand-writes each card via the `projectCards` shortcode with explicit `cardImage`, `cardTitle`, etc. Tags / groups / filtering can't read from this — they need metadata on each project's *own* front matter, then iteration via Hugo's `.Pages`.

**Changes**
- Each project file in `content/projects/*.html` gets these front-matter keys added:
  ```yaml
  cardImage: "/resources/Ellipsoidal_Channel/Shadowed_Tunnel.png"
  cardTitle: "Ellipsoidal Channel"
  cardText: "Plotting a channel of ellipsoidal profile..."
  weight: 10            # ordering within group
  show : true          # whether the card/page is actually discovered/displayed/deployed
  ```
- `layouts/projects/list.html` (new) replaces the hand-rolled `_index.html` body. Ranges over `.Pages`, renders each via a partial:
  ```html
  {{ range .Pages.ByWeight }}
    {{ partial "project-card.html" . }}
  {{ end }}
  ```
- `layouts/partials/project-card.html` (new) — same markup the shortcode emits today, but reads from `.Params.cardImage`, `.Title`, etc.
- `content/projects/_index.html` becomes a thin front-matter shell with only `title`, `active_nav`, `pageScript`, `pageStyle`, `description`.

**Acceptance**
- Gallery looks identical to today on `/projects`.
- Adding a new `.html` file in `content/projects/` auto-appears as a card with no edits to `_index.html`.

Effort: **M**. Foundation for everything else in Track A.

---

## Phase A2 — Tags + filter chips

**Front matter**
```yaml
tags: ["MATLAB", "Physics", "Visualisation"]
```

**Render**
- In `layouts/projects/list.html`, before the card grid, render filter chips for the union of all tags:
  ```html
  <div id="project-filters" class="d-flex flex-wrap gap-2 mb-4">
    {{ $tags := slice }}
    {{ range .Pages }}{{ $tags = $tags | append .Params.tags }}{{ end }}
    {{ range ($tags | uniq | sort) }}
      <button class="filter-chip" data-tag="{{ . }}">{{ . }}</button>
    {{ end }}
  </div>
  ```
- Each card gets `data-tags="MATLAB Physics"` (space-joined) so JS can filter without rebuild.

**JS** — extend `static/js/projectScript.js`:
- On chip click: toggle `.active` on the chip, compute the active tag set, hide cards whose `data-tags` lacks any selected tag.
- Decision needed: AND (card must have *every* selected tag) vs OR (card must have *any*). Start with AND — feels intentional. Switch to OR if filtering ever returns zero too often.
- Empty state when zero match: a short Spectral-italic line ("No projects match this combination.")

**CSS** — add to `static/css/projectStyle.css`:
- `.filter-chip` — small rounded pill, `var(--my-silver-1)` bg, Montserrat. Active: `var(--my-black)` bg, `var(--my-white)` text. Match corner-picker visual language.
- Transition `background-color 0.15s ease, transform 0.15s ease`.

**Acceptance**
- Chips render with the union of every project's tags.
- Clicking chips filters the grid in real time, smoothly (use `transition: opacity, transform`).
- URL hash optional later (`#tag=MATLAB`) — defer.

Effort: **S–M**. Depends on A1.

---

## Phase A3 — Project groups

**Decision.** Groups are a string on each project (`group: "simulations"`), with metadata (display name, description) defined in `data/projectGroups.yaml`. Avoids Hugo taxonomy complexity since each group needs prose, not just a slug.

**Files**
- `data/projectGroups.yaml`:
  ```yaml
  - slug: simulations
    name: "Simulations"
    description: "Physics and math, rendered."
    weight: 10
  - slug: tools
    name: "Tools"
    description: "Small utilities I built for myself."
    weight: 20
  ```
- Each project front matter:
  ```yaml
  group: "simulations"   # matches a slug above
  ```
- `layouts/projects/list.html` — group `.Pages` by `.Params.group`, iterate `data.projectGroups` in weight order, render each as a section:
  ```html
  {{ range $g := site.Data.projectGroups }}
    {{ $pages := where $.Pages "Params.group" $g.slug }}
    {{ if $pages }}
      <section class="project-group" id="group-{{ $g.slug }}">
        <h2 class="project-group__title">{{ $g.name }}</h2>
        <p class="project-group__desc">{{ $g.description }}</p>
        <div class="project-group__grid">
          {{ range $pages.ByWeight }}{{ partial "project-card.html" . }}{{ end }}
        </div>
      </section>
    {{ end }}
  {{ end }}
  ```
- Projects with no `group` go into an "Other" trailing section.

**CSS** — section title in Spectral display, description in Edu SA Beginner italic accent. Hairline `border-bottom: 1px solid var(--my-border-color)` under the title.

**Interaction with A2.** When filtering by tags, entire group sections collapse if zero cards match. Animate via `transition: opacity 0.2s, max-height 0.3s` or just `display: none` for simplicity.

**Acceptance**
- Adding a group requires editing `projectGroups.yaml` once + a `group:` line in each project file.
- Group order honours `weight`; project order within a group honours each project's `weight`.

Effort: **M**. Depends on A1, integrates with A2.

---

## Phase A4 — Project prev/next nav

**Files**
- `layouts/projects/single.html` (new) — wraps `.Content` plus a footer:
  ```html
  {{ .Content }}
  <nav class="project-nav-prevnext">
    {{ with .PrevInSection }}
      <a class="project-nav-prevnext__prev" href="{{ .RelPermalink }}">
        <span class="label">← Previous</span>
        <span class="title">{{ .Title }}</span>
      </a>
    {{ end }}
    {{ with .NextInSection }}
      <a class="project-nav-prevnext__next" href="{{ .RelPermalink }}">
        <span class="label">Next →</span>
        <span class="title">{{ .Title }}</span>
      </a>
    {{ end }}
  </nav>
  ```
- Hugo's `.PrevInSection` / `.NextInSection` sort by `date` then `weight` — set `weight` on each project explicitly to control sequence.

**Decision.** Sequence is **global across all projects**, not scoped to group. (Group-scoped is nice but requires custom logic; defer if asked.)

**CSS** — two cards side by side on desktop, stacked on mobile. Title in Spectral, label in Montserrat caps small.

**Acceptance**
- Bottom of every project detail page shows prev/next where applicable.
- First/last project gracefully hides the missing direction.

Effort: **S**. Independent of A1–A3, but slots in cleanly.

---

# Track B — New surfaces (ship disabled)

All gated by `site.Params.features.X`. Default off. Enable locally by editing `hugo.toml`. **Do prereq first.**

## Phase B1 — Notebook

**Content**
- `content/notebook/_index.html` — list page, front matter:
  ```yaml
  title: "Notebook"
  active_nav: "#notebook-nav"
  description: "Field notes on physics, math, and computation."
  ```
- `content/notebook/2026-05-22-first-post.html` — sample post with `date`, `title`, `description`, `math: true` if applicable.

**Layouts**
- `layouts/notebook/list.html` — chronological list of posts, each with title (Spectral), date (Montserrat caps small), one-line description. Hairline divider between entries.
- `layouts/notebook/single.html` — Slabo body for the post, optional `pageStyle` for code/math overrides. Reuses `default.html` chrome.

**Nav**
- `layouts/_default/default.html` — add nav item gated by feature flag:
  ```html
  {{ if site.Params.features.notebook }}
    <div class="nav-item panel-item hover-grow">
      <a class="nav-link" id="notebook-nav" href="/notebook">
        <span class="nav-text">Notebook</span>
      </a>
    </div>
  {{ end }}
  ```
- When enabled, the active-rail JS picks up the new item by `offsetTop` automatically — no code change.

**RSS** — Hugo emits `notebook/index.xml` for free. Add `<link rel="alternate" type="application/rss+xml" href="/notebook/index.xml">` in `<head>` gated by the same flag.

**Disable behaviour**
- Pragmatic: gate only the nav + `<head>` RSS link; posts remain reachable by direct URL during development. Good enough — they're not indexed if nav doesn't link them.
- Hard-disable later via `cascade._build.render = "never"` in `hugo.toml` if needed.

Effort: **M**.

---

## Phase B2 — `/now` page

**Content**
- `content/now.html` — single-file page:
  ```yaml
  ---
  title: "Now"
  active_nav: ""
  description: "What I'm focused on right now."
  url: "/now"
  ---
  <p>Updated <time datetime="2026-05">May 2026</time>.</p>
  <h2>Reading</h2>
  ...
  ```

**Layout** — no new layout needed; uses `default.html`.

**Nav** — *no* nav entry by default. Linkable from home page footer or bio paragraph. (Now pages are typically discovered via `/now` directly or social bio links — keep nav uncluttered.)

**Disable** — keep `draft: true` while flag is off. Flip to `draft: false` plus `features.nowPage = true` to ship. Alternatively use `cascade._build.render` with a path filter — but draft is simpler.

Effort: **XS**.

---

## Phase B3 — Command Box (⌘K palette)

**Files**
- `static/js/commandBox.js` (new) — fetches `/index.json` on first ⌘K, builds in-memory list, opens modal, fuzzy-matches input against title/section/tags, navigates via `history.pushState` (matches existing SPA logic in `script.js`).
- `static/css/commandBox.css` (new) — fullscreen overlay, centred panel reusing `commandPanel` visual tokens (blur, border-radius, shadow). Spectral for results, Montserrat for input.
- `layouts/_default/index.json.html` (new) — Hugo-generated JSON index of every page:
  ```
  [
  {{ range $i, $p := site.RegularPages }}
    {{ if $i }},{{ end }}
    {
      "title": {{ $p.Title | jsonify }},
      "url":   {{ $p.RelPermalink | jsonify }},
      "kind":  {{ $p.Section | jsonify }},
      "tags":  {{ ($p.Params.tags | default slice) | jsonify }},
      "desc":  {{ ($p.Params.description | default "") | jsonify }}
    }
  {{ end }}
  ]
  ```
- `hugo.toml` — add JSON output for home:
  ```toml
  [outputs]
    home = ["html", "json"]
    section = ["html"]
    page = ["html"]
  ```

**Layout gate** — `default.html` only includes `commandBox.css` / `commandBox.js` when `site.Params.features.commandPalette` is true. The JSON output config in `hugo.toml` is always present, but the file is only consumed when the feature is on.

**Interaction**
- `⌘K` (mac) / `Ctrl+K` (other) opens. `Esc` closes. Arrow keys move selection, Enter navigates.
- Fuzzy match: simple substring or `fuse.js` (~6kb) — start with substring + token rank, upgrade if needed.

**Acceptance**
- Disabled by default: no JS shipped, ⌘K does nothing.
- Enabled: `⌘K` opens within 100ms, types narrow results live, Enter navigates without page reload.

Effort: **M–L**. Largest item in Track B.

---

## Phase B4 — Scroll Arc

**Idea.** Thin SVG arc traced around `#signature-background`'s rounded corner; `stroke-dashoffset` driven by `window.scrollY / (scrollHeight - innerHeight)`.

**Files**
- `static/js/scrollArc.js` (new) — `scroll` listener with `passive: true` updates a CSS variable `--scroll-progress` on `:root`. Throttled via `requestAnimationFrame`.
- `static/css/style.css` — add an `<svg>` overlay in `default.html` (gated) with one `<path>` whose `stroke-dasharray: 1; stroke-dashoffset: calc(1 - var(--scroll-progress));` and `pathLength="1"`. Stroke: `var(--my-black)`, width `2px`, opacity gated by scroll position (fades in after 200px).
- `layouts/_default/default.html` — gated `<svg>` markup + `<script>` include.

**Interaction with signature corner**
- Arc curves along the corner *nearest the viewport edge*. When signature is at `top.left`, the arc traces the top-left rounded corner outward. When dragged to `bottom.right`, it flips. Reuse the same `.top/.left/.bottom/.right` class hooks already on `#signature-box`.

**Acceptance**
- Disabled: no SVG rendered, no JS shipped.
- Enabled: arc fills smoothly as the user scrolls; reduces to invisible on short pages (when `scrollHeight - innerHeight < 200`).

Effort: **S–M**.

---

## Phase B5 — Shortcut Hints overlay

**Idea.** Press `?` (Shift+/) → translucent overlay listing all keyboard shortcuts: ⌘K (palette), arrow keys (shift signature corner), Esc (close panels), `?` (this overlay), `T` (toggle theme — add if not present).

**Files**
- `static/js/shortcutHints.js` (new) — listens for `?`, toggles `.shortcut-hints--open` on a dialog element.
- `static/css/style.css` — `.shortcut-hints` styles: fixed full-screen translucent backdrop, centred panel reusing `commandPanel` visual tokens, two-column grid of `kbd` chip + description.
- `layouts/_default/default.html` — gated `<dialog id="shortcut-hints">` markup with a hardcoded list (it's a tiny site; no need to generate dynamically).

**Disable behaviour** — when flag is off, neither markup nor JS is emitted. `?` does nothing.

**Acceptance**
- Pressing `?` from anywhere opens the overlay.
- Esc closes it.
- Lists every shortcut the site actually wires up.

Effort: **S**.

---

# Sequencing recommendation

1. **Prereq** — feature flag scaffolding (½ day).
2. **A1** — auto-discovered cards (refactor; required before A2/A3).
3. **A4** — prev/next nav (independent of A1; can run in parallel).
4. **A2** — tags + filtering.
5. **A3** — project groups.
6. **B2** — `/now` page (cheapest of Track B; sanity-check the flag plumbing).
7. **B1** — Notebook (most content value).
8. **B5** — Shortcut hints (small; validates overlay pattern reused in B3).
9. **B4** — Scroll Arc (visual polish).
10. **B3** — Command Box (highest leverage but most work; do last so it can index Notebook posts that already exist).

---

# Conventions for new code

- All new CSS uses `var(--my-*)` tokens; no raw hex.
- All new animations use `transform` + `opacity` (compositor-only) where possible; respect `prefers-reduced-motion`.
- All new JS that owns timers/listeners exposes a cleanup function via `window.__pageCleanup` so SPA navigation can cancel before leaving.
- Active-rail JS already handles dynamic nav-item lists — new nav entries (e.g. Notebook) work without code changes.
- Feature flags are *dev-side only*: not exposed in UI, not persisted per-user.
