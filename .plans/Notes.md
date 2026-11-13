# Notes: decisions log

What was decided, when, and why. Newest at the bottom. Open work lives in `Issues.md`; this file only records decisions so nobody re-argues them.

Format: **N-nn** · date · decision. Then why, and what was rejected.

---

## Site redesign (started 2026-11-13)

Source documents: `site_audit/` (the audit), `site_redesign/design_plan.md` (design, revision 2), `site_redesign/working_plan.md` (phases).

**N-01** · 2026-11-13 · **Rethink the site rather than repair it** ("Path 2" in `site_audit/12-verdict.md`).
Why: the audit found the site minimalist in content and heavy in mechanism. Rejected: Path 1, keeping the design and polishing it.

**N-02** · 2026-11-13 · **The site is not a single page.** The one-sheet "preprint" layout from revision 1 becomes `/portfolio`, a pseudo-CV to send to people.
Why: you were not excited by a one-page site. Rejected: revision 1's home-as-whole-site.

**N-03** · 2026-11-13 · **Three sections: Home, Work, About, plus `/portfolio`.** Credentials and Now stop being pages.
Rejected: keeping today's five pages; adding Notebook as a fourth section now.

**N-04** · 2026-11-13 · **Home keeps the handwriting hero**, trimmed to about 2 s and skippable, followed by intro and work links.
Rejected: plain intro with no animation (my recommendation); collision-event hero; signature-as-hero.

**N-05** · 2026-11-13 · **Navigation: signature pill on Home, margin column on every other page.**
Rejected: margin everywhere (my recommendation); pill everywhere; plain top row. Known cost: two navigation systems (see I-11 context in `Issues.md` and `design_plan.md` §9).

**N-06** · 2026-11-13 · **Look: margin with sidenotes, and Spectral as the only text face.** Colours stay as today.
Rejected by you: paper/blackboard palette, signature at the foot of the page.

**N-07** · 2026-11-13 · **`/portfolio` is a web page that prints**, built from the data files.
Rejected: a committed PDF (second copy to maintain); screen-only page.

**N-08** · 2026-11-13 · **`/portfolio` lists projects, papers, education and exam ranks, technical skills and languages. Every item has a YAML bool, `portfolio: true|false`, that decides whether it appears.**
Skills and languages are plain lists (no dot meters, no band pills). edX certificates start with the flag off.

**N-09** · 2026-11-13 · **Kept: corner moving and spotlight search. Removed: shortcuts overlay and article reading controls** (text-size and figure-width sliders, TOC mode cycle).
I recommended cutting corner moving to drag only; you kept all of it.

**N-10** · 2026-11-13 · **Sidenotes are typeset only.** No handwritten notes, so no accent colour for them.

**N-11** · 2026-11-13 · **The SPA router (D1) and project groups and tag filters (D2) are disabled, not deleted.** Their code and data stay in the repo behind feature flags, off.
Why: you want the option to bring them back. My default had been to delete both. Scope: this applies to D1 and D2 only; other removals in the plan are still deletions unless you extend this rule. Tracked as I-01 and I-02.

**N-12** · 2026-11-13 · **Defaults accepted without change:** D3 `/work/` URLs via Hugo permalinks with redirects; D4 colours unchanged plus a plot mat; D5 KaTeX stays in the browser; D6 Bootstrap CSS, icon fonts and font hosting as an optional last phase; D7 Now as a section on About plus a line on Home; D8 text theme switch at the foot of the margin; D9 `/cv/` redirects to `/portfolio/`.
(You answered "no preference" on D4–D9 and did not select D3.)

**N-13** · 2026-11-13 · **`.plans/Notes.md` and `.plans/Issues.md` are the running record**: decisions here, things to remove or clean later there.

---

## Conventions

- A decision that reverses an earlier one gets a new entry that names the one it replaces; the old entry is not edited.
- Anything switched off but kept in the tree must have an entry in `Issues.md` with a condition for deleting or re-enabling it.
