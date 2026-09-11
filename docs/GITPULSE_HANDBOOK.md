# GitPulse — Rebuild Handbook

Hand this file to Claude (or any coding agent) and say: **build GitPulse from this handbook**.

This is the single source of truth for the product: original spec, what actually shipped, later additions, bugs that bit us, and how to rebuild either the **standalone demo SPA** or the **full FastAPI + dashboard** stack.

---

## 1. What GitPulse is

GitPulse is a **signal board** for early tech and open-source breakthroughs.

It is not a star counter. It scores **organic velocity** (1–100) for repos, papers, tools, and web products that matter to a game/tech studio across four departments:

| Dept id | Display name | Scope |
|---|---|---|
| `Engineering` | Engineering | Compilers, systems, data, AI infra, fullstack, databases, general devtools |
| `Game UI/UX` | Game UI / UX | HUD, menus, interaction, game feel, accessibility, immediate-mode UI, engine UI |
| `Art` | Art | Pixel, 3D, VFX, look-dev, DCC, skeletal 2D, asset kits |
| `Other Eng` | Other engineering | Audio, live-ops, tools, QA, platform, build, source control |

Plus a virtual filter: **`All`** — studio-wide board.

**Promise of the product:** spot high-potential tools before they go viral, shortlist them, inspect them, export a briefing.

**Visual language:** dark Linear / Vercel. Ink background `#09090b`, panel `#111113`, line `#27272a`, text `#fafafa`, muted `#a1a1aa`, mint `#5eead4`, amber `#fbbf24`, rose `#fb7185`. Fonts: Instrument Sans + IBM Plex Mono.

---

## 2. Two build targets (pick one, or ship both)

### Target A — Launchable demo (what is live today)

A **single-file SPA**: `index.html` with embedded CSS + JS. No build step. Deploy to Netlify as a static site.

- Seeded `WATCHLIST` always visible.
- `Run scan` pulls 1–3 items from `SCAN_POOL` (simulated live scan).
- Deep inspect uses a pre-cached `INSPECT` map.
- Pins persist in `localStorage` key `gp-pins` (max 4).
- Filters: department cards, category chips, kind chips, search, sort.

**This is the version to ship first.** It always renders. It does not depend on an API key or a sidecar.

### Target B — Full engine (original spec, not currently the public site)

- **Engine:** FastAPI + uvicorn on `127.0.0.1:8000`
- **Dashboard:** React + TanStack Start + Vite on `0.0.0.0:8080`
- **LLM:** xAI Grok Responses API, model `grok-4.6`, with live web + X search
- **Store:** SQLite locally, PGLite fallback
- Scan window: last **72 hours**
- Engine returns **strict JSON** signals
- Dashboard consumes `/signals`, `/scan`, `/inspect`

**Critical lesson:** do **not** serve a JSON homepage from FastAPI on `/`. Preview proxies and Netlify discovery will show `{ "service": "gitpulse-engine" }` instead of the dashboard. Engine root `GET /` must 404 or redirect. Health lives at `GET /health`. Dashboard is the only thing on port 8080 and on the public host.

---

## 3. Original product spec (keep this if building Target B)

### 3.1 Engine job

Find early tech / open-source breakthroughs in a **72-hour** window.

For each signal emit:

```json
{
  "id": "slug",
  "name": "Project name",
  "url": "https://github.com/org/repo",
  "hook": "One sentence why a builder should care.",
  "tech": "One sentence of the actual technical leap.",
  "score": 84,
  "sentiment": "What builders are actually saying.",
  "category": "Compilers",
  "dept": "Engineering",
  "kind": "Repo",
  "source": "live_scan",
  "citations": ["domain.tld", "github.com/org/repo"],
  "first_seen": "2026-09-10T12:00:00Z"
}
```

`score` is **organic velocity 1–100**, not star count.

| Band | Label | Meaning |
|---|---|---|
| 80–100 | High signal | Sharp technical leap, real builder chatter, not launch-week noise |
| 50–79 | Building | Credible momentum, still proving itself |
| 1–49 | Watch | Interesting, not yet a breakout |

Ignore: launch-week marketing, star-bombing, “just hit 1k stars” posts with no technical substance.

