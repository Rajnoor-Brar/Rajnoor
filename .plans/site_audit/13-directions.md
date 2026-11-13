# 13. Directions: beyond the current design

Points 1–11 audit the site as it is. This point ignores the current design and asks what the site *could* be. Nothing here is constrained by existing CSS, the pill, or the token tables. Each direction names its risk, because a bold idea that fails is worse than a quiet one that works.

## The diagnosis that drives all of this

The current site is "minimalist" by subtraction of content and "handbuilt" by addition of mechanism: glass pills, blur, toasts, overlays, sliders. That is the visual language of an operating system, not of a person. Frosted floating islands, a command palette and a `?` overlay are what every developer portfolio built since 2022 looks like. The site's two truly personal assets are barely used:

1. **Your hand.** The signature and the calligraphy are real pen strokes. Everything else is a typeface.
2. **Your subject.** Particle collisions, laser–plasma, envelopes of ellipsoids. Physics has one of the richest visual vernaculars of any field (bubble-chamber photographs, blackboards, lab notebooks, preprints, Feynman diagrams, drafting paper) and the site borrows from none of it.

Handbuilt should mean *you can see the hand*. Minimalist should mean *nothing between the reader and the work*. The directions below start from those two definitions.

---

## Direction A — The preprint

**The site is a paper about you.** Physicists read one document format every day: the arXiv preprint. Title, author, affiliation, abstract, numbered sections, numbered figures and equations, references. It is the most focused reading format ever standardised, and it is your field's native tongue.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                      Rajnoor Brar                        │
│        Indian Institute of Technology Mandi              │
│              rajnoor@…  ·  last revised 13 Nov 2026      │
│                                                          │
│   Abstract.  Physics master's student. I build tools     │
│   for particle-physics simulation and write up the       │
│   mathematics behind them. Two papers on laser–plasma    │
│   interaction. Currently: …                              │
│                                                          │
│   1  Work                                                │
│      1.1  Heimdall — a runner for Monte Carlo studies    │
│      1.2  Brookhaven — …                                 │
│      1.3  Ellipsoidal channel — …                        │
│   2  Publications                                        │
│      [1] Gupta, Limbu, Singh, Malik. J. Opt. (2025)      │
│      [2] …                                               │
│   3  About                                               │
│                                                          │
│                                        ~ signature ~     │
└──────────────────────────────────────────────────────────┘
```

- The home page is the whole site map on one sheet. No menu to discover, because the page *is* the menu. Numbering is honest here: papers are numbered.
- Each project page is a paper: abstract ("In short", which the Heimdall draft already has), numbered equations you can link to, "Fig. 3" references that scroll to the figure, a references list, a revision date.
- The print stylesheet stops being an extra and becomes the point: every page prints as a clean two-column preprint. A "PDF" link beside the title, like arXiv's.
- **Cite this.** Each project and paper gets a BibTeX snippet. Nobody else's portfolio has one; every physicist's page should.
- "Last revised" on the home page is filled from the last git commit at build time, so the site can never look abandoned.

**Risk.** Done literally (Computer Modern, two columns, grey), it is a costume and looks like every LaTeX-CSS theme. The idea to take is the *structure* (abstract, numbering, references, revision date), set in your own typography, not a pastiche of LaTeX.

**Fit to brief.** Highest of all directions. Minimalist, focused, clutter-free are properties the format already has.

---

## Direction B — Paper and blackboard

**Replace "light and dark theme" with two real surfaces: ink on paper, chalk on a blackboard.**

The current palette is neutral grey with a corporate blue accent (`#0047AB`). It belongs to no one. A physicist works on two surfaces, and they map exactly onto the two themes you already have:

| | Light: paper | Dark: blackboard |
|---|---|---|
| Ground | cool drafting white `#F7F9FA` | slate `#1B2321` (green-black, not grey) |
| Text | blue-black fountain ink `#1C2740` | chalk `#E9E6DC` |
| Construction | non-photo blue `#9FD4E6` | faint chalk-smear `#3A4744` |
| Mark (one accent) | red pencil `#C8372D` | yellow chalk `#E8C95A` |

