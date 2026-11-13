# 11. Foundations: weight, accessibility, metadata, robustness

## Weight and dependencies

Home page, measured: 17 requests across four origins (own, jsDelivr, Google Fonts, gstatic). Project pages add cdnjs (Prism) and KaTeX.

### Off-brief: "hand-built, no framework" ships all of Bootstrap

The repo's stated identity is hand-written CSS and JS with no build tooling. It loads Bootstrap 5.3 CSS and the full Bootstrap JS bundle on every page.

- **Bootstrap JS**: I found no use of `bootstrap.*` APIs or `data-bs-toggle/target/dismiss` anywhere in `assets/js`, `layouts` or `content`. The bundle (about 80 KB, includes Popper) appears to be dead weight. *Checked by grep; confirm nothing relies on it at runtime (e.g. `data-bs-theme` is CSS-only and does not need the JS) before deleting.*
- **Bootstrap CSS** is used for a small set of utilities: `container-fluid`, `d-flex`, `col-12 col-md-8 col-lg-6`, `align-items-center`, spacing classes, `btn`, `breadcrumb-item`. Perhaps 40 declarations' worth. Several site rules exist only to override Bootstrap (the `!important` policy in CLAUDE.md is about fighting it).

**Opinion.** Delete the JS bundle now. Replacing the CSS with about 60 lines of your own utilities is the single change that would make "handbuilt" literally true, and it removes a CDN origin's worth of risk. It is a medium job because of reboot defaults; do it after the content work.

### Off-brief: three icon fonts for about fifteen glyphs

Material Symbols Outlined (4 glyphs), Material Symbols Rounded (6 glyphs), Bootstrap Icons (the whole font, for GitHub/LinkedIn/envelope/Instagram, funnel and a few more). Icon fonts flash or show ligature text while loading (`display=block` hides that by hiding the icon). Fifteen inline SVGs would be smaller, instant, themeable with `currentColor`, and one less thing to load. Hand-drawn SVG icons in the style of the Heimdall card would also be the strongest possible "handbuilt" statement.

### Rough: third-party origins

Four third-party origins for a static personal site. Each is a privacy leak (Google Fonts logs visitor IPs; this has been ruled a GDPR problem in Germany) and a point of failure. With the font count reduced to three (point 4), self-hosting the WOFF2 files under `assets/fonts/` is small. You already commit Spectral TTFs there for OG cards.

## Accessibility

**Present and good:** skip link, `<main>` landmark, labelled nav, `aria-label`s on icon buttons, `role="dialog"` and `aria-modal` on overlays, 23 `:focus-visible` rules, reduced-motion handling, `lang="en"`.

**Problems:**

- **No `<h1>` on project pages, the projects gallery, or credentials** (points 5, 6, 7). Home, About, Now and Notebook have one.
- **Navigation depends on an animation to be visible** (point 2).
- **Text under 11 px**: DOI, language tags, Now snippet, "MATLAB" code tag, exam metadata.
- **Low-contrast grey text**: captions and ledes use `--my-gray-1` (`#777` on `#f9f9f9` is about 4.3:1, just under AA for small text), and it is used at small sizes in a light handwriting face. The About lede and gallery descriptions are the worst cases.
- **Touch targets**: corner-picker dots and slider reset dots are a few pixels across.
- **Information in `title` attributes** (Now descriptions): not available to touch or most screen-reader configurations.
- Not tested with a screen reader; the hover-to-expand console in particular needs a real pass.

## Metadata and SEO

**Present and good:** canonical, Open Graph and Twitter tags, JSON-LD `Person`, robots.txt, sitemap, RSS for sections, build-time OG title cards for projects (a nice touch, with fonts committed so CI reproduces them).

**Problems:**

- **Stub and disabled pages are in the sitemap** (Lambda ×3, Notebook ×2, and `404.html`). See point 3.
- **OG image for non-project pages is an SVG** (`eepy_keety.svg`). Most link-preview scrapers (Twitter/X, LinkedIn, WhatsApp, iMessage, Slack) do not render SVG OG images, so sharing the home page gives no preview image. Generate a PNG card for the home page the same way project cards are made.
- **Descriptions** are jokes ("Yours Truly", "Bragging Rights", "Gallery of Goodwork", "Nothing to see here"). These are your search-result snippets.
- `twitter:card` is `summary`; with the generated 1200×630 project cards, `summary_large_image` shows them properly.
- Hugo `0.154.5` is running locally; CI pins `0.154.0`. Minor, but image processing and template behaviour can differ between patch versions.

## Robustness

- **The build broke during the audit** on an SVG card image (point 6). A template error in one partial took down every page under `/projects/`. Since deployment is automatic on merge to `main`, a CI step that runs the production build on pull requests (or a local pre-push `hugo --minify`) would catch this before it reaches the live site.
- **Search index excludes hidden projects correctly** (`index.json` had no Lambda entry) but the pages themselves are still published; the two mechanisms disagree.
- **Feature flags hide links, not pages.** `notebook = false` and `show: false` should also stop rendering, or the flag is misleading.
- **CLAUDE.md drift.** It lists six files in `projectstyle/`; the directory has `60-print.css` and now `25-blocks.css`. It says the image partial is "always safe". Small, but the document is the project's contract.

## Engineering hygiene (credit where due)

No raw hex colours in any stylesheet. No raw durations outside tokens apart from a few `0s`/`0.01ms` resets and one `0.9s` spinner (`60-toast-loader.css:77`). Breakpoints are all Bootstrap values, with one inconsistent `577px` and mixed `767.98`/`768` forms. `!important` appears about 50 times, mostly in `homeStyle.css` (15, largely the noscript block), `20-command-panels.css` (9) and `70-images.css` (8): more than the stated policy suggests, worth a pass after Bootstrap is removed.

The discipline in the token system is real and unusual. The audit's criticism is not of the engineering; it is that the engineering has been spent on mechanisms rather than on what a visitor reads.
