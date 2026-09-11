// Pure string renderers. No DOM access, so the same markup is produced in the
// browser (app.js) and at build time (scripts/prerender.mjs).
import { DEPTS, LANES, CATS } from "./data.js";
import { METRICS } from "./metrics.js";

export const MAX_PINS = 4;
// "Rising" needs a star count at least 7 days old; until then the sort is disabled.
export const HAS_GROWTH = Object.values(METRICS).some((m) => m.stars7d != null);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export const fmtNum = (n) => (n == null ? "—" : compact.format(n));
export const fmtSigned = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + compact.format(Math.abs(n));
export const fmtDay = (iso) => iso
  ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  : "—";
export const metricsFor = (id) => (Object.hasOwn(METRICS, id) ? METRICS[id] : null);
export const repoUrl = (m) => `https://github.com/${m.repo}`;

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

// Only http(s) links are ever rendered into href attributes.
export function safeUrl(u){
  try {
    const url = new URL(String(u));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "#";
  } catch { return "#"; }
}

export const velClass = (s) => s >= 80 ? "vel-high" : s >= 50 ? "vel-mid" : "vel-low";
export const velLabel = (s) => s >= 80 ? "High signal" : s >= 50 ? "Building" : "Watch";
export const deptName = (id) => (DEPTS.find((d) => d.id === id) || {}).name || id;

export function sortItems(list, sort){
  if (sort === "rising") {
    const g = (it) => metricsFor(it.id)?.stars7d ?? -Infinity;
    return list.sort((a, b) => (g(b) - g(a)) || b.score - a.score);
  }
  if (sort === "az") return list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "cat") return list.sort((a, b) => a.category.localeCompare(b.category) || b.score - a.score);
  return list.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function filterItems(items, { dept, category, kind, q, sort }){
  const needle = (q || "").trim().toLowerCase();
  const list = items.filter((it) => {
    if (dept !== "All" && it.dept !== dept) return false;
    if (category !== "All" && it.category !== category) return false;
    if (kind !== "All" && it.kind !== kind) return false;
    if (!needle) return true;
    return [it.name, it.hook, it.tech, it.category, it.dept].join(" ").toLowerCase().includes(needle);
  });
  return sortItems(list, sort);
}

export const catsFor = (items, dept) => dept === "All"
  ? CATS
  : ["All", ...CATS.filter((c) => c !== "All" && items.some((i) => i.dept === dept && i.category === c))];

export function deptsHTML(items, dept){
  return DEPTS.map((d) => {
    const n = d.id === "All" ? items.length : items.filter((i) => i.dept === d.id).length;
    return `<button class="dept-card" type="button" aria-pressed="${d.id === dept}" data-d="${esc(d.id)}"><b>${esc(d.name)}<span class="k">${n}</span></b><span>${esc(d.blurb)}</span></button>`;
  }).join("");
}

export const chipsHTML = (values, current) =>
  values.map((v) => `<button class="chip" type="button" aria-pressed="${v === current}" data-v="${esc(v)}">${esc(v)}</button>`).join("");

export function digestHTML(items){
  const top = [...items].sort((a, b) => b.score - a.score).slice(0, 3);
  return `<h2 class="eyebrow">Pulse digest</h2><div class="digest">${
    top.map((t) => `<button type="button" data-inspect="${esc(t.id)}"><b>${esc(t.name)} · ${t.score}</b><span>${esc(t.hook)}</span></button>`).join("")
  }</div>`;
}

export function shortlistHTML(pinned){
  let html = `<h2 class="eyebrow">Shortlist ${pinned.length}/${MAX_PINS}</h2>`;
  if (!pinned.length) return html + `<p class="muted note">Pin cards to build a compare set.</p>`;
  html += `<div class="pins">${pinned.map((p) =>
    `<span class="pin-tag">${esc(p.name)} <span class="k">${p.score}</span><button type="button" data-pin="${esc(p.id)}" aria-label="Unpin ${esc(p.name)}">×</button></span>`
  ).join("")}</div>`;
  if (pinned.length < 2) return html + `<p class="muted note">Pin a second project to compare.</p>`;
  return html + `<div class="table-wrap"><table><thead><tr><th scope="col">Project</th><th scope="col">Score</th><th scope="col">Stars</th><th scope="col">Dept</th><th scope="col">Kind</th><th scope="col">Category</th><th scope="col">Hook</th></tr></thead><tbody>${
    pinned.map((p) => `<tr><td><b>${esc(p.name)}</b></td><td><span class="badge ${velClass(p.score)}">${p.score}</span></td><td class="k">${metricsFor(p.id) ? `★ ${fmtNum(metricsFor(p.id).stars)}` : "—"}</td><td>${esc(deptName(p.dept))}</td><td>${esc(p.kind)}</td><td>${esc(p.category)}</td><td class="muted">${esc(p.hook)}</td></tr>`).join("")
  }</tbody></table></div>`;
}