### 3.2 Suggested FastAPI routes

| Method | Path | Role |
|---|---|---|
| GET | `/health` | `{ ok: true, service: "gitpulse-engine" }` |
| GET | `/signals` | Current board (watchlist + last scan), query: `dept`, `category`, `kind`, `q` |
| POST | `/scan` | Body `{ "focus": "rust compilers" }` — Grok live search, merge into store |
| GET | `/inspect?url=` or POST `/inspect` | Deep dive on one project |
| GET | `/export?format=md\|json` | Briefing of current filtered set |

Do **not** implement `GET /` as a JSON banner.

### 3.3 Grok scan prompt (engine)

System:

> You are GitPulse, an analyst for a game + systems studio. Find early technical breakthroughs from the last 72 hours across GitHub, papers, and builder discussion on X. Score organic velocity 1–100. Tag department and category. Return ONLY a JSON array of signals matching the schema. No markdown fences.

User (example):

> Focus: {focus}. Departments: Engineering, Game UI/UX, Art, Other Eng. Prefer repos and tools a studio would actually adopt. Cite sources. Skip hype with no technical hook.

Require structured output. Validate every item before insert. Cap a scan at ~8 new rows.

### 3.4 Grok inspect prompt

> Deep-inspect {name} at {url}. Stars (approx), category, 2–4 sentence analysis of why it matters now, 2–5 competitors, adoption risk. JSON only.

---

## 4. What shipped (Target A — current `index.html`)

Single file: `index.html`.

### 4.1 Layout

```
header (eyebrow, H1 GitPulse, sub, actions: Scoring / Export / Inspect / Run scan)
department card grid
search + scan focus + sort
category chips
kind chips
pulse digest (top 3 by score)
shortlist panel (pins + compare table when ≥2)
signal board
  All view  → stacked department sections
  One dept  → flat card grid
footer + shortcuts
inspect dialog
scoring guide dialog
toast
```

### 4.2 Department cards

```js
const DEPTS = [
  {id:"All", name:"All departments", blurb:"Studio-wide signal board."},
  {id:"Engineering", name:"Engineering", blurb:"Compilers, systems, data, AI infra, tooling."},
  {id:"Game UI/UX", name:"Game UI / UX", blurb:"HUD, menus, interaction, game feel, accessibility."},
  {id:"Art", name:"Art", blurb:"Pixel, 3D, VFX, pipelines, look-dev kits."},
  {id:"Other Eng", name:"Other engineering", blurb:"Audio, live-ops, tools, QA, platform, build."}
];
```

Clicking a dept sets `dept`, resets `category` to `All`, re-renders.

**All-departments view must group cards into section lanes** (this was the later “add section for gaming UI UX design ART and other engineering” request). Each lane has a heading + count + card grid. Order of lanes: Engineering → Game UI/UX → Art → Other Eng. Skip empty lanes.

### 4.3 Categories and kinds

```js
const CATS = ["All","AI/Infra","Compilers","Systems","FullStack","Database","DevTools","Game UI/UX","Art","Audio","LiveOps","Tools/QA"];
const KINDS = ["All","Repo","Paper","Web","Tool"];
```

When a department is selected, category chips shrink to `All` plus categories that exist in that dept’s items.

### 4.4 Seed watchlist (always on the board)

Use these exact rows or equivalent quality. Every item needs `id, name, url, hook, tech, score, sentiment, category, dept, kind, source:"watchlist", citations[]`.

**Engineering**

| id | name | url | score | category | kind |
|---|---|---|---|---|---|
| uv | uv | https://github.com/astral-sh/uv | 91 | DevTools | Repo |
| oxc | Oxc | https://github.com/oxc-project/oxc | 88 | Compilers | Repo |
| jj | Jujutsu (jj) | https://github.com/jj-vcs/jj | 84 | Systems | Repo |
| libsql | libSQL | https://github.com/tursodatabase/libsql | 82 | Database | Repo |
| zed | Zed | https://github.com/zed-industries/zed | 86 | DevTools | Repo |
| candle | Candle | https://github.com/huggingface/candle | 79 | AI/Infra | Repo |

**Game UI/UX**

