# 6. Projects gallery

Reviewed at `/projects/` in the committed state (one card) and again after the Heimdall and Brookhaven entries appeared mid-audit.

## Findings

### Off-brief: layout wastes the page and stacks cards in a single narrow column

At 1024 px the content column is about 350 px wide, centred, and each card is about 160 px wide. With three projects, Heimdall is alone in its row under "Simulations" and the next card starts a new row below. The page is a narrow strip in a wide empty screen, and the card text wraps to eight short lines ("A runner for Monte / Carlo studies in / particle physics: / generators, Rivet / …").

**Opinion.** For a handful of projects, do not use cards at all. Use a list: each project is a row with the image on one side (about 240 px) and title plus one sentence on the other, at the same column width as the article (about 600–700 px). Rows read better than tiles when every item has a sentence of text, and a list of three looks intentional where a grid of three looks unfinished.

### Off-brief: the header is a filter control posing as a breadcrumb

Top of the page: a funnel icon and a "Projects" chip. There is no page title. Clicking the funnel reveals tag chips and turns the funnel into a diamond; selecting a tag fires a toast ("1 project shown"). With three projects this is ceremony. See point 3: drop groups and filters until the list is long enough to need them, and give the page a plain heading.

### Rough: group description typeface

"Projects that are more about learning and exploration than building something specific." in Edu SA Beginner at about 12 px. Hard to read, and the sentence undersells the work beneath it. If groups stay, set descriptions in the UI face. Better: remove (point 3, point 4).

### Rough: card images

- The MATLAB plot is a white-background PNG. In dark mode it is a bright white rectangle in a dark card, the single loudest element on the page. Heimdall's card has light and dark SVG variants and looks right. Either give raster cards a neutral mat that works in both themes or export a transparent version.
- Card text ("Plotting a channel of ellipsoidal profile wrapped about two directrices in 3D space via MATLAB") describes the method, not why anyone would care. One sentence on what it is and what is interesting about it.

### Broken (transient): the build failed while I was auditing

`hugo server` returned HTTP 500 on every `/projects/*` page for a period: `img.html` called `.Width` on an SVG card image (`Heimdall/card_light.svg`) via `themedImg.html`. `img.html` is modified in the working tree and the page built on the next try, so the other session appears to have fixed it. Worth a note because CLAUDE.md states the partial is "always safe": that was not true for SVGs under `assets/` until today's edit. Confirm the fix is in the commit that adds the Heimdall card, or CI will fail on deploy.

### Good and worth keeping

- `data/projects.yaml` as the single source for cards, order and prev/next is a clean arrangement.
- The Heimdall card diagram: a hand-drawn-feeling pipeline sketch with theme variants. That is exactly the handbuilt tone the brief asks for; make more card art like it.