// One line of live GitHub metrics for a card; empty for non-GitHub tools.
export function statsHTML(it){
  const m = metricsFor(it.id);
  if (!m) return "";
  const parts = [`<a href="${esc(safeUrl(repoUrl(m)))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(m.repo)} on GitHub, ${esc(String(m.stars ?? 0))} stars">★ ${fmtNum(m.stars)}</a>`];
  if (m.stars7d != null) parts.push(`${fmtSigned(m.stars7d)} / 7d`);
  if (m.commits30d != null) parts.push(`${fmtNum(m.commits30d)} commits / 30d`);
  if (m.release?.tag) parts.push(esc(m.release.tag.length > 22 ? `${m.release.tag.slice(0, 21)}…` : m.release.tag));
  return `<p class="stats k">${parts.join(" · ")}</p>`;
}

export function cardHTML(it, pins = [], fresh = new Set()){
  const pinned = pins.includes(it.id);
  const cls = ["card", pinned && "pinned", fresh.has(it.id) && "fresh"].filter(Boolean).join(" ");
  return `<article class="${cls}">
    <div class="badges">
      <span class="badge ${velClass(it.score)}">${it.score} ${velLabel(it.score)}</span>
      <span class="badge">${esc(deptName(it.dept))}</span>
      ${it.category !== it.dept ? `<span class="badge">${esc(it.category)}</span>` : ""}
      <span class="badge">${esc(it.kind)}</span>
      <span class="badge${it.source === "watchlist" ? "" : " live"}">${it.source === "watchlist" ? "Watchlist" : "Live scan"}</span>
      ${metricsFor(it.id)?.archived ? `<span class="badge archived">Archived</span>` : ""}
    </div>
    <h3>${esc(it.name)}</h3>
    <p class="hook">${esc(it.hook)}</p>
    <p class="tech">${esc(it.tech)}</p>
    <p class="sentiment">${esc(it.sentiment)}</p>
    <p class="cites k">${(it.citations || []).map(esc).join(" · ")}</p>
    ${statsHTML(it)}
    <div class="actions">
      <a class="btn" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(it.name)} (new tab)">Open ↗</a>
      <button class="ghost" type="button" data-copy="${esc(it.id)}">Copy TL;DR</button>
      <button class="ghost" type="button" data-inspect="${esc(it.id)}">Inspect</button>
      <button class="ghost" type="button" data-pin="${esc(it.id)}" aria-pressed="${pinned}">${pinned ? "Unpin" : "Pin"}</button>
    </div>
  </article>`;
}

const EMPTY = `<div class="empty panel"><p>No signals match these filters.</p><button class="ghost" type="button" data-reset>Clear filters</button></div>`;

export function boardHTML(list, dept, pins = [], fresh = new Set()){
  if (dept !== "All") {
    if (!list.length) return EMPTY;
    return `<h2 class="sr-only">${esc(deptName(dept))} signals</h2><div class="board">${list.map((it) => cardHTML(it, pins, fresh)).join("")}</div>`;
  }
  return LANES.map((d) => {
    const slice = list.filter((i) => i.dept === d);
    if (!slice.length) return "";
    const info = DEPTS.find((x) => x.id === d);
    return `<section class="lane" aria-label="${esc(info.name)}">
      <div class="lane-head"><h2>${esc(info.name)}</h2><span class="muted">${slice.length}</span><span class="blurb">${esc(info.blurb)}</span></div>
      <div class="board">${slice.map((it) => cardHTML(it, pins, fresh)).join("")}</div>
    </section>`;
  }).join("") || EMPTY;
}

export const countText = (list, items, dept) =>
  `${list.length} of ${items.length} signals${dept !== "All" ? ` · ${deptName(dept)}` : ""}`;
