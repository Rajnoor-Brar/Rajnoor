# 4. Typography system

## What is loaded

Seven text families and three icon fonts:

| Family | Where it shows |
|---|---|
| Spectral | Titles, hero, nav, card titles |
| Montserrat | UI, body on gallery/credentials, captions |
| Edu SA Beginner | Group descriptions, About lede |
| Instrument Serif | Project subtitle (one line per article) |
| Slabo 27px | Article body |
| Quicksand | Now page list |
| Inconsolata | Declared for code |
| Material Symbols Outlined, Material Symbols Rounded, Bootstrap Icons | Icons |

## Findings

### Off-brief: seven typefaces is not a minimalist system

The role-token layer in `data/style.yaml` is well engineered, and it has made adding faces too cheap. On a project page a reader meets, top to bottom: Montserrat (breadcrumb), Spectral (title), Instrument Serif (subtitle), Montserrat (author), Slabo (body), a monospace (code), KaTeX's Computer Modern (math), and Spectral again (TOC). Six voices before the first figure.

Three of the seven do almost no work:

- **Instrument Serif**: one subtitle line per article. Spectral italic does this job and is already loaded.
- **Quicksand**: the Now list only. A rounded geometric sans that appears on one page and matches nothing else.
- **Edu SA Beginner**: a school-handwriting face for group descriptions and the About lede. It is presumably the "handbuilt" signal, but it reads as childlike next to Spectral, and at 12 px on the gallery it is hard to read. Your actual handwriting (the signature and the calligraphy) is the handmade signal; a handwriting *font* dilutes it.

**Opinion.** Go to three: Spectral (display and, see below, body), Montserrat (UI), one monospace. Cut Instrument Serif, Quicksand and Edu SA Beginner. That removes three network families and makes the pages look like one site.

### Rough: Slabo 27px is being used against its design

Slabo 27px is drawn to be set at exactly 27 px; that is what the name means. The article sets it at 17.6 px, where its narrow letterforms and tight spacing become cramped, and it has a single weight and no italic, so every `<em>` and `<strong>` in the article is a browser-synthesised slant or smear. In the Ellipsoidal article bold run-in terms ("Right circular cylinder:", "Total Complexity:") are faux bold.

**Opinion.** Set article body in Spectral (it has real italics and five weights, and it is already loaded), or in a text face with a proper family if Spectral feels too light on screen at body size. Either way, stop using a single-weight display cut for 2,600 words with emphasis.

### Broken: the code font token is not applied

`--my-font-code` is Inconsolata, and Inconsolata is downloaded on project pages. But the computed font on `pre code`, on tokens and on inline `code` is `Consolas, Monaco, "Andale Mono", monospace`. Prism's theme stylesheet sets `font-family` on `code[class*="language-"]`, which beats the site's `pre, code` rule. So the page downloads Inconsolata and renders Monaco. Fix by setting the family on the same selector Prism uses (`20-article.css:272–279` already targets it for other properties).

### Rough: math is smaller than the text it sits in

`.katex { font-size: 0.8em }` puts inline math at 14 px inside 17.6 px text. Variables like $b = c$ and $O$ look like subscripts of the sentence. KaTeX's default is 1.21em precisely because Computer Modern has a small x-height; 0.8em overcorrects by a third. Several display equations also render left-aligned at inline size (see point 5).

**Opinion.** Inline math at about 1.0–1.05em, display at 1.15–1.2em.

### Rough: scale and case

- No shared type scale. Sizes are per-component `clamp()`s: 88 / 23 / 14.4 on home, 17.6 body, 12.3 code, 10–11 px for badges, DOI and Now snippet. Text at 10 px is below what most people read comfortably.
- Uppercase tracked micro-labels in several places: "UPDATED MAY 2026.", "NATIVE / FLUENT / PROFICIENT", "MATLAB" code tag, "PROJECTS" in spotlight, "EVERYWHERE / SIGNATURE OPEN". It is a small thing each time; together it is a recognisable template habit and it fights the handbuilt tone. Sentence case at a readable size is calmer.
- Article text is pure white (`rgb(255,255,255)`) on `#111` in dark mode. For long reading that is harsh; `--bs-body-color` (`#fbfbfb`) or slightly dimmer is easier.

### Good and worth keeping

- Spectral for display is a good, uncommon choice, and it suits a physics student's site.
- The role-token indirection means every change above is a few lines in `data/style.yaml`.
