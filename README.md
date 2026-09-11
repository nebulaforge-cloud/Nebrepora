# Nebrepora

A signal board for early tech and open-source breakthroughs. It scores **organic velocity** (1–100), not star counts, for repos, papers, tools, and web products that matter to a game/tech studio.

Departments: **Engineering · Game UI/UX · Art · Other engineering**, plus a studio-wide **All** view grouped into department lanes.

## Features

- Department cards and All-view section lanes with counts
- Category, kind, search, and sort filters that work together
- **Run scan** (`s`) adds up to 3 unseen signals matching the scan focus and the current department/category
- **Deep inspect** (`i`) uses cached analysis, falls back gracefully for unknown URLs, keeps a recent-inspections list, and exports markdown
- Shortlist of up to 4 pins, saved in `localStorage`, with a compare table from 2 pins up
- Pulse digest of the top 3 signals by score
- Export (`e`) downloads `nebrepora-briefing.md` and `nebrepora-briefing.json` for the filtered set
- Scoring guide (`?`) and search shortcut (`/`)

## Stack

One static `index.html` (vanilla HTML/CSS/JS) with no build step, no backend, and no API key.

## Run locally

```bash
npx serve .
```

## Deploy (Netlify)

`netlify.toml` publishes the repo root as a static site with SPA fallback.

1. Netlify → **Add new site → Import from Git** → pick `nebulaforge-cloud/Nebrepora`. Leave the build command empty and set the publish directory to `.`.
2. **Domain management → Add a domain** → enter your subdomain (e.g. `nebrepora.example.com`).
3. At your DNS provider, add a `CNAME` record for `nebrepora` pointing to `<your-site>.netlify.app`.
4. Netlify issues the Let's Encrypt certificate automatically once DNS resolves.
5. Keep visitor access public (no SSO/password protection) so the board is reachable.

## Spec

See [`docs/GITPULSE_HANDBOOK.md`](docs/GITPULSE_HANDBOOK.md) for the original product handbook (the product was formerly called GitPulse).
