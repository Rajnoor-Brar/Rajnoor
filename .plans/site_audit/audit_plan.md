# Site design audit: agenda

**Site:** rajnoor.in (Hugo, hand-written CSS/JS), audited 2026-11-13 on local `hugo server` at `main` + uncommitted work.
**Brief:** minimalist-ish, handbuilt-ish, clutter-free, focused, clean.
**Asked for:** where the site lacks, where it can expand, what to cut, what features it needs, what needs polish.

## How the audit was done

- Every page opened in a real browser at 1024×768 (dark and light) and 375×812 (mobile), with the console, spotlight, shortcuts overlay, TOC, sliders and filter exercised.
- Computed styles, loaded fonts and network requests read from the page, not guessed from source.
- Source read to confirm causes (`assets/css`, `assets/js`, `layouts`, `data`).

## Limits (read before trusting a finding)

- The browser pane was hidden during the run, so CSS animations did not advance. **Animation timing and feel were not observed live.** Motion findings come from the tokens and CSS, and are marked as such.
- No real phone, no Safari, no screen reader, no Lighthouse run. Mobile is Chromium emulation.
- `content/projects/heimdall.html`, `brookhaven.html`, `25-blocks.css` and edits to `projects.yaml` / `img.html` appeared **during** the audit (another session is writing them). They are noted where they change a conclusion but were not reviewed as finished work.
- Deployed site (rajnoor.in) not checked; only the local build.

## Agenda

Each point gets its own file. Status is updated as each is finished.

| # | Point | File | Status |
|---|---|---|---|
| 1 | First impression and the home page | `01-home.md` | done |
| 2 | Navigation and global chrome (signature console, spotlight, shortcuts) | `02-navigation.md` | done |
| 3 | Content and information architecture: what the site says, and where | `03-content-ia.md` | done |
| 4 | Typography system | `04-typography.md` | done |
| 5 | Project article: the reading experience | `05-project-article.md` | done |
| 6 | Projects gallery | `06-projects-gallery.md` | done |
| 7 | Credentials page | `07-credentials.md` | done |
| 8 | Small pages: About, Now, 404, Notebook | `08-small-pages.md` | done |
| 9 | Motion and feedback (animation, toasts, hover) | `09-motion-feedback.md` | done |
| 10 | Mobile | `10-mobile.md` | done |
| 11 | Foundations: weight, accessibility, metadata, robustness | `11-foundations.md` | done |
| 12 | Verdict: cut / expand / add / polish, in priority order | `12-verdict.md` | done |
| 13 | Directions: beyond the current design (added mid-audit on request: "be bold, expand or subvert it") | `13-directions.md` | done |

Points 1–11 judge the site as built. Point 13 is deliberately unconstrained by the current design and proposes four directions plus smaller subversions. Point 12 was written last and draws on both.

## Severity words used

- **Broken**: visibly wrong or unusable for some visitors.
- **Off-brief**: works, but contradicts minimalist / clutter-free / focused.
- **Thin**: missing content or a missing feature a visitor would expect.
- **Rough**: polish.
