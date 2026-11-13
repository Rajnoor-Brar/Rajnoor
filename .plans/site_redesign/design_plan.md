# Redesign: design (revision 2)

**Revised 2026-11-13** after your answers. Revision 1 (the one-page "preprint" site with paper/blackboard themes) is superseded; what survives from it is listed in section 8. The build order is in `working_plan.md`.

## 1. What you decided

| Question | Your answer |
|---|---|
| Site shape | Three sections: Home, Work, About, plus `/portfolio` |
| One-page layout | Not for the site. It becomes `/portfolio`, a pseudo-CV to send people |
| Home page | Keep the handwriting hero, trimmed, then intro and work links |
| Navigation | Signature pill on Home; margin navigation on every other page |
| Look carried over | Margin with sidenotes; Spectral only. *Not* paper/blackboard, *not* the signature at the foot |
| `/portfolio` form | Web page that prints cleanly |
| `/portfolio` contents | Projects, education and exam ranks, technical skills, languages. Every item carries a YAML bool that decides whether it appears |
| Features kept | Corner moving; spotlight search |
| Features removed | Shortcuts overlay; article reading controls (sliders, TOC mode cycle) |
| Switched off but kept | SPA router; project groups and tag filters |
| Sidenotes | Typeset only |

## 2. The design in one paragraph

Home stays the personal, animated front door: your handwriting, the signature pill, a short introduction and links to the work. Every other page is a quiet reading page with one margin column that holds the navigation, the contents and the notes, set in one typeface. `/portfolio` is a single sheet built from the site's data files that you can link or print.

## 3. Pages

| URL | What it is | Chrome |
|---|---|---|
| `/` | Hero (trimmed), two-sentence intro, featured work, Now note, plain links to Work / About / Portfolio | Signature pill |
| `/work/` | All projects as a flat list of rows: image, title, one sentence | Margin |
| `/work/<slug>/` | A project article | Margin with contents and sidenotes |
| `/about/` | Who you are, contact, Now | Margin |
| `/portfolio/` | One-sheet CV: abstract, projects, papers, education, skills, languages | Margin; prints |
| `/404.html` | As today, restyled to one typeface | none |

Redirects (Hugo `aliases`): `/projects/…` → `/work/…`, `/credentials/` → `/portfolio/`, `/now/` → `/about/`, `/cv/` → `/portfolio/`.

Unpublished: Lambda stubs, Notebook (until each has real content).

## 4. Layout

### Home

```
 ┌───┐
 │ R │  pill: Work · About · Portfolio · search · theme · corners
 └───┘
            getting things done        (draws once, about 2 s, any key skips)
                     ↓
            I'm Rajnoor
            Physics master's student at IIT Mandi.
            I build tools for simulating particle collisions.

            Heimdall      A runner for Monte Carlo studies…
            Brookhaven    Jet photoproduction with Pythia 8 and Sherpa 3…
            All work   About   Portfolio

            now: learning Rust and ML…                       May 2026
```

- One alignment axis (left), intro capped at about 34rem.
- The intro and links are in the HTML from the start; the animation only reveals them. No content waits on JavaScript.
- The plain links at the bottom mean the pill is a convenience, not the only way in.

### Every other page

```
      ~Rajnoor~  │  Heimdall
      Work       │  A runner for Monte Carlo studies in particle physics
      About      │  Revised 11 November 2026
      Portfolio  │
      Search     │  In short. …
                 │
      1 Problem  │
      2 Model    │
      3 Reruns   │
               1 │  The problem
                 │  FIFO chains deadlock when a writer dies before…
   a typeset     │
   sidenote      │  [ figure ]
                 │  Fig. 1. …
                 │
      Dark       │
```

- Margin 11rem, gutter 2.5rem, text 38rem (about 68 characters), one hairline rule in `--my-border-color`.
- The margin head is the signature (small, static, links Home), the three nav words, and "Search". Not sticky, so sidenotes can share the column.
- Section numbers hang in the margin. Sidenotes sit beside the sentence they annotate.
- The article is text on the page background. The bordered article panel goes.
- Below 56rem the margin folds into one line at the top; sidenotes drop inline with a rule on their left. Nothing floats, so nothing covers text.

### /portfolio