- **Non-photo blue** is the pencil colour draftsmen and illustrators use for guidelines that are not meant to reproduce. Use it for exactly that: the baseline grid, margin rule, figure frames, axis-like tick marks at section starts. Showing the construction lines is the most literal possible meaning of "handbuilt", and it is quiet.
- **Red pencil / yellow chalk** is the single accent, reserved for one job: your own annotations (margin notes, corrections, "this is the important line").
- In blackboard mode the signature and hand-drawn strokes get a chalk texture (one SVG `feTurbulence` displacement filter, no images). The theme toggle is no longer a sun/moon icon; it is the act of switching surface. The transition could be an eraser wipe, once, as the site's one authored moment.
- Avoids the two palettes every generated site lands on (cream with terracotta; near-black with acid green). Cool white with blue-black ink and slate with chalk are specific to *this* subject.

**Risk.** Blackboard green can turn into a school-play set. It has to be very dark and nearly neutral (the value above is close to black with a green cast), with texture only on handwriting, never on body text. Chalk filter on long text would be unreadable; restrict it to strokes.

---

## Direction C — The margin

**Kill every floating object. All chrome lives in one margin column, the way notes live in the margin of a notebook.**

```
┌────────────┬─────────────────────────────────────────────┐
│            │                                             │
│  Rajnoor   │  Heimdall                                   │
│  ~~~~~~~   │  A runner for Monte Carlo studies           │
│            │                                             │
│  Work      │  In short. Heimdall runs Monte Carlo …      │
│  Papers    │                                             │
│  About     │  1 The problem                              │
│            │  FIFO chains deadlock when a writer dies    │
│  ───────   │  before opening its pipe …                  │
│  1 Problem │                                             │
│ ▸2 Model   │                  ┌───────────────────────┐  │
│  3 Reruns  │  this cost me ←  │  Fig. 2               │  │
│            │  a week          └───────────────────────┘  │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
   margin: nav, TOC, sidenotes, dates, your handwriting
```

