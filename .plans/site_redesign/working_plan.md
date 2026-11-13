# Redesign: working plan

Design: `design_plan.md` (revision 2). Audit behind it: `.plans/site_audit/`.
Decisions log: `.plans/Notes.md`. Things to remove or clean later: `.plans/Issues.md`.
Status (2026-11-13): **phase 0 in progress.** Pending work committed on `main` (`25f4d1b2`, not pushed). Branch `redesign` created. PR build check written (`.github/workflows/build-check.yml`), not yet committed or run on GitHub. Phases 1–8 not started.

## Before anything

The working tree on `main` has uncommitted work from the Heimdall/Brookhaven session (`data/projects.yaml`, `img.html`, `project-page-context.html`, two content pages, `25-blocks.css`, two image folders). **Commit that first**, so the redesign branch starts from a clean, deployable `main`. I have not committed anything.

## Ground rules

- All work on a branch, `redesign`. `main` deploys automatically on merge, so nothing reaches the live site until the branch is merged.
- Each phase leaves the site building and usable. Merge to `main` is possible after any phase from 2 onward, but pages will look mixed until phase 6.
- Check after every phase: `hugo --minify --baseURL "https://rajnoor.in/"` builds with no errors; every page opened at 1024 px and 375 px in light and dark; old URLs redirect.
- Removals happen inside each phase, not saved for the end, with one exception you set: the SPA router and the project groups and filters are **switched off, not deleted** (N-11). They stay in the repo behind feature flags and are tracked in `Issues.md` (I-01, I-02).
- Anything switched off but kept gets an `Issues.md` entry with a condition for deleting or re-enabling it. Every decision gets a line in `Notes.md`.

## Decisions D1–D9

Settled 2026-11-13. D1 and D2 changed from my default (delete) to yours (disable, keep the code). D3–D9 stand as proposed.

| # | Decision | Settled as | Alternatives considered |
|---|---|---|---|
| D1 | SPA router (`60-spa-navigation.js`) | **Disabled, code kept.** New flag `params.features.spaRouter = false`. The file stays in the repo and is wrapped in a build-time `{{ if }}` so it is not shipped while off. Pages load normally, with a CSS cross-fade (`@view-transition`). | Delete it (my original default). Keep it running. |
| D2 | Project groups and tag filters | **Disabled, code and data kept.** New flags `params.features.projectGroups` and `params.features.projectFilters`, both false. `groups`, `group` and `tags` stay in `projects.yaml`; the markup, script and styles stay, gated. The page shows a flat list with tags as plain text. | Delete both (my original default). Keep groups as headings. Keep both as today. |
| D3 | `/work/` URLs | **Hugo `permalinks` + `aliases`**, content folder stays `content/projects/`. Least churn in layouts and data. | Rename the folder to `content/work/` (cleaner, touches every `projects` reference). Keep `/projects/` URLs and only change the nav word. |
| D4 | Colour | **Unchanged tokens**, plus one mat colour for plots in dark mode. | Revisit palette after the layout lands. |
| D5 | Math | **Keep KaTeX in the browser**, fix its size. | Build-time rendering with Hugo's `transform.ToMath` (no JS on the page; unverified with this Hugo version and the long matrices). |
| D6 | Bootstrap CSS, icon fonts, Google Fonts CDN | **Phase 8, optional.** Bootstrap JS goes in phase 1 if nothing uses it. | Do it inside phase 2 (bigger, riskier foundation change). Never. |
| D7 | Where Now lives | **A dated section on About**, and one line on Home. | Home only. Keep `/now/` as a page. |
| D8 | Theme switch on subpages | **Text switch at the foot of the margin** ("Dark" / "Light"). | Icon button at the top of the margin. |
| D9 | `/cv/` alias | **Add**, pointing to `/portfolio/`. It is the URL people guess. | Skip. |

## Phases

### Phase 0 — Prepare

- Commit the pending Heimdall/Brookhaven work on `main` (yours to do or approve).
- Create branch `redesign`.
- Add a pull-request build job to `.github/workflows/hugo.yml` (build only, no deploy), so a template error cannot reach `main` unseen.

Done when: branch exists; a PR from it shows a green build.

### Phase 1 — Repairs that survive the redesign

From the audit's fix-now list, only the items the redesign does not replace.

- Unpublish Lambda stubs and Notebook (`build:` front matter or `draft: true`); confirm they leave `sitemap.xml`.
- Rewrite the joke meta descriptions (Home, Projects, Credentials, 404).
- PNG Open Graph image for non-project pages; `twitter:card` → `summary_large_image` where a card exists.
- Remove the Bootstrap JS bundle after confirming at runtime that nothing calls it.
- Fix `-ascii` in the Ellipsoidal article, after you confirm against your working script.

Done when: sitemap lists only real pages; link previews show an image; no console errors on any page.

### Phase 2 — Type

- `data/style.yaml`: point every role token at Spectral, code at Inconsolata; delete the unused role tokens.
- `baseof.html`: font request reduced to Spectral (400, 400i, 500, 600) and Inconsolata.
- Apply the code font to Prism's selector (`code[class*="language-"]`), so Inconsolata is actually used.
- KaTeX inline size 0.8em → about 1em; display about 1.15em.
- Sweep sizes: nothing under 0.8125rem; tracked-capital labels to italic sentence case.

Done when: computed `font-family` on body text, UI text and code blocks is Spectral / Inconsolata on every page; no request for the five removed families.

### Phase 3 — The margin shell

The structural change. Everything after depends on it.

