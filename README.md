# acupuncturemoniquestarnault.com

Static site for Acupuncture Monique St-Arnault (Montréal). It is a static HTML
export of a WordPress/Elementor site, served by **GitHub Pages** at the custom
domain in [CNAME](CNAME).

## How it deploys

Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. **check** job — `node --check translate.js` (JS syntax) and an offline
   internal-link check (lychee) over all HTML files. A failure blocks deploy.
2. **deploy** job — uploads the repo as-is to GitHub Pages.

There is no build step: what is in the repo is what is served.

## Pages

- `/` — home, `/blog/` — article index
- Articles: `/le-printemps/`, `/les-allergies-du-printemps/`, `/le-tao/`
  (`/elementor-390/` is a redirect stub kept for old links)
- `/category/*`, `/tag/*` — archive pages

Because the host is static, WordPress features that need a server (comments,
search, admin-ajax) do not work and have been removed from the pages.

## FR / EN language toggle — `translate.js`

[translate.js](translate.js) injects a FR|EN pill into the header menu and the
footer, and swaps visible French text to English client-side. How it works:

- `T.common` holds strings shared by all pages; `T['/path/']` holds strings for
  one page, keyed by the **exact French text** (after normalization: curly
  apostrophes unified, non-breaking spaces → spaces — see `norm()`).
- The chosen language persists in `localStorage` under `msa-lang`.

**Maintenance rules:**

- If you edit French copy in an HTML page, update the matching key in
  `translate.js`, otherwise that block silently stays French in EN mode.
- After any edit, run `node --check translate.js` (CI does this too). Beware of
  editors that auto-convert straight quotes to typographic quotes — that has
  broken the script before.

## Pre-rendered English pages — `/en/`

The 5 main pages have static English copies under `en/`, generated from the
French pages plus the `translate.js` table, with `hreflang` alternate links on
both versions so search engines index the English content. The FR|EN pill
navigates between the two URL trees on these pages (and still translates
in place on archive pages that have no `/en/` copy).

**After editing French copy or translations, regenerate:**

```
node tools/build-en.js
```

This rewrites the `en/` pages and refreshes the hreflang tags. Commit the
result. Don't edit files under `en/` by hand.

## Tools

- `node tools/build-llms-full.js` — regenerates `llms-full.txt` (the English
  content digest for AI crawlers, built from translate.js). `llms.txt` is the
  hand-maintained summary; update it when pages/services change.
- `node tools/purge-unused-assets.js` — lists files under `wp-content/` and
  `wp-includes/` that no page references (directly, or via CSS `url()` /
  Elementor webpack lazy chunks). Add `--delete` to remove them. Useful after
  re-exporting from WordPress, which dumps entire plugin source trees.