| id | name | url | score | category | kind |
|---|---|---|---|---|---|
| dearimgui | Dear ImGui | https://github.com/ocornut/imgui | 87 | Game UI/UX | Repo |
| godot | Godot | https://github.com/godotengine/godot | 90 | Game UI/UX | Repo |
| r3f | React Three Fiber | https://github.com/pmndrs/react-three-fiber | 81 | Game UI/UX | Repo |
| bevy | Bevy | https://github.com/bevyengine/bevy | 85 | Game UI/UX | Repo |
| rive | Rive | https://github.com/rive-app/rive | 84 | Game UI/UX | Tool |
| figmakits | Figma game UI kits | https://www.figma.com/community | 74 | Game UI/UX | Tool |

Hooks (keep this voice — technical, studio-facing, not marketing):

- Dear ImGui — Immediate-mode UI that game tools and debug HUDs still ship on.
- Godot — Open engine with first-class Control nodes for game UI.
- R3F — Declarative 3D scenes for web game shells and 3D menus.
- Bevy — Rust ECS engine with a growing UI and rendering stack.
- Rive — Runtime motion for HUDs and diegetic menus.
- Figma kits — Production HUD frames before they hit the engine.

**Art**

| id | name | url | score | category | kind |
|---|---|---|---|---|---|
| aseprite | Aseprite | https://github.com/aseprite/aseprite | 88 | Art | Tool |
| blender | Blender | https://www.blender.org/ | 92 | Art | Tool |
| blockbench | Blockbench | https://github.com/JannisX11/blockbench | 78 | Art | Tool |
| spine | Spine | https://esotericsoftware.com/ | 80 | Art | Tool |
| mixamo | Mixamo | https://www.mixamo.com/ | 73 | Art | Tool |

**Other Eng**

| id | name | url | score | category | kind |
|---|---|---|---|---|---|
| wwise | Wwise | https://www.audiokinetic.com/en/wwise/ | 83 | Audio | Tool |
| playtestcloud | Playtest tooling notes / Oboe | https://github.com/google/oboe | 72 | Audio | Repo |
| sentry | Sentry | https://github.com/getsentry/sentry | 84 | LiveOps | Repo |
| fastbuild | FASTBuild | https://github.com/fastbuild/fastbuild | 76 | Tools/QA | Repo |
| perforce | Helix Core | https://www.perforce.com/products/helix-core | 81 | Tools/QA | Tool |

### 4.5 Scan pool (Run scan)

Items not on the initial board. Scan adds up to 3 that match the focus string + current dept/category.

| id | name | dept | category | kind |
|---|---|---|---|---|
| biome | Biome | Engineering | Compilers | Repo |
| ruff | Ruff | Engineering | DevTools | Repo |
| bun | Bun | Engineering | FullStack | Repo |
| nuklear | Nuklear | Game UI/UX | Game UI/UX | Repo |
| coherent | Coherent Gameface notes | Game UI/UX | Game UI/UX | Web |
| substance | Substance 3D notes | Art | Art | Tool |
| fmod | FMOD | Other Eng | Audio | Tool |
| gauntlet | Unreal Gauntlet | Other Eng | Tools/QA | Web |

Scan focus matching: lowercase token overlap against `name + hook + tech + category + dept`. If focus empty, any unused pool item is eligible.

Toast: `Scan added Biome, Ruff` or `Scan already current`.

### 4.6 Inspect cache

Keyed by `id`. Fields: `stars`, `category`, `analysis`, `competitors[]`.

If no cache: generate a fallback paragraph, do not error.

Inspect modal:

- Title Deep inspect
- Name + editable URL field
- Category · stars
- Analysis
- Competitors
- Recent inspections list (last 8, in-memory)
- Buttons: Analyze (re-run on URL field), Download md, Close

### 4.7 Card actions

- **Open** — `target=_blank` to `url`
- **Copy TL;DR** — `{name} — {hook}\n{tech}\n{url}` to clipboard + toast
- **Inspect** — open modal
- **Pin / Unpin** — max 4, persist `localStorage`

Velocity badge classes: `vel-high` (≥80 mint), `vel-mid` (≥50 amber), `vel-low` (zinc).

### 4.8 Digest and shortlist

Digest: top 3 of **all items** by score (not just filtered), name · score + hook.

