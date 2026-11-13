# 9. Motion and feedback

**Caveat.** Animations did not advance in my browser session (hidden pane), so this point is judged from tokens, CSS and static frames, not from watching the motion. Treat feel-based opinions as lower confidence than the rest of the audit.

## What exists

- Home: calligraphy draw and undraw, typed name with caret, staggered bio lines.
- Signature: fade-in, stroke write-on, discover-pulse ring, expand on hover, corner-shift on drag.
- Page loader spinner and shimmer; SPA page swaps.
- Scroll arc.
- Toasts for: theme change, filter results, filters cleared, no matches, slider reset, code copied, copy failed, page tools collapsed/expanded, search ready, search errors, image load failure, skill level.
- Hover: grow-and-track on text links, lift-and-shadow on cards, glow on icons.

## Findings

### Off-brief: too many things announce themselves

The brief says clutter-free and focused. The motion inventory is long for a site with five pages. The design principle that would fit the brief: **one authored moment, and everything else instant.** At the moment there are at least four authored moments on first visit (calligraphy, typing, signature write-on, discover-pulse), in sequence.

**Opinion.** The signature write-on is the keeper; it is your hand, it is small, and it is on every page. Demote or cut the rest (point 1).

### Off-brief: toasts confirm things the user can already see

A toast is for something that happened out of sight. Most of these report what is in front of the user:

| Toast | Already visible because |
|---|---|
| "Theme: Dark" | The whole page changed colour |
| "Page tools collapsed / expanded" | The panel just collapsed |
| "1 project shown" / "Filters cleared" | The list just changed |
| "Text size reset" | The text just resized |
| Skill level word | Should be on the pill, not in a toast |

Keep toasts for failures only (copy failed, search index failed, image failed). "Code copied" is borderline; an in-place label change is quieter. This removes a category of noise and most of the toast variants in `data/toast.yaml`.

### Rough: hover grow with letter-spacing

`.hover-grow` scales text 1.05 and adds 0.05em tracking. Changing letter-spacing on hover reflows the word and nudges neighbours; scale on text makes it blur briefly. It is the kind of effect that feels lively in isolation and fidgety in a nav list. An underline or the existing active rail would be calmer. CLAUDE.md says "no colour changes on hover", which leaves size and glow as the only signals; a plain underline is within the rules and more legible.

### Rough: SPA navigation is a large mechanism for a small gain

`60-spa-navigation.js` (344 lines) swaps page content, syncs per-page fonts, styles and library scripts, re-runs math and highlighting, and requires every module to honour a cleanup contract. The benefit is keeping the signature pill from redrawing between pages. On a static site with small pages, native navigation is already near-instant, and cross-document View Transitions (`@view-transition { navigation: auto }`) would give a fade with zero JS in current Chromium and Safari. The custom router is the largest source of possible state bugs on the site (consume-once cleanup, library sync) for an effect most visitors will not notice.

**Opinion.** Not urgent, since it works. But it is the first thing to delete if the JS is ever simplified, and no new feature should be built on top of it.

### Good and worth keeping

- `prefers-reduced-motion` is handled in eleven places, with a global short-circuit. Thorough.
- Motion durations are tokenised; retuning the whole site is a data-file edit.
- Transforms and opacity are used instead of layout properties.
