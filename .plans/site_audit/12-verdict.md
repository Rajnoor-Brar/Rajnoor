# 12. Verdict

## In one paragraph

The engineering is disciplined and the content is thin. The site has a token system, a search overlay, a draggable navigation island, sliders, toasts and a custom page router, and it has, in the committed state, one project, a three-sentence home page and a two-line About. Measured against the brief (minimalist, handbuilt, clutter-free, focused), it is minimalist in content and maximalist in mechanism, which is the wrong way round. The most valuable work in progress is the Heimdall and Brookhaven pages; the most valuable design work is deletion.

## There are two ways to act on this audit

- **Path 1, repair.** Keep the current design, fix what is broken, cut what is off-brief. The lists below.
- **Path 2, rethink.** Rebuild around the preprint structure, a single margin, and paper/blackboard surfaces (`13-directions.md`). Most of the "cut" list happens automatically, and most of the "polish" list becomes moot.

My recommendation is Path 2, started only after Heimdall and Brookhaven are published, with the "Fix now" list done first because it is cheap and applies to both paths.

## Fix now (broken, cheap, applies to either path)

| # | What | Where |
|---|---|---|
| 1 | Left-align article text; turn off auto-hyphenation | `05` |
| 2 | Unpublish Lambda stubs and Notebook (they are in the sitemap) | `03`, `11` |
| 3 | Make the project title an `<h1>`; add `<h1>` to gallery and credentials | `05`, `11` |
| 4 | Apply the code font to Prism's selector (Inconsolata is downloaded and unused) | `04` |
| 5 | Raise inline math from 0.8em to about 1em; convert standalone formulas to display math | `04`, `05` |
| 6 | Render the signature pill visible at first paint; animate only the stroke | `02` |
| 7 | Mobile: stop the pill covering article text | `10` |
| 8 | Rewrite the five joke meta descriptions; ship a PNG OG image for non-project pages | `11` |
| 9 | Remove the unused Bootstrap JS bundle (after confirming nothing calls it) | `11` |
| 10 | Confirm the `img.html` SVG fix is committed with the Heimdall card; add a PR build check | `06`, `11` |

## Cut

In order of how much clutter each removes:

1. **Skill dot meters and language bands**, with their script, labels file and band colours. They undersell you. (`07`)
2. **The corner system**: mini-map, arrow keys, throw. Keep drag at most. (`02`)
3. **Text-size and figure-width sliders, TOC-mode cycle**, and their persistence keys. (`05`)
4. **Confirmation toasts.** Keep toasts for failures only. (`09`)
5. **Three typefaces**: Instrument Serif, Quicksand, Edu SA Beginner. Then Slabo 27px as body. (`04`)
6. **The calligraphy intro or the typed name**: one, not both; and line 3 of the bio. (`01`)
7. **edX certificates and certificate IDs.** (`07`)
8. **Project groups and tag filters** until there are about eight projects. (`03`, `06`)
9. **The Now page and the Credentials page as separate pages**; fold into About and Work. (`03`)
10. **Shortcuts overlay**, once the corner keys are gone. Spotlight too, unless it gets a visible button. (`02`)
11. **Byline and "A detailed analysis of…" subtitle** on articles; "Page not found :(" on 404; the forever-blinking caret; "All rights reserved". (`05`, `08`, `01`)
12. Later: Bootstrap CSS, icon fonts, the SPA router. (`09`, `11`)

## Expand

1. **Heimdall and Brookhaven** project pages. In progress; nothing else matters as much.
2. **About**: two real paragraphs, education, languages, a readable email address, Now as a dated section.
3. **Home**: say what you do, and link the work.
4. **Papers**: one line each on your own contribution; DOI as a working link.
5. **Notebook**: launch with three real entries, not one placeholder.
6. **Margin notes** in your own voice on articles (the Now descriptions show the voice exists).

## Features the site needs

Needed (a visitor would miss them):

- A way to reach the work from the home page without discovering a hidden menu.
- A date on every article; "last revised" on the site.
- A readable, copyable email address.
- A visible search entry point, or no search.

Would make it distinctive (from `13-directions.md`):

- **Cite-this BibTeX** for papers and projects.
- **One live figure per article**: sliders on the physics instead of on the font.
- **Sidenotes** in a margin column.
- **Errata** per article.
- **Now generated from repository activity**, so it cannot go stale.
- **A real collision event** from your own runs as the home page.
- **Print as preprint**: the existing print stylesheet promoted to a feature with a PDF link.
- **Colophon** with source link and page weight.

## Polish (only if staying on Path 1)

- Home: one alignment axis, bio capped at about 34rem, small lines raised to about 1.1rem, Now snippet moved under the bio.
- Gallery: rows instead of 160 px cards; a mat or transparent export for white-background plots in dark mode.
- Article: remove the box-in-box framing; figures sized to their images; code at about 0.85em of body; "Copied" in place of a toast; TOC active state inside h3-only regions.
- Credentials (if kept): publications as a bibliography list; bold only your own name; fix the "Englis/PROFICIENT" collision; units on "8.85".
- Dark mode: article text off pure white; 404 cat contrast up.
- Nav tray: more opaque, or dim the page behind it.
- Type: nothing under 12 px; sentence case for micro-labels; one page-title pattern.
- Mobile: remove the 100–130 px top spacers; hide `?` on touch.
- CLAUDE.md: bring the file lists and the "always safe" claim up to date.

## What is good and should survive any redesign

- The signature as the site's mark. It is the one element nobody else has.
- The 404 page's voice. Write the rest of the site like that.
- The Heimdall card diagram and the "In short" abstract block.
- The article measure (about 64 characters) and the existence of a print stylesheet.
- The data-file architecture (`projects.yaml`, tokens in YAML). It makes every change above cheap.
- Reduced-motion handling, skip link, noscript fallback, build-time OG cards.

## Not verified

- Animation timing and feel on any page (hidden browser pane froze CSS animations).
- Real phone, Safari, screen reader, Lighthouse.
- Whether the nav tray opens on first tap on touch.
- Whether Bootstrap JS is truly unused at runtime (grep only).
- The deployed site; only the local build was audited.
- Heimdall and Brookhaven pages as finished work (they were being written during the audit).
