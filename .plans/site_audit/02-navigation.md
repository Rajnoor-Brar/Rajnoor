# 2. Navigation and global chrome

## What exists

One fixed island: the signature pill. Hover or focus expands it to the full "Rajnoor" signature plus a link panel (Home, Projects, Credentials, About, Now) and an action row (theme, `?`, a 2×2 corner picker). It can be dragged, thrown, arrow-keyed or dot-clicked to any corner. Spotlight search opens on Shift+Space. A `?` overlay lists shortcuts.

## Findings

### Off-brief: the site's main navigation is a puzzle

The pill is a strong idea and the most "handbuilt" thing here. But it is the *only* navigation, and it is a single letter with no label. Combined with a home page that has no links (point 1), a first-time visitor on desktop must guess to hover the "R"; a visitor who doesn't leaves having seen one screen. The discover-pulse ring is an admission that the control is not discoverable.

**Opinion.** Keep the pill. Fix discoverability with content, not more animation: put plain text links on the home page, and the pill becomes a pleasant shortcut instead of a gate.

### Off-brief: the corner system is the most over-built feature on the site

Moving the nav to another corner is supported four ways (drag, throw, arrow keys, mini-map), with its own persistence keys, a shortcuts-overlay section, drag targets and about 170 lines in `31-nav-position.js` plus interaction code. The benefit to a visitor reading a five-page site is close to zero; most will never know it exists. It also costs a third of the action row.

**Opinion.** This is the clearest cut on the site. If you love it, keep drag only (it is the one a person might find by accident) and remove the mini-map, the arrow keys, and the "Signature open" block from the shortcuts overlay. That frees the action row for something useful (search).

### Thin: spotlight has no visible entry point

Spotlight opens only from Shift+Space (and the 404 link). There is no search button in the action row, and no placeholder text in the input, so a touch user cannot reach it at all and a mouse user has to read the `?` overlay first. Shift+Space is also an unusual choice: in browsers it scrolls the page up, and the convention people try is `/` or Cmd/Ctrl+K.

With the current site (three visible content pages plus About/Now/Credentials), search has almost nothing to search. It is infrastructure ahead of content.

**Opinion.** Either put a search icon in the action row where the corner picker is and add `/` as a second key, or switch the flag off until there are ten or more pages. Do not leave it as a hidden feature.

### Rough: the open tray covers content without separating from it

On the home page the open panel sits over the bio text; "Mastering Physics" shows half-clipped beneath the panel edge and the action row floats over line 2. The panels are translucent with blur, so text ghosts through. It reads as a rendering glitch. A slightly more opaque panel, or dimming the page behind while open, would fix it.

### Rough: the nav is invisible at first paint by construction

`#signature-panel` starts at `opacity: 0` and depends on a 1.75 s ease-in-out `fadeIn` to become visible. With that curve it is under half opacity for most of the first second of every hard load, on every page. If the animation never runs (I saw exactly this in a hidden tab: opacity stayed 0), there is no navigation at all. *Timing not observed live.*

**Opinion.** Render it visible, and animate only the stroke draw. The only chrome should not be gated on an animation.

### Rough: shortcuts overlay

Clean and well made. But five rows, of which one ("Signature open: move to corner") documents the feature recommended for cutting, and one documents itself. If the corner keys go, this overlay is four lines and could be dropped in favour of a `title` on the theme button and a placeholder in spotlight. Fewer features to explain is the minimalist answer.

### Good and worth keeping

- The signature as logo, home link and menu in one object. It is distinctive and yours.
- Skip link, `aria-label`s on every control, and focus management are present.
- Active-page rail in the link panel is quiet and correct.
