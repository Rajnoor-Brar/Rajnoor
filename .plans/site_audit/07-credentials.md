# 7. Credentials page

## What exists

Seven sections down one page: Publications, Languages, Technical Skills, Academic, Competitive Exams, Certifications. Publications and certificates are cards; languages and skills are pills with meters. About 4,600 px tall on mobile. No page heading.

## Findings

### Off-brief: this is a CV broken into widgets, and the widgets work against you

**Skill dot meters.** Python 3/5, MATLAB 3/5, Rust 1/5, C++ 4/5, LaTeX 5/5. Self-rated meters are the most commonly criticised device on portfolio sites, for good reason: the scale is undefined, and they invite the reader to notice the low numbers. This page tells a visitor that your strongest technical skill is LaTeX and that you are a 3-of-5 in the language Heimdall has 35,000 lines of. The project pages prove skill; the dots contradict them. There is also a gold tier (6–10) on a five-dot meter, a hover/tap toast that names the level, and a `labels.yaml` vocabulary to support it.

**Language bands.** English is shown as band 3 "Proficient", below Hindi "Fluent", while the same page lists IELTS band 8 and the whole site is written in English. A reader takes "Proficient" as weaker than you are.

**Opinion.** Cut the skills section entirely; the projects carry it. Languages become one text line on About ("Punjabi, Hindi, English"). That removes `credBadge.html`, `credScript.js`, `labels.yaml`, the band colour tokens and about 150 lines of CSS.

### Off-brief: low-value entries dilute the strong ones

Two peer-reviewed papers share a page with three edX intro certificates ("Python Basics for Data Science", "Introduction to Data Science", "Understanding Nuclear Energy"), each shown with a 32-character certificate hash as its most prominent data. A reader's attention is finite; the edX cards spend it. Exam ranks (JAM AIR 643, GATE AIR 1685) are meaningful to an Indian academic reader and noise to others: keep them as one line each, not cards.

**Opinion.** Keep: publications, degrees, exam ranks (as lines), IELTS (as a line). Cut: edX certificates, certificate IDs.

### Rough: publication cards

- Two narrow cards side by side, each holding a full abstract in a column about 180 px wide (4–5 words per line, hyphenated, about 25 lines). Abstracts are the journal's words and nobody reads them here. Show title, authors, journal, year and a DOI link; put the abstract behind a disclosure or drop it.
- The title is in quotation marks *below* the author list and journal. Title should lead.
- Every author's first name is bold, so bold marks nothing. Bold only your own name.
- The DOI is truncated with an ellipsis ("10.1007/s12596-025-…") at about 10 px. A DOI that cannot be read or copied is not doing its job. Link the journal name or a "DOI" label instead.
- The Springer cover thumbnail is the only colour on the page and is repeated identically on both cards.

**Opinion.** A plain bibliography list, the way a physicist's page normally does it. It is more credible than cards and far more compact.

### Broken: label collision

At 1024 px the English pill renders as "Englis" with the "PROFICIENT" tag drawn over the last letter. The three-across layout does not leave room for the longest label plus tag plus icon. (Moot if the section is cut.)

### Rough: details

- No `<h1>` and no page title on screen; the page opens on "Publications" after about 90 px of empty spacer.
- Degree cards: institution logos render at about 16 px, too small to identify; "8.85" has no unit or scale (CGPA out of 10?); "Ongoing" floats alone.
- Section rhythm: each section has a heading, a full-width rule, then centred pills or cards. Centred rows under left-aligned headings (the 3+2 skill rows) look accidental.
- Meta description "Bragging Rights" will show in search results for your credentials page.

### Where this should go

Fold into two places (see point 3): papers move to **Work**; education, exams and languages become a short text block on **About**. The Credentials page and its nav item then disappear. That is one fewer page, one fewer script, one fewer stylesheet, and a stronger presentation of the papers.
