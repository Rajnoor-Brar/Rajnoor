# 1. First impression and the home page

## What happens

Hard load: an outlined "getting things done" is drawn in calligraphy, erased, then "I'm Rajnoor" is typed at the right edge with a caret, three bio lines appear at the left edge, and a one-line Now snippet sits at the bottom. The signature pill (top-left) is the only chrome. On a return visit within 12 hours the intro is skipped (`rj_hero_seen_at`).

## Findings

### Off-brief: the first screen says nothing about what you do or have made

After the intro, the page is a name and three sentences. No link to a project, no hint that projects exist, no image. The only way forward is to discover that the "R" in the corner is a menu. For a site whose purpose is to show work, the home page shows none.

The copy is the weakest part of the whole site:

- "Mastering Physics at IIT Mandi": a pun on Master's that reads as a claim to have mastered physics.
- "while also exploring the depths of Mathematics and Computation as a personal venture"
- "I am a dedicated learner driven by a relentless pursuit of knowledge and a commitment to innovative thinking and scientific rigour."

The third line is cover-letter filler. It could describe anyone, so it describes no one. The About page has the better line ("I write code and crunch numbers as well"), and the Heimdall draft has the real material: you built a Monte Carlo study runner and published two papers on laser–plasma interaction. None of that reaches the home page.

**Opinion.** Cut line 3. Rewrite the rest as two plain facts, for example: "Physics master's student at IIT Mandi. I build tools for particle-physics simulation and write up the maths behind them." Then give the page one way forward: the two or three project titles as plain text links under the bio. That is still minimalist; a page with nothing to click is merely empty.

### Off-brief: the intro delays the content by about ten seconds

"getting things done" draws and undraws (`hero-draw: 3.8s`, `hero-fill: 2s`), then the name types, then the lines fade. In my run the bio was not on screen at 8 s and was at 13 s (timing unreliable, see plan limits, but the tokens alone put it past 6 s). A slogan about getting things done that makes the visitor wait is working against itself. The phrase also has no connection to anything else on the site.

**Opinion.** Keep one handmade moment, not two. The signature pill already draws your "R" by hand on every page; that is the site's identity. Either drop the calligraphy intro entirely and type the name immediately, or keep the calligraphy and drop the typing. If the intro stays, it needs a skip on any key, click or scroll, and should not exceed about 2.5 s.

### Rough: the composition is unanchored

- "I'm Rajnoor" is right-aligned against the viewport edge; the bio is left-aligned against the opposite edge. At 1024 px they share no axis, and at 1440+ the gap grows. It reads as two unrelated blocks.
- Bio lines run the full viewport width (921 px measured at 1024). Line 3 is one 130-character line at 14.4 px. On a wide monitor that is far past a readable measure.
- Sizes: 88 px heading, 23 px first line, 14.4 px for the rest. The jump from 88 to 14 with nothing between makes the bio look like a footnote.
- The caret keeps blinking forever beside the name. After typing ends it is a distraction with no meaning.

**Opinion.** Pick one edge. Left-align the name and bio on a shared left margin, cap the bio at about 34rem, raise the small lines to about 1.1rem, and stop the caret a couple of seconds after typing ends.

### Rough: the Now snippet

"*learning* ML and Rust · *exploring* High Energy Physics" at about 11 px, centred at the very bottom, in a third alignment. Descriptions are only in a `title` tooltip, which touch users never see. The idea is good (a live, small, human line); the execution makes it look like a footer disclaimer. Put it under the bio in the same column, at readable size.

### Good and worth keeping

- The 12-hour skip of the intro is the right instinct: ceremony once, not every visit.
- The `<noscript>` fallback that reveals the bio is careful work most personal sites skip.