- `baseof.html`: branch on page kind. Home renders the command console as today. Every other page renders a new partial, `partials/margin.html`: signature (static, links Home), nav words, Search, a slot for contents, theme switch.
- New stylesheet part for the sheet: margin, gutter, text column, rule, `.m` margin items, narrow-screen fold. Port from `prototype/proto.css` using the site's existing tokens.
- Remove from subpages: page console, scroll arc, chapter strip, top spacers.
- Spotlight: open from the margin's "Search" and from `/`.
- D1: add `spaRouter = false` to `hugo.toml` and the `rj-features` meta; wrap `60-spa-navigation.js` in a build-time flag check so it is kept but not shipped. Make spotlight and any other caller fall back to a normal page load when `navigateTo` is absent. The cleanup chain stays in place, unused (I-03).

Done when: About, Work list and one article render inside the margin shell at both widths and both themes with no floating elements; Home is visually unchanged; spotlight opens from the margin; the built `script.js` contains no router code while the flag is off.

Risk: this phase touches the file every page depends on. Do it in small commits and check Home after each.

### Phase 4 — Articles

- `layouts/projects/default.html`: title block (`h1` title, subtitle, revised date from git), "In short" abstract, contents into the margin slot, hanging section numbers, prev/next as plain links.
- Remove the article panel box; left-align; no auto-hyphenation; figures unframed with the dark-mode mat; code at about 0.85em of body.
- New shortcode `sidenote`. Convert standalone `$…$` formulas in the Ellipsoidal article to display math.
- Delete: `50-page-console.css`, the slider/TOC-mode/chapter-strip code in `projectScript.js`, their persistence keys, the "Code copied" toast (button text changes in place).
- Front matter: short `title`, long sentence as `subtitle`, drop `author`.

Done when: Heimdall, Brookhaven and Ellipsoidal Channel read correctly end to end at both widths; no horizontal page scroll; wide equations scroll inside their own box.

### Phase 5 — Work list and URLs

- D3: `permalinks` for the section to `/work/:slug/`; `aliases` on each project and on the list page for the old `/projects/…` URLs.
- `layouts/projects/list.html`: flat rows (image, title, one sentence, tags as text) as the default path. D2: the group sections and filter chips stay in the template behind `projectGroups` / `projectFilters`, both false; the filter code in `projectScript.js` and the gallery CSS are gated the same way, not deleted.
- `data/projects.yaml`: keep `groups`, `group` and `tags`; add `featured:` and `portfolio:`.
- Update `index.json` (search), `project-page-context.html` (prev/next) and the OG partial for the new URLs.

Done when: `/work/` lists three projects; every old `/projects/…` URL redirects; spotlight results open the new URLs; turning `projectGroups` on still builds (it need not look finished).

### Phase 6 — Portfolio, About, and the pages they replace

- Data: `portfolio:` flag on every item in `projects.yaml`, `credentials.yaml`, `now.yaml`; new `data/portfolio.yaml` (abstract, section order, contact). Skills gain `used_in:` and lose `level`; languages lose `band`.
- `layouts/portfolio/` template: abstract, projects, papers (your name in bold, DOI as a link), education and exam ranks, skills, languages. Only flagged items.
- Print stylesheet: A4, nav and switches hidden, link targets printed, page breaks kept out of entries. Target two pages.
- About: two short paragraphs (**you write these**), contact with the email as text, Now section.
- Remove: Credentials page, `credBadge.html`, `credCertificate.html`, `credPublish.html`, `credentialsList.html`, `credScript.js`, `credStyle.css`, `labels.yaml`, band colours; Now page and `nowStyle.css`.
- Aliases: `/credentials/` → `/portfolio/`, `/now/` → `/about/`, `/cv/` → `/portfolio/` (D9).

Done when: flipping one `portfolio:` bool adds or removes exactly that item; print preview is a clean one- or two-page document in Chrome and Safari; old URLs redirect.

### Phase 7 — Home

- Hero: total intro about 2 s; any key, click or scroll skips it; caret stops after typing.
- Intro: two sentences (**you write or approve these**), left-aligned, one column with the name.
- Featured work from `featured: true`, then plain links: All work, About, Portfolio. Now line under the intro at readable size.
- Pill: visible at first paint; add a search button to the action row; remove the `?` button; mini-map gets a `title` hint for the arrow keys.
- Delete the shortcuts overlay (`shortcutHints.js`, its CSS and markup) and confirmation toasts.

Done when: with JavaScript off, Home shows the name, intro and links; with it on, content is on screen within about 2.5 s of first load; every destination is reachable without opening the pill.

### Phase 8 — Clean-up and optional foundations

- Remove dead tokens, unused toast variants, unused persistence keys; update CLAUDE.md to describe the new structure, including the three new flags.
- Go through `Issues.md`: decide I-01 and I-02 (bring back or delete), close what the phases resolved.
- Optional (D6): replace Bootstrap CSS with a small utilities file; icon fonts → inline SVG; self-host the two font families.
- Optional (D5): build-time math.

### Later, each on its own

Cite-this on `/portfolio`; a live figure in the Ellipsoidal article; errata; Notebook when there are three entries; the collision event.

## What I need from you

1. Commit (or tell me to commit) the pending Heimdall/Brookhaven work.
2. Two paragraphs for About and two sentences for Home, or permission to draft them for you to edit.
3. Which projects are `featured:` on Home, and anything in `credentials.yaml` that should be `portfolio: false` from the start (I would start with the three edX certificates off).

## Order of risk

Highest: phase 3 (shared template, router switched off). Then phase 5 (URLs; a missed alias is a broken link from outside). Phases 1, 2, 7 are low risk. Phase 6 is mostly new files and deletions.
