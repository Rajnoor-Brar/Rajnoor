# 8. Small pages: About, Now, 404, Notebook

## About

**Thin.** A heading, two lines ("Master's student in Physics at IIT Mandi / I write code and crunch numbers as well."), four link chips, and "© 2026 Rajnoor. All rights reserved." It is the emptiest About page it could be while still existing.

- The lede is in Edu SA Beginner at small size and low contrast; it is the only prose on the page and it is the hardest text to read.
- Four chips of equal weight: GitHub, LinkedIn, Email, Instagram. For a reader evaluating your work, GitHub and email matter; Instagram is a different audience. Order by what you want clicked, and consider dropping Instagram from a professional page.
- The email is behind a `mailto:` icon only. Show the address as text so it can be read and copied.
- The copyright line is the last thing on your About page and the only footer on the site. "All rights reserved" on a personal page with open-source projects is a slightly odd note; a hidden "Built with Hugo" credit sits next to it (`d-none`). Either show a one-line colophon ("Hand-written HTML and CSS, built with Hugo, source on GitHub"), which suits the handbuilt brief very well, or show nothing.

**Expand here.** This page should absorb Now, education and languages (points 3 and 7), and gain two short paragraphs in your own voice.

*Not verified:* my screenshot caught the page mostly faded out three seconds after load. Likely the same frozen-animation artefact as the signature (plan limits), but check that About does not depend on an entrance animation to be readable.

## Now

**Thin and stale.** Two rows ("learning: ML and Rust", "exploring: High Energy Physics") under "UPDATED MAY 2026." It is November. A Now page that is six months old says the opposite of what it is for. Three more items are commented out in `now.yaml`.

- The list is set in Quicksand, a face used nowhere else.
- Each row's description is hidden in a `<details>`; nothing on the row signals that it expands.
- The descriptions are the human part ("I guess it's time to open the youtube") and they are hidden; the visible part is generic.

**Opinion.** As in point 3: make it a dated section on About, show the descriptions, and commit to updating it or remove it. The data file can stay.

## 404

**Good.** The best small page on the site. A large "404", the line-drawn cat, "Correct house. Wrong room. Try knocking another door." It has personality, it is short, and the link opens spotlight. This is the tone the home page should have.

- "Page not found :(" in bold between the cat and the good line is the weakest element; the cat and "Correct house. Wrong room." already say it. Remove one accessory.
- In dark mode the cat is very low contrast (dark grey line on near-black). Lift it a step.
- "another door" opens spotlight, which depends on JS and on an index with five entries. A plain link home beside it is the safe fallback.

## Notebook

**Off (flag false), but published.** List page and one placeholder entry ("Entries are short and honest. No polish required.") are built, in the sitemap, and reachable. The list design (date column, title, one-line description, hairline) is clean and is the pattern the projects list should borrow (point 6).

**Opinion.** Unpublish until there are three real entries. When it launches, it is the natural home for the small things that make a personal site feel alive: a derivation, a tool note, a plot. That would do more for "handbuilt" than any animation.
