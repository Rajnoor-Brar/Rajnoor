# Codebase Review

Date: 2026-05-18

Scope: Hugo static portfolio site. Reviewed `hugo.toml`, GitHub Pages workflow, the shared layout, content pages, shortcodes, CSS, JS, and static assets. Verification included a normal Hugo build and a clean build destination.

## Executive Summary

The site is a small hand-written Hugo project with one shared HTML layout, page-specific CSS/JS files, and static assets. The main strengths are low framework complexity, easy deployment, and a clear personal visual identity.

The highest-risk issue is that `/projects/` is not generated in a clean Hugo build. The local `public/projects/index.html` is stale output, so it can hide the problem during manual checks. The next most important issue is a first-visit JavaScript crash in the global theme initializer.

The biggest maintainability opportunity is to move repeated head/nav/script logic into Hugo partials, conditionally load heavy page assets, remove empty/stale files, and make the content structure match Hugo's section model.

## Verified Build Behavior

Command run:

```bash
hugo --minify --baseURL "https://rajnoor.in/"
```

Result: build completed, but Hugo emitted layout lookup warnings:

```text
WARN found no layout file for "html" for kind "section"
WARN found no layout file for "html" for kind "page"
WARN found no layout file for "html" for kind "home"
```

Clean destination check:

```bash
hugo --minify --baseURL "https://rajnoor.in/" --destination /private/tmp/rajnoor-hugo-clean-build
```

The clean output did not include `/projects/index.html`; it only included project detail pages under `/projects/color-namer/` and `/projects/ellipsoidal-channel/`.

Local Hugo version used by the build was `0.154.5+extended`; CI pins `0.128.0` in `.github/workflows/hugo.yml:33-39`. Keep local and CI versions aligned when confirming fixes.

## Priority Fixes

1. Fix the missing `/projects/` output.
   - Evidence: `content/projects.html:1-42` defines a `/projects` page, but `content/projects/` also exists as a Hugo section. Hugo treats `/projects/` as the section and the clean build does not generate `projects/index.html`.
   - Recommended fix: move the projects listing into `content/projects/_index.html` and keep its front matter there. Add or confirm a section-capable layout for it. If the current `layout: default` approach is kept, test a clean destination and verify `/projects/index.html` exists.

2. Fix the first-visit theme crash.
   - Evidence: `static/js/script.js:5` declares `const savedTheme`, then `static/js/script.js:16` assigns to it when no saved theme exists. That throws `TypeError: Assignment to constant variable` for first-time visitors and stops the rest of the global script.
   - Recommended fix: use `let savedTheme`, or avoid reassignment by deriving a normalized `theme` value.

3. Guard active navigation activation.
   - Evidence: `layouts/_default/default.html:123-126` blindly calls `document.querySelector(buttonid).classList.add("active")`.
   - Current mismatches:
     - `content/404.html:4` uses `active_nav: '404-nav'` without `#`, and the nav item is not present.
     - `content/color-namer.html:4` uses `#color-nav`, but the shared nav has no `color-nav`.
   - Recommended fix: normalize front matter values and guard with `document.querySelector(buttonid)?.classList.add("active")`. Consider allowing pages to omit `active_nav`.

4. Restore or intentionally retire Color Namer data loading.
   - Evidence: `static/js/colorScript.js:3` fetches `/SVH/ColorData.csv`, but no `ColorData.csv` exists in the repo. The app falls back to repeated "White" options in `static/js/colorScript.js:98-105`.
   - Recommended fix: either add the CSV under `static/SVH/ColorData.csv`, change the path to the real data source, or remove/hide the page until the dataset is available.

5. Fix malformed and undefined CSS.
   - Invalid `calc()` syntax: `static/css/style.css:283` and `static/css/style.css:289` use `calc(0.25var(--navExpandedHeight))`.
   - Invalid transition declarations: `static/css/style.css:302` and `static/css/style.css:384` end with a dangling comma.
   - Invalid property value: `static/css/projectStyle.css:196` uses `padding:none`.
   - Typos and undefined variables: `--page-boder` at `static/css/projectStyle.css:4`, `--subtitle-color` at `static/css/projectStyle.css:102`, `--abstract-bg` at `static/css/projectStyle.css:130`, and `--text-muted` at `static/css/projectStyle.css:198`.

## Refinements

1. Split the monolithic layout into partials.
   - `layouts/_default/default.html` currently owns head metadata, external assets, the signature SVG/nav, page content, scripts, and active-nav logic.
   - Recommended partials: `head.html`, `signature-nav.html`, `scripts.html`, and `meta.html`.
   - This will make conditional asset loading much easier and reduce risk when editing the global shell.

2. Make page assets optional.
   - `layouts/_default/default.html:36` and `layouts/_default/default.html:119` always emit page CSS/JS.
   - Several referenced files are empty: `static/css/contactStyle.css`, `static/js/contactScript.js`, `static/js/credScript.js`, and `static/js/projectScript.js`.
   - Recommended fix: wrap with `with .Params.pageStyle` and `with .Params.pageScript`, then remove empty files if they are not intentionally reserved.

3. Load heavy libraries only where needed.
   - Every page loads Bootstrap JS, Bootstrap Icons, Material Symbols, all Google fonts, KaTeX, and Prism from `layouts/_default/default.html:21-33` and `layouts/_default/default.html:109-115`.
   - Recommended fix: use page params like `math: true`, `code: true`, and `icons: true`. Load KaTeX only on math pages and Prism only on code pages. This is especially relevant for the home/contact pages.

