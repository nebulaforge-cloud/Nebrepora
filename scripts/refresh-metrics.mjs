// Daily GitHub metrics refresh for Nebrepora.
//
// Fetches stars, forks, open issues, last push, latest release, and commits in
// the last 30 days for every catalog item that maps to a GitHub repo, keeps a
// star-count history in data/metrics-history.json (not deployed), and writes
// public/metrics.js for the site. Velocity scores stay editorial.
//
// Usage:  GITHUB_TOKEN=... node scripts/refresh-metrics.mjs
//         (locally: GITHUB_TOKEN=$(gh auth token) npm run refresh)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WATCHLIST, SCAN_POOL } from "../public/data.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "metrics.js");
const HISTORY = join(ROOT, "data", "metrics-history.json");
const HISTORY_DAYS = 120;
const TOKEN = process.env.GITHUB_TOKEN || "";
const API = "https://api.github.com";
const DAY = 86400000;
const now = new Date();
const today = now.toISOString().slice(0, 10);

const REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
function repoOf(item){
  if (item.repo) return item.repo;
  const m = /^https:\/\/github\.com\/([^/]+\/[^/#?]+)/.exec(item.url);
  return m ? m[1].replace(/\.git$/, "") : null;
}
const targets = [...WATCHLIST, ...SCAN_POOL]
  .map((it) => ({ id: it.id, repo: repoOf(it) }))
  .filter((t) => t.repo && REPO_RE.test(t.repo));

async function gh(path, { allow404 = false } = {}){
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "nebrepora-metrics",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
      },
      signal: AbortSignal.timeout(15000)
    }).catch((e) => ({ ok: false, status: 0, error: e }));
    if (res.ok) return res;
    if (allow404 && res.status === 404) return null;
    if (res.status === 409) return null; // empty repository
    const retryable = res.status === 0 || res.status >= 500 || res.status === 429;
    if (!retryable || attempt === 3) throw new Error(`${path} → HTTP ${res.status}${res.error ? ` (${res.error.message})` : ""}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

// Third-party strings are length-capped and type-checked before they reach the page.
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : null);
const int = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);
const day = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.slice(0, 10) : null);

async function fetchRepo(repo){
  const meta = await (await gh(`/repos/${repo}`)).json();
  const rel = await gh(`/repos/${repo}/releases/latest`, { allow404: true });
  const release = rel ? await rel.json() : null;
  const since = new Date(now.getTime() - 30 * DAY).toISOString();
  const commits = await gh(`/repos/${repo}/commits?since=${since}&per_page=1`);
  let commits30d = 0;
  if (commits) {
    const last = /[?&]page=(\d+)>; rel="last"/.exec(commits.headers.get("link") || "");
    commits30d = last ? Number(last[1]) : (await commits.json()).length;
  }
  return {
    repo: str(meta.full_name, 140) || repo,
    stars: int(meta.stargazers_count),
    forks: int(meta.forks_count),
    openIssues: int(meta.open_issues_count),
    pushedAt: day(meta.pushed_at),
    archived: meta.archived === true,
    license: str(meta.license?.spdx_id, 40),
    release: release && str(release.tag_name, 40) ? { tag: str(release.tag_name, 40), date: day(release.published_at) } : null,
    commits30d
  };
}

async function pool(list, size, fn){
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < list.length) { const i = next++; out[i] = await fn(list[i]).then((v) => ({ ok: true, v }), (e) => ({ ok: false, e })); }
  }));
  return out;
}

async function loadPrevious(){
  if (!existsSync(OUT)) return {};
  try { return (await import(`${pathToFileURL(OUT).href}?t=${Date.now()}`)).METRICS || {}; }
  catch { return {}; }
}

function deltaFrom(series, stars, days){
  if (stars == null || !series) return null;
  const cutoff = new Date(now.getTime() - days * DAY).toISOString().slice(0, 10);
  const older = Object.keys(series).filter((d) => d <= cutoff).sort();
  if (!older.length) return null;
  return stars - series[older[older.length - 1]];
}

const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;

// ---------- run ----------
if (!TOKEN) console.warn("GITHUB_TOKEN not set: using the unauthenticated limit of 60 requests/hour.");
const previous = await loadPrevious();
const history = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, "utf8")) : {};
const results = await pool(targets, 4, (t) => fetchRepo(t.repo));

const failed = [];
const metrics = {};
targets.forEach((t, i) => {
  const r = results[i];
  if (!r.ok) {
    failed.push(`${t.repo}: ${r.e.message}`);
    if (previous[t.id]) metrics[t.id] = { ...previous[t.id], stale: true };
    return;
  }
  const m = r.v;
  const series = (history[t.id] ||= {}); // keyed by item id so repo renames keep history
  if (m.stars != null) series[today] = m.stars;
  metrics[t.id] = { ...m, stars7d: deltaFrom(series, m.stars, 7), stars30d: deltaFrom(series, m.stars, 30) };
});

if (failed.length) console.warn(`Failed (${failed.length}/${targets.length}):\n  ${failed.join("\n  ")}`);
if (failed.length > targets.length / 2) {
  console.error("More than half the repos failed; keeping the existing metrics.");
  process.exit(1);
}

// Prune history
const keepFrom = new Date(now.getTime() - HISTORY_DAYS * DAY).toISOString().slice(0, 10);
for (const series of Object.values(history)) for (const d of Object.keys(series)) if (d < keepFrom) delete series[d];

mkdirSync(dirname(HISTORY), { recursive: true });
writeFileSync(HISTORY, JSON.stringify(sortKeys(history), null, 1) + "\n");
writeFileSync(OUT, `// Generated by scripts/refresh-metrics.mjs from the GitHub API. Do not edit by hand.
export const METRICS_UPDATED = ${JSON.stringify(now.toISOString())};
export const METRICS = ${JSON.stringify(sortKeys(metrics), null, 2)};
`);
console.log(`Refreshed ${targets.length - failed.length}/${targets.length} repos → public/metrics.js`);