Shortlist: `Shortlist n/4`. Names + scores. If ≥2 pins, render compare table: Project, Score, Dept, Kind, Category, Hook.

### 4.9 Export

Downloads two files:

- `gitpulse-briefing.md` — `# GitPulse briefing` plus `- **name** (score) — hook`
- `gitpulse-briefing.json` — filtered array

### 4.10 Keyboard

Ignore when focus is INPUT/TEXTAREA except Escape.

| Key | Action |
|---|---|
| `/` | focus search |
| `s` | run scan |
| `i` | inspect first / open inspect |
| `e` | export |
| `?` | scoring guide |

Search placeholder: `Search repo, hook, or breakthrough  (/ )`

---

## 5. UI implementation notes

Keep it vanilla for Target A. No React required.

Suggested CSS pieces already proven:

- `.wrap` max-width 1120px
- `.dept-grid` auto-fill minmax(200px, 1fr)
- `.dept-card` pressed state: mint border + dark teal fill
- `.board` auto-fill minmax(300px, 1fr)
- `.lane` wrapper for All-view sections with `.lane-head` (title + count)
- dialogs with `::backdrop` rgba(0,0,0,.65)
- toast fixed bottom-right

All-view render sketch:

```js
function renderBoard(list) {
  if (dept !== "All") {
    board.innerHTML = list.map(cardHTML).join("") || empty;
    bindCardActions();
    return;
  }
  const order = ["Engineering", "Game UI/UX", "Art", "Other Eng"];
  board.innerHTML = order.map(d => {
    const slice = list.filter(i => i.dept === d);
    if (!slice.length) return "";
    return `<section class="lane">
      <div class="lane-head"><h2>${d}</h2><span class="muted">${slice.length}</span></div>
      <div class="board">${slice.map(cardHTML).join("")}</div>
    </section>`;
  }).join("") || empty;
  bindCardActions();
}
```

Filter pipeline:

1. dept
2. category
3. kind
4. search across name, hook, tech, category, dept
5. sort: score desc | A–Z | category then score

---

## 6. Chronology of requests and fixes (do not regress these)

1. **Initial prompt** — production-ready GitPulse MVP: FastAPI Grok engine + React TanStack Start dashboard. Velocity badges, search, category/source/kind filters, Deep Inspect modal, copy TL;DR, GitHub links, watchlist, shortlist/compare, export MD/JSON, scoring guide, keyboard shortcuts, digest strip, citations, recent inspections, scan focus bias.
2. **“explain both add if any new features can be added”** then **“add all these”** — full analyst workflow on the board (digest, shortlist compare table, inspect history, export both formats).
3. **Unable to see dashboard / preview shows engine JSON** — FastAPI `GET /` stole the preview. Fix: remove engine homepage; health only on `/health`; dashboard is the public document.
4. **Not Found instead of launching GitPulse** — stale uvicorn / wrong root. Fix: engine 404 on `/`; startup checks `dashboard_ok` HTML; kill stale uvicorn.
5. **GitPulse missing from Apps** — deploy/target confusion. Public artifact is the static SPA.
6. **SSO lock on Netlify** (`gitpulse-w5aa` / `gitpulsenebula`) — `requireSSOTeamLogin` must be false for a public demo.
7. **Netlify MCP deploy 502 / 401** — flaky registry and token. Local `index.html` is the source of truth; retry deploy with clean npm cache + official registry when auth works.
8. **“add section for gaming UI UX design ART and other engineering department as well”** — not just chips. Dedicated dept cards + All-view **section lanes** + seeded signals for Game UI/UX, Art, Other Eng (audio/liveops/tools). Later extra seeds: Rive, Figma kits, Mixamo, Helix Core.

---

## 7. File map

### Target A (minimum)

```
gitpulse/
  index.html          # entire app
  GITPULSE_HANDBOOK.md
  netlify.toml        # optional, publish = "."
```

`netlify.toml`:

```toml
[build]
  publish = "."
  command = "echo static"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Do not put a FastAPI app on the same public origin as this HTML.

### Target B (full)

```
gitpulse/
  engine/
    main.py           # FastAPI
    prompts.py
    store.py          # SQLite
    models.py
  dashboard/          # TanStack Start + Vite + Tailwind
  startup.sh          # start engine :8000 then dashboard :8080
  GITPULSE_HANDBOOK.md
