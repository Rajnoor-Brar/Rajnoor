# Rajnoor

Personal site — [rajnoor.in](https://rajnoor.in/). Hugo static site, deployed to GitHub Pages.

## Build

Requires **Hugo 0.128.0 Extended** (Extended is needed for Dart Sass).

```bash
hugo server                                            # local dev with live reload
hugo --minify --baseURL "https://rajnoor.in/"          # production build (matches CI)
```


## Deploy

`.github/workflows/hugo.yml` builds and deploys to GitHub Pages on every push to `main`.

## Layout

- `content/` — page content (HTML with YAML frontmatter, not Markdown)
- `layouts/` — templates, partials, shortcodes
- `assets/css/`, `assets/js/` — Hugo Pipes-managed global and per-page asset pairs
- `static/` — passthrough files such as resources, favicon, and `CNAME`
- `data/` — YAML data files (`credentials.yaml`, `now.yaml`, `projectGroups.yaml`) rendered into pages via shortcodes/partials