4. Quote and complete metadata.
   - `layouts/_default/default.html:9` should quote the description value: `content="{{ .Params.description }}"`.
   - There are two viewport tags at `layouts/_default/default.html:8` and `layouts/_default/default.html:14`.
   - Add `og:title`, `og:description`, canonical URLs, and page-specific `og:image` where useful.

5. Improve keyboard and assistive behavior.
   - The theme and nav-position controls are `div role="button"` elements at `layouts/_default/default.html:92-102`. They need keyboard handlers or should become real `<button>` elements.
   - `layouts/shortcodes/projectCards.html:4` emits images without `alt`.
   - `content/404.html:15` emits an image without `alt`.

6. Harden external links.
   - Several `target="_blank"` links lack `rel="noopener noreferrer"`, for example `content/contact.html:16`, `content/contact.html:20`, `content/contact.html:28`, `layouts/shortcodes/credCertificate.html:34`, and `content/projects/Ellipsoidal_Channel.html:567`.

7. Remove debug logging from production scripts.
   - `static/js/script.js:238` logs nav position on every update.
   - `static/js/colorScript.js:186`, `static/js/colorScript.js:189`, and `static/js/colorScript.js:204` log response data and save status.

8. Replace brittle breadcrumb URL construction.
   - `layouts/shortcodes/projectNav.html:16` builds URLs from lowercased crumb text. This will break for labels with spaces or punctuation unless every label maps cleanly to the URL.
   - Recommended fix: pass explicit crumb labels and URLs, or use Hugo menu/section metadata.

## Additions Worth Making

1. Add a clean-build CI check before deployment.
   - Use a clean destination and fail on warnings where possible. This would have caught the missing `/projects/` page.
   - Consider `hugo --gc --minify --panicOnWarning --baseURL ...` after confirming current warnings are resolved.

2. Add a small smoke-test script.
   - Check that expected files exist after build: `/index.html`, `/projects/index.html`, `/projects/ellipsoidal-channel/index.html`, `/credentials/index.html`, `/contact/index.html`, `/404.html`.
   - Check generated HTML for accidental `livereload.js`, empty `href`, and missing project route.

3. Add style and HTML validation.
   - CSS validation would catch the invalid `calc()`, dangling transition commas, and `padding:none`.
   - HTML validation would catch missing `alt`, duplicate viewport tags, and invalid anchor/button patterns.

4. Add image optimization.
   - Several PNGs are large for a static portfolio page, including `static/resources/Ellipsoidal_Channel/Cylinder_Stack_Right.png` at about 968 KB and `static/resources/YaEWYntB.jpg` at about 892 KB.
   - Recommended additions: resized responsive variants, WebP/AVIF copies, and explicit `width`/`height` attributes to reduce layout shift.

5. Add project/content data files.
   - Project cards are currently hardcoded in `content/projects.html:18-23`, with future cards commented out at `content/projects.html:25-38`.
   - Recommended addition: `data/projects.yaml` or page bundle params, then render cards from data. This makes adding projects cleaner and removes commented HTML.

6. Add a lightweight browser QA checklist.
   - Minimum viewports: mobile narrow, tablet, desktop.
   - Interactions: signature open/close, theme cycle, nav position cycle, contact form layout, Color Namer fallback/data path, math/code rendering on the Ellipsoidal Channel page.

## Bloat and Removal Candidates

1. Remove `.DS_Store` files and ignore them.
   - Current `.gitignore` only ignores `public` at `.gitignore:1`.
   - Finder metadata exists in multiple places, including `.DS_Store`, `static/.DS_Store`, `layouts/.DS_Store`, and nested `static/resources/.DS_Store` paths.
   - Add `.DS_Store` and `.hugo_build.lock` to `.gitignore`; remove any tracked Finder files.

2. Remove or replace empty placeholders.
   - `content/color-maker.html` is empty.
   - `static/css/contactStyle.css` is empty.
   - `static/js/contactScript.js`, `static/js/credScript.js`, and `static/js/projectScript.js` are empty.
   - Keep placeholders only if they are part of an intentional convention, and document that convention.

3. Remove the debug shortcode.
   - `layouts/shortcodes/dump.html` appears to be a scratch/debug fragment with old nav/link markup. Delete it if it is not used.

4. Remove duplicated SVG sources after choosing a source of truth.
   - The home page contains very large inline SVG paths in `content/home.html`, while similar files also exist in `static/resources/home/*.svg` and `static/resources/home/raw/*.svg`.
   - Recommended fix: keep raw design exports outside the published static tree, and render reusable SVGs through a shortcode or partial if animation classes are needed.

5. Remove stale/generated `public` from local review assumptions.
   - `public/` is ignored, but the local copy contains stale files such as `public/projects/index.html` with `livereload.js`.
   - Do not use existing `public/` as proof of current source behavior. Use a clean destination for verification.

6. Simplify CI.
   - `.github/workflows/hugo.yml:40-50` installs Dart Sass and conditionally runs npm install, but the repository has no SCSS or Node package files.
   - Remove these steps unless Sass/Node is planned soon.

7. Remove unused or commented project assets.
   - `static/resources/YaEWYntB.jpg` is large and currently only referenced in commented project cards.
   - Either restore the related project card or remove/replace the asset.

## Suggested Implementation Order

1. Fix the Hugo content structure for `/projects/`, then verify with a clean build destination.
2. Fix the global JS crash and active-nav guard.
3. Restore or retire Color Namer data submission.
4. Clean up `.DS_Store`, empty placeholders, stale debug shortcode, and unused assets.
5. Split the layout into partials and add conditional asset loading.
6. Add build smoke tests and fail CI on warnings.
7. Optimize images and improve metadata/accessibility.

