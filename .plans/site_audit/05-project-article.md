# 5. Project article: the reading experience

Reviewed on `/projects/ellipsoidal-channel/` (the one committed article), with a glance at the Heimdall draft.

## What exists

Breadcrumb, centred long title, subtitle, author, then the article in a bordered panel 573 px wide (about 64 characters per line: good). Right side: a page console with TOC toggle, text-size panel (two sliders), a collapse chevron, a section TOC, and a scroll arc drawn around the console's border. Code blocks carry a language tag and copy button. Prev/next quad at the end.

## Findings

### Broken: justified text with hyphenation

`.article { text-align: justify; hyphens: auto }`. In a 573 px column this produces a hyphen break on most lines of some paragraphs ("ellip-soids", "rota-tional", "con-sists", "vari-able", "di-rectrix", "perpendic-ular", "cylindricalsur-face"). On mobile (about 36 characters per line) it is worse: five of seven lines in one paragraph end in a hyphen. Browsers do not justify well; this is a print habit that hurts on screen. The CSS comment shows the trade was noticed (rivers without hyphens), but the fix for rivers is to not justify.

**Opinion.** `text-align: left; hyphens: manual`. Single highest-value one-line change on the site.

### Broken: display equations render as small left-aligned inline math

Several standalone equations ($a = \frac{k}{2}$, $a^2 = b^2 + c^2$, the vector equation of the ellipse, the matrix form) appear flush left at 14 px, while others ($F_1 = \{…\}$, $D = \frac{F_1+F_2}{2}$) are centred display math. The left ones are inline `$…$` on their own line. In a maths-heavy article the equations are the content; half of them are the smallest thing on the page.

**Opinion.** Convert standalone formulas to `$$…$$` and fix the KaTeX size (point 4).

### Broken: no `<h1>` on project pages

The title is `<div class="title">`. The page's heading outline starts at `h2`. That costs screen-reader users the page title and gives search engines no primary heading. Make it an `h1`.

### Off-brief: the page console is a control panel for a problem readers do not have

On a reading page, fixed on screen at all times: TOC-mode cycler, text-size toggle, collapse chevron, two sliders with reset dots, the TOC, and a scroll arc. Then a toast ("Page tools collapsed") when you collapse it.

- **Text-size and figure-width sliders.** Browsers have zoom. A per-site font slider with persistence, a reset dot and a toast is a lot of interface for something Cmd-plus does. Figure width as a user setting is stranger still: the author should decide how big a figure is.
- **TOC-mode cycle (none / h2 / h2+h3).** A three-state toggle whose icon changes subtly; my first click appeared to do nothing. The TOC is the useful part. Showing it or not is the only choice needed.
- **Scroll arc.** Pretty, and it is integrated into the console outline rather than added as a bar, which is clever. It still duplicates the scrollbar and the TOC's active marker.

**Opinion.** Keep the TOC, quietly, with h2 only and h3 revealed for the active section. Cut both sliders, the mode cycle, the collapse toast, and their four persistence keys. If the arc stays, it stays as the single ornament. This removes most of `projectScript.js` and `50-page-console.css`.

### Rough: the title block

"Plotting an ellipsoidal channel surface using two directrices as foci of ellipsoids and an axis length in MATLAB" is set as a five-line centred bold headline, followed by "A detailed analysis of Theory and Code" and "Rajnoor Brar". A reader sees a wall of title before anything else, the subtitle adds no information, and the byline is redundant on a site named after you. The Heimdall draft does this right: short title, one-line subtitle that says what it is.

**Opinion.** Title = the short name. The long sentence becomes the subtitle or the first line of the abstract. Drop the byline; add a date instead, which the page lacks and readers want.

### Rough: the article sits in a box inside a page

The body is a bordered, differently-coloured panel on the page background, figures are bordered boxes inside that, and code blocks are filled boxes inside that. Three nested frames. With the console islands beside it, the screen is a set of rounded rectangles. The cleanest version of this page is text on the page background with figures unframed and only code tinted.

### Rough: details

- Figures: the first figure is a small image centred in a much wider bordered frame with large empty margins. Let figures size to the image.
- Captions repeat the alt text verbatim.
- Code is 12.3 px next to 17.6 px text: too small a ratio. About 0.85em of body is the usual balance.
- The TOC had no active item while I was inside "The Tangents" (scrolled to "Spline Interpolation"); it lit up correctly in "The Ellipses". Looks like the active marker drops when only h3s are in view. *Seen once, not chased down.*
- Definition-style lists ("Right circular cylinder: …") are run together with line breaks rather than list markup.
- Copy button confirms with a toast at the bottom of the screen, away from where the eye is. Changing the button label to "Copied" in place is quieter.

### Good and worth keeping

- 64 characters per line and 1.5 line-height: the measure is right.
- The article itself is genuine, carefully explained work with real figures.
- Print stylesheet exists (`60-print.css`). Rare and thoughtful for a physics write-up.
- The "In short" abstract block in the Heimdall draft is the right opening for every project page.
