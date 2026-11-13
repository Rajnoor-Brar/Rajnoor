# Issues: things to remove, clean or check later

Open items for this repository. Decisions are in `Notes.md`. Each issue says what it is, where it lives, why it is still open, and what closes it.

States: **open**, **blocked** (waiting on something named), **parked** (deliberately later), **closed** (keep the entry, add the date).

---

## Kept but switched off

These exist in the tree and do nothing. Each needs a decision eventually: bring back, or delete.

### I-01 · SPA router is disabled, code kept · open (takes effect in phase 3)
- **What:** `assets/js/script/60-spa-navigation.js` (344 lines) and the cleanup chain it drives. To be gated by a new flag, `params.features.spaRouter = false`, wrapped at build time so the code is not shipped while off.
- **Why kept:** your call (N-11); you may want client-side navigation back.
- **Cost of keeping:** it will drift. Every later change to `baseof.html`, the margin shell or page scripts is untested against it, so switching it back on will not be free.
- **Closes when:** you either re-enable it and it is re-tested on every page type, or delete the file, the flag, `__registerCleanup` (I-03) and the related CLAUDE.md sections. Revisit at phase 8.

### I-02 · Project groups and tag filters are disabled, code and data kept · open (takes effect in phase 5)
- **What:** `groups` and per-project `group` / `tags` in `data/projects.yaml`; group sections and filter chips in `layouts/projects/list.html`; filter code in `assets/js/projectScript.js`; styles in `assets/css/projectstyle/30-gallery.css`. To be gated by `params.features.projectGroups` and `params.features.projectFilters`, both false.
- **Why kept:** your call (N-11). They become useful again when the list is long.
- **Closes when:** the project count reaches about eight and they are switched on and restyled for the row layout, or they are deleted.

### I-03 · Cleanup chain has no caller while the router is off · open
- **What:** `window.__registerCleanup` in `30-command-console-core.js` and its callers in `spotlight.js`, `homeScript.js`, `projectScript.js`. Harmless with full page loads, but dead.
- **Closes when:** I-01 is resolved either way.

### I-04 · Lambda stub pages · open (unpublish in phase 1)
- **What:** `content/projects/lambda/` (three stub pages) and its `show: false` entry in `projects.yaml`. Currently published and in the sitemap.
- **Closes when:** unpublished in phase 1; then deleted, or rewritten as history on the Heimdall page. Your call.

### I-05 · Notebook · parked
- **What:** `content/notebook/`, `layouts/notebook/`, `notebookStyle.css`; flag off but pages still built.
- **Closes when:** unpublished in phase 1; launched when there are three real entries.

---

## To remove or clean

### I-06 · Revision-1 prototype is stale · open
- **What:** `.plans/site_redesign/prototype/`. Colours, foot signature, corner marks and home page no longer match the design.
- **Closes when:** phase 4 is done (the real templates replace it as the reference), then delete; or refresh it sooner if you want to see revision 2 before building.

### I-07 · Preview server entries in `.claude/launch.json` · open
- **What:** `redesign-proto` (added during this work, serves the repo root on port 8097) goes when I-06 closes. A pre-existing entry, `aman`, serves `/tmp` on port 8099 and looks unrelated to this site.
- **Closes when:** `redesign-proto` removed with the prototype; you confirm whether `aman` is needed.

### I-08 · Bootstrap JS bundle appears unused · open (phase 1)
- **What:** `bootstrap.bundle.min.js` in `baseof.html`. No `bootstrap.*` call or `data-bs-toggle/target/dismiss` found by search.
- **Closes when:** confirmed unused at runtime on every page, then removed.

### I-09 · Bootstrap CSS, three icon fonts, Google Fonts CDN · parked (phase 8, optional; D6)
- **Closes when:** replaced by a small utilities file, inline SVG icons and self-hosted fonts, or you decide to leave them.

### I-10 · `!important` used about 50 times · parked
- **What:** mostly `homeStyle.css`, `20-command-panels.css`, `70-images.css`. More than the policy in CLAUDE.md implies.
- **Closes when:** reviewed after I-09, since many exist to override Bootstrap.

### I-11 · Corner-move arrow keys become undocumented · open (phase 7)
- **What:** the shortcuts overlay is removed (N-09) but arrow-key corner moving stays. Nothing will tell a visitor the keys exist.
- **Closes when:** a `title` hint on the mini-map is added, or the arrow keys are dropped.

### I-12 · CLAUDE.md is out of date · open (phase 8)
- **What:** lists six files in `projectstyle/` (there are eight); calls `img.html` "always safe" (it failed on an SVG on 2026-11-13); will describe removed systems after the redesign.
- **Closes when:** rewritten to match the tree at the end of phase 8.

### I-13 · Hugo version differs between local and CI · open
- **What:** local `0.154.5`, CI pins `0.154.0`. The pin now lives in two files, `hugo.yml` and `build-check.yml`, and must be changed in both.
- **Closes when:** CI pin raised to match, or local pinned.

---

## To verify or fix

### I-14 · Uncommitted Heimdall/Brookhaven work on `main` · closed 2026-11-13
- **What:** `data/projects.yaml`, `layouts/partials/img.html`, `project-page-context.html`, two content pages, `25-blocks.css`, two image folders.
- **Closed by:** commit `25f4d1b2` on `main`, after a clean production build. **Not pushed**, so the two pages are not live yet; pushing `main` deploys them. Left out of the commit on purpose: `.plans/` (untracked) and `.claude/launch.json` (see I-07).

### I-15 · No build check on pull requests · open (written, not yet proven)
- **What:** CI builds only on push to `main`, which also deploys. A template error reaches the live site.
- **Done so far (2026-11-13):** `.github/workflows/build-check.yml` on branch `redesign`: builds on pull requests to `main` with read-only permissions, never deploys, then checks that seven key output files exist and are not empty. YAML parses; the same build and file check pass locally. Not committed, not run on GitHub.
- **Closes when:** the file is committed and pushed, and a pull request from `redesign` shows a green run.
- **Limit:** it only guards changes that go through a pull request. A direct push to `main` still deploys unchecked, as today.

### I-16 · `~ascii` in the Ellipsoidal article · blocked on you
- **What:** `content/projects/Ellipsoidal_Channel.md` has `load("curves.txt", "~ascii")`; MATLAB's flag is `-ascii`.
- **Closes when:** you confirm against your working script and the article is corrected or left.

### I-17 · Wide equations overflow on phones · open (phase 4)
- **What:** the matrices in the Ellipsoidal article are wider than a phone column. They will scroll inside their own box; a readable version needs hand-chosen line breaks.
- **Closes when:** each wide equation is checked at 375 px and broken or left to scroll on purpose.

### I-18 · Never tested · open
- **What:** Safari, Firefox, a real phone, a screen reader, print, widths above 1024 px, and animation timing (the audit's browser pane froze CSS animations).
- **Closes when:** each is checked at least once after phase 7. Print is checked in phase 6.

### I-19 · Copy only you can write · blocked on you
- **What:** two paragraphs for About; two sentences for Home; which projects are `featured:`; which credentials start with `portfolio: false`.
- **Closes when:** supplied, or I draft and you edit. Needed by phases 6 and 7.

---

## Parked ideas

Not planned; listed so they are not lost. From `site_audit/13-directions.md`.

- Cite-this (BibTeX) on `/portfolio`.
- A live figure in the Ellipsoidal article (the prototype has a working one).
- Errata list per article.
- Build-time math rendering (D5).
- A real collision event from Heimdall on the home page.
- Now generated from repository activity.