The revision-1 home prototype, almost unchanged: name, affiliation, last-revised date, abstract, then sections whose labels sit in the margin. In print: A4, margin labels kept, nav and theme switch hidden, link targets (DOIs) printed.

## 5. Look

- **Colour:** unchanged. The existing `data/colors.yaml` tokens stay. One addition: `--my-mat`, a light mat behind white-background plots in dark mode.
- **Type:** Spectral for all text (400, 400 italic, 500, 600), Inconsolata for code. Montserrat, Instrument Serif, Slabo 27px, Quicksand and Edu SA Beginner are removed. Body 1.125rem / 1.6, left-aligned, no auto-hyphenation. Nothing below 0.8125rem. Labels in italic sentence case, no tracked capitals.
- **Shape:** the margin rule is the only structural line on subpages. No cards or panels on subpages. The pill keeps its current glass treatment on Home.

## 6. Features

| Feature | Fate | Notes |
|---|---|---|
| Signature pill and tray | Kept, Home only | Visible at first paint; only the stroke animates |
| Corner moving | Kept, Home only | All four methods, as you chose |
| Spotlight | Kept | Gains a visible entry: a button in the pill on Home, "Search" in the margin elsewhere, and `/` as a second key |
| Theme toggle | Kept | In the pill on Home; a text switch at the foot of the margin elsewhere |
| Hero animation | Kept, trimmed | About 2 s, skippable, 12-hour skip retained |
| Shortcuts overlay | Removed | |
| Page console, sliders, TOC modes | Removed | Contents live in the margin |
| Scroll arc | Removed | It was drawn around the page console |
| Chapter strip | Removed | Multi-chapter projects list chapters in the margin |
| Toasts | Failures only | Spotlight errors, copy failed, image failed |
| Credentials badges, skill meters | Removed | Skills and languages become plain lists on `/portfolio` |
| Project groups and tag filters | Switched off, kept | Flat list shown; code and data stay behind flags (D2, `Issues.md` I-02) |
| SPA router | Switched off, kept | Normal page loads; code stays behind a flag, not shipped (D1, `Issues.md` I-01) |

## 7. The portfolio flag

One rule everywhere: **an item appears on `/portfolio` if and only if it has `portfolio: true`.**

| File | Items | Change |
|---|---|---|
| `data/projects.yaml` | projects | add `portfolio:` and `featured:` (Home) |
| `data/credentials.yaml` | publications, degrees, exams, certificates, skills, languages | rename `show:` to `portfolio:`; skills drop `level`, gain `used_in:`; languages drop `band`, keep `note:` |
| `data/now.yaml` | items | add `portfolio:` |
| `data/portfolio.yaml` (new) | abstract text, section order, contact lines | |

`labels.yaml` and the band colours in `colors.yaml` are deleted with the badges.

## 8. What survives from revision 1

Kept: the margin layout, hanging section numbers, typeset sidenotes, Spectral-only type, the one-sheet layout (now `/portfolio`), the plot mat for dark mode, "last revised" from git, print as a first-class output.

Dropped by your choice: paper/blackboard palette, red-pencil accent and handwritten notes, signature at the foot, corner marks on figures (they belonged to the construction-line palette).

Deferred, not decided: live figure per article, cite-this, errata, build-time math, the collision event.

## 9. Where this revision is weakest

1. **Two navigation systems.** A visitor learns the pill on Home and a margin everywhere else. The plain links on Home and the signature at the top of the margin are there to make the two feel like one site; if they do not, the fix is to show the margin on Home as well and let the pill be an ornament.
2. **Home is still an animated page with a hidden menu.** Trimming and the visible links reduce the cost; they do not remove it.
3. **Corner moving and spotlight stay, but the overlay that documented their keys goes.** Arrow keys for corners become undiscoverable. Spotlight gets a visible button; corners get a `title` hint on the mini-map and nothing more.
4. **Corner moving now serves one page.** It keeps about 300 lines of JS and two persistence keys for the Home page alone.

## 10. Prototype status

`prototype/` was built for revision 1 and is now a **layout reference only**. Still accurate: margin layout, sidenotes, hanging numbers, type scale, mobile fold, the one-sheet page (as `/portfolio`). Stale: colours (paper/blackboard), signature at the foot, corner marks, the home page.