- One hairline (in non-photo blue, or a notebook's red margin line) separates margin from text. Left of it: the signature, three nav words, the section list, and **sidenotes**.
- **Sidenotes instead of footnotes**, placed beside the sentence they belong to (Tufte's layout). In a maths write-up this is where "why this step works" and "I got this wrong the first time" go. It is also where your voice lives; the Now page's hidden descriptions show you have one.
- A few margin notes in **your actual handwriting**: write them on paper or a tablet, export as SVG paths, same pipeline as the signature. Five or six per article, not a handwriting font. This replaces Edu SA Beginner with the real thing.
- The pill, page console, scroll arc, and corner system all dissolve into this one column. Nothing overlaps text, on any screen. On mobile the margin collapses to a single line at the top and sidenotes drop inline.

**Risk.** Sidenotes need writing; an empty margin is just a sidebar. And a fixed left column is a conventional docs-site layout unless the handwriting and construction lines make it yours.

---

## Direction D — The event

**The home page shows a particle collision. A real one, from your own runs.**

The most characteristic image in your world is a collision event: tracks spraying from a vertex and curling in a magnetic field. Bubble-chamber photographs are among the most beautiful images physics has produced, and they are *drawn in thin lines on an empty ground*, which is your aesthetic already.

```
┌──────────────────────────────────────────────────────────┐
│                                         ╭─╮              │
│                    ╭──────╮            ╱   ╲             │
│          ╲        ╱        ╲   ╱──────╯     │            │
│           ╲      │    ·─────╳─╱             ╰─ Work      │
│  Papers ───╲─────┼───╱     ╱ ╲                           │
│             ╲    ╰──╯     ╱   ╲──────────────── About    │
│                          ╱                               │
│   Rajnoor Brar          ╱        event 48 213 · pp 13 TeV│
│   physics, IIT Mandi            Pythia 8 via Heimdall    │
└──────────────────────────────────────────────────────────┘
```

- Export a few hundred events from Heimdall as small JSON (track origin, momentum, charge). The page picks one, draws the tracks stroke by stroke in ink, and labels it honestly: generator, energy, event number. Every visit shows a different event. Click anywhere for another.
- Three of the hardest tracks terminate in the three nav words. The navigation is part of the picture.
- It is the opposite of a gimmick *if it is real data*: it shows, in the first second, that you simulate collisions, and it is made with the tool the site is about to describe. A fake random scribble would be decoration; a labelled Pythia event is a figure.
- Costs about a hundred lines of JS and one data file. Reduced motion: draw it instantly. No JS: a static SVG of one event.
- This replaces "getting things done" and the typed name. One authored moment, and it is about the subject.

**Risk.** The largest of any direction: a striking hero raises expectations the rest of the site must meet, and tracks ending on nav links could be illegible on a phone (there, draw the event above a plain list). It is also the only idea here that needs new data plumbing.

---

## Smaller subversions (combine with any direction)

**Sign at the bottom.** Signatures go at the end of documents. Move the signature from a floating pill to the foot of every page, where it draws itself as the reader arrives: the sign-off on a letter or a notebook entry. Navigation becomes plain words at the top. The authored moment becomes a reward for reading to the end rather than a toll at the door.

**Sliders on the physics, not on the font.** The site has sliders for text size and figure width. It should have sliders for *b* and *c*. In the ellipsoidal-channel article, let the reader drag the minor axis and watch the envelope change in an SVG; in a Heimdall or Brookhaven page, toggle PDF sets and watch the curve move against data. One live figure per article is worth more than every page-console control, and it is the same engineering effort already spent.

**Three scripts.** You are native in Punjabi and fluent in Hindi. The name, handwritten, in Gurmukhi, Devanagari and Latin: ਰਾਜਨੂਰ, राजनूर, Rajnoor. As the hero, or as the signature cycling slowly between them. No template in the world has this; it is specific to one person. (Only if you actually write all three by hand. A font would defeat the point.)

**The cat has a job.** The line-drawn cat appears on 404 and as the favicon and nowhere else. Make it the site's one recurring character: asleep at the top of an article, awake by the end (replacing the scroll arc), looking at the newest item on the home page, sitting in the margin of the Now section. One small drawing per page type, same pen. Restraint is the difficulty: one cat per page, never animated more than once.

**Now, from the repo.** The Now page is six months stale because it depends on you remembering. Generate it: a scheduled daily build reads your public GitHub activity and writes "last pushed to Heimdall two days ago; 14 commits this week". Keep one hand-written line above it. It cannot go stale.

**View source is a page.** For a hand-written site, the source is part of the work. Keep the HTML readable, put a comment at the top addressed to the person reading it, and link "source" in the colophon. Publish the page weight there too ("this page: 38 KB, no JavaScript"). That is a claim most sites cannot make and a discipline that enforces the brief.

**Errata.** Each article carries a dated list of corrections. It is how science handles being wrong, almost no personal site does it, and it tells a reader more about your rigour than the phrase "scientific rigour" on the home page does.

---

## The pick

If only one thing changes: **A, the preprint structure.** It fixes the home page, the navigation, the thin About, the papers-under-credentials problem and the title blocks in one move, and it costs mostly deletion.

The version I would actually build, in order of nerve required:

1. **A + C**: preprint structure with one margin column. All floating chrome gone. Three typefaces.
2. **+ B**: paper and blackboard as the two themes, non-photo-blue construction lines, one red-pencil accent.
3. **+ sign at the bottom, sliders on the physics, errata, cite-this.**
4. **+ D**: the event as the home page, once Heimdall can export the data.

What this costs you: the pill-as-menu, the corner system, spotlight, the shortcuts overlay, the page console, toasts, SPA navigation, Bootstrap, four typefaces, two pages. Roughly two-thirds of the current CSS and JS. That is the honest price, and I think it is the right trade: the current site demonstrates that you can build interface machinery; this one would demonstrate that you are a physicist who writes clearly and draws by hand. Only one of those is rare.

**What I would not do:** a Schrödinger's-cat joke on the 404 (the existing line is better and the joke is the first one everyone reaches for), LaTeX-lookalike fonts, paper textures or ruled-line backgrounds as images, or any second animated moment beyond the one you choose.
