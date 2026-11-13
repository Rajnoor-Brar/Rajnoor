# 3. Content and information architecture

This is the most important point in the audit. The site's design system is far ahead of its content.

## Inventory (committed state)

| Page | Substance |
|---|---|
| Home | A name, three sentences, a Now line |
| Projects | **One** card (Ellipsoidal Channel, MATLAB) |
| Project article | 2,600 words, 10 figures, 10 code blocks, 60 formulas. Real work. |
| Credentials | 2 papers, 3 languages, 5 skills, 2 degrees, 2 exams, 4 certificates |
| About | Two lines and four links |
| Now | Two items, "Updated May 2026" (six months stale today) |
| Notebook | One placeholder post; flag off, but still built and in the sitemap |
| Lambda | Three stub pages, `show: false`, but still built and in the sitemap |

Against that: about 3,800 lines of CSS, 2,100 lines of JS, seven typefaces, a search overlay, a shortcuts overlay, a scroll arc, toasts, a draggable nav, text and figure sliders, a TOC with three modes, filter chips. The machinery-to-content ratio is the site's real problem. A visitor does not see a tokenised z-index scale; they see one project.

**In flux:** Heimdall and Brookhaven pages are being written right now. Landing those two is worth more than every polish item in this audit combined. With them the gallery has three real projects and the site starts to justify its machinery.

## Findings

### Thin: the site does not say who you are in one place

Identity is split across four pages, each partial:

- Home: student, "dedicated learner".
- About: one line, four links.
- Credentials: degrees, papers, exam ranks.
- Now: two current interests.

Nobody will assemble that. About is where a visitor goes to learn about you and it is nearly empty.

**Opinion.** Merge. About becomes the one page about the person: two short paragraphs (what you study, what you build, what you are looking for), the contact links, and Now as a short dated section at the bottom. Then delete `/now` as a separate page and nav item. Five nav items become four, and one thin page disappears.

### Off-brief: three group headers for one to three projects

`projects.yaml` defines Simulations, Experimentation and Tools, each with a description line. With one card, the committed page showed a heading, a rule, a handwritten subtitle, and one card: more labelling than content. Even at three projects, groups plus tag filters are two classification systems for a list a person can read in five seconds.

**Opinion.** Drop groups and filters until there are roughly eight projects. One flat list, newest or strongest first.

### Thin: papers are your strongest credential and are filed under "Credentials"

Two peer-reviewed publications sit on a page titled Credentials, described in metadata as "Bragging Rights", next to a self-rated Rust skill of one dot. Research is work; it belongs with the work.

**Opinion.** Rename the nav: **Work** (projects and papers together, papers as a short list with DOI links) and **About** (person, education, contact). See point 7 for what to cut from Credentials.

### Broken: hidden pages are published

`/projects/lambda/` (+ two chapters, with the text "Stub overview… being drafted") and `/notebook/` (+ "Hello, Notebook") are in `sitemap.xml` and reachable by URL. `show: false` and `features.notebook = false` only hide links. Search engines will index stub pages under your name.

**Opinion.** Set `draft: true` or `build: { list: never, render: never }` on them, or delete them. Lambda is the v0/v1 lineage of Heimdall, so once Heimdall is up, Lambda should go.

### Rough: copy voice is inconsistent

- Jokey metadata that will appear in search results and link previews: "Yours Truly", "Bragging Rights", "Gallery of Goodwork".
- Formal filler on home ("relentless pursuit of knowledge").
- Plain and good in the Heimdall draft ("refuses to call a truncated result complete").

The Heimdall voice is the right one: specific, plain, first person. Rewrite the `description` fields as literal descriptions of the page; they are what Google and chat apps show.

### Rough: page titles

"Rajnoor's Projects", "Rajnoor's Credentials", "About Rajnoor", "Now on Rajnoor": four different patterns. Use one: "Projects · Rajnoor" or simply "Projects — Rajnoor".

### Rough: naming

"Rajnoor Brar" on articles, "Singh, Rajnoor" in the paper author lists, "Rajnoor" elsewhere. A reader looking for you in the author list will not find "Brar". Bold your own name in the author lists (currently every first name is bold, which marks nothing) and state the publishing name once.

## Where to expand, in order

1. Heimdall and Brookhaven pages (in progress).
2. A real About.
3. One line per paper saying what *you* did in it. The abstract is the journal's text; your contribution is the thing a reader wants.
4. Notebook only when there are three real entries. An empty notebook is worse than none.
