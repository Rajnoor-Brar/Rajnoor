# 10. Mobile

Checked in Chromium emulation at 375×812 (touch UA). Not checked on a real phone or in Safari.

## Findings

### Broken: the signature pill floats over article text

On the project article, while scrolling, the pill (about 80×80 px, translucent) sits on top of the first words of each line: "T͟o simpli­fy" is unreadable beneath it. The article has no top or side clearance for it on a narrow screen, and the pill does not hide on scroll. The same happens on Credentials, where it overlaps the bottom of a publication card. For the one page type meant for long reading, a permanent 80 px object over the text is a real defect.

**Opinion.** On small screens, hide the pill on scroll down and show it on scroll up (the common pattern), or shrink it to about 44 px and reduce its opacity while scrolling.

### Broken: the page console is cut off by the screen edge

On the article at the top of the page the collapsed console renders as a wide pill running off the right edge with only the chevron visible; while scrolling it is a half-circle stuck to the edge. It reads as an overflow bug even if the tuck is intended. Combined with the pill, two floating objects sit over a 375 px reading column. With the sliders cut (point 5), the mobile console has no reason to exist; put the TOC behind the signature menu or at the top of the article.

### Off-brief: large dead space at the top of every page

Projects opens with about 130 px of nothing, then the filter row. Credentials opens with about 100 px of nothing before "Publications". The spacer reserves room for the pill, but the pill only occupies the left 90 px. On a phone the first screen should start with content.

### Thin: features that do not exist on touch

- **Spotlight**: keyboard-only (Shift+Space). No way to open it on a phone.
- **Shortcuts overlay**: reachable from the `?` button but describes keys a phone does not have.
- **Now snippet descriptions**: in `title` tooltips; never shown on touch.
- **Hover-to-open nav**: on touch the pill needs a tap; in my test the first tap coincided with the fade-in so I could not confirm the tray opens on first tap. *Verify on a real phone.*

**Opinion.** Hide the `?` button on coarse pointers. Give spotlight a button or drop it (point 2).

### Rough: home

Reads better on mobile than desktop, because the narrow screen forces the name and bio onto one axis. Issues: the name fills the full width edge to edge with no margin; the caret touches the screen edge; only one Now item shows; the bottom third of the first screen is empty.

### Rough: article

- Body at about 19 px with justified, hyphenated text in a 36-character column: the hyphenation problem from point 5 at its worst.
- The article panel border plus figure borders cost about 34 px of horizontal space on a 375 px screen. Drop the panel frame on mobile so text can use the width.
- Figure images are small inside their frames (the first is about 145 px wide in a 315 px frame).

### Rough: credentials

Skill and language pills go two-across with an orphan centred below (2+1, 2+2+1). Centred orphans look like a layout accident. Publication cards are full-width and very long because of the abstracts: two cards take about three screens before the reader reaches anything else.

### Good and worth keeping

- No horizontal overflow on any page (`scrollWidth == innerWidth` everywhere I checked).
- Separate persistence key for the mobile console state shows the small-screen case was thought about.
- The projects card at full width looks better on mobile than the desktop grid does.