```

`startup.sh` rules:

- Bind engine to 127.0.0.1:8000 only
- Bind dashboard to 0.0.0.0:8080
- If something answers JSON at `/`, fail the health check
- Kill previous uvicorn on restart (`pkill -f uvicorn` or pid file)

---

## 8. Netlify / preview pitfalls

- Public demo sites used: `https://gitpulsenebula.netlify.app` and historically `https://gitpulse-w5aa.netlify.app`.
- Site id (nebula): `5d45728c-a91a-4d42-a095-4c75ffe2081d`
- Preview environments that proxy “the app” will pick the first HTTP service. If the engine listens on `/`, users see JSON or 404.
- Keep visitor access public (`requireSSOTeamLogin=false`) or the board looks “missing”.
- Deploy via Netlify MCP `deploy-site` or `npx @netlify/mcp` from the folder that contains `index.html`. 502 on npm registry and 401 on token have both happened; retry is expected.

---

## 9. Copy and tone

- Voice: analyst, not marketer.
- Hooks are one sentence of *why a studio lead would care*.
- Tech lines name the actual mechanism (CRDT, AST, Control nodes, geometry nodes, distributed compile).
- Sentiment is what builders are doing, not what a landing page claims.
- Title: `GitPulse`
- Eyebrow: `Signal board · live watchlist`
- Sub: `Signals across engineering, gaming UI/UX, art, and the other studio departments — velocity, citations, shortlist.`
- Footer: `Departments: Engineering · Game UI/UX · Art · Other engineering. Pin up to 4. Shortcuts: / search · s scan · i inspect · e export · ? guide`

---

## 10. Acceptance checklist

A rebuild is done when all of these are true:

- [ ] Dark mint board loads from `index.html` with no API required
- [ ] Four department cards + All
- [ ] All view shows four labeled section lanes with counts
- [ ] Clicking a department isolates that lane and narrows category chips
- [ ] Watchlist includes Engineering + Game UI/UX + Art + Other Eng signals
- [ ] Search, category, kind, sort all compose
- [ ] Run scan injects unused SCAN_POOL rows (max 3) with toast
- [ ] Pin max 4, survives reload via localStorage
- [ ] Two-plus pins show compare table
- [ ] Inspect modal works with cache + fallback + md download + recent list
- [ ] Copy TL;DR works
- [ ] Export writes md + json of the *filtered* set
- [ ] Scoring guide explains 80 / 50 / 1 bands
- [ ] Keyboard shortcuts work
- [ ] Digest shows top 3 by score
- [ ] No FastAPI JSON splash on the public URL
- [ ] Mobile: digest stacks to one column, cards remain readable

If Target B is also requested:

- [ ] `/health` only on the engine
- [ ] `/scan` calls Grok with 72h window and returns strict JSON
- [ ] Dashboard never blocks first paint on the engine
- [ ] Engine down → board still shows watchlist

---

## 11. Prompt you can paste to Claude

```
Build GitPulse from GITPULSE_HANDBOOK.md.

Phase 1: Target A — one production-ready index.html (dark Linear/Vercel SPA) with department section lanes, seeded watchlist for Engineering / Game UI/UX / Art / Other Eng, scan pool, inspect cache, shortlist, export, shortcuts. No backend.

Phase 2 (only if I ask): FastAPI engine + TanStack Start dashboard as specified in sections 2–3. Engine GET / must 404. Health at /health.

Do not regress the pitfalls in section 6.
```

---

## 12. Optional next features (not required for rebuild)

- Real Grok live scan behind a key, with SCAN_POOL as fallback
- Persist scans in SQLite
- Per-department digest strips
- Saved focus presets (`rust compilers`, `game hud`, `lookdev`, `build farm`)
- Compare export as a one-pager for art vs UI vs eng leads
- OG image + favicon in the studio mint/ink palette

---

*Handbook compiled from the original GitPulse MVP spec, analyst-workflow additions, dashboard/engine routing fixes, Netlify access fixes, and the department-lane expansion (Game UI/UX, Art, Other engineering).*
