import { WATCHLIST, SCAN_POOL, INSPECT, KINDS, SORT_LABEL } from "./data.js";
import { METRICS_UPDATED } from "./metrics.js";
import {
  MAX_PINS, HAS_GROWTH, esc, safeUrl, velClass, velLabel, deptName, filterItems, catsFor,
  deptsHTML, chipsHTML, digestHTML, shortlistHTML, boardHTML, countText,
  metricsFor, repoUrl, fmtNum, fmtSigned, fmtDay
} from "./view.js";

const PIN_KEY = "nebrepora-pins";
const LEGACY_PIN_KEY = "gp-pins";
const CATALOG = [...WATCHLIST, ...SCAN_POOL];
const KNOWN_IDS = new Set(CATALOG.map((i) => i.id));
const clone = (it) => ({ ...it, citations: [...(it.citations || [])] });

const $ = (id) => document.getElementById(id);
const state = { dept: "All", category: "All", kind: "All" };
let pins = loadPins();
// Pinned scan results survive a reload: restore them next to the watchlist.
let items = [
  ...SCAN_POOL.filter((p) => pins.includes(p.id)).map((p) => ({ ...clone(p), first_seen: null })),
  ...WATCHLIST.map(clone)
];
let inspections = [];
let freshIds = new Set();

function loadPins(){
  try {
    const raw = localStorage.getItem(PIN_KEY) ?? localStorage.getItem(LEGACY_PIN_KEY);
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    // Only ids that exist in the shipped catalog are accepted from storage.
    return [...new Set(arr.filter((x) => typeof x === "string" && KNOWN_IDS.has(x)))].slice(0, MAX_PINS);
  } catch { return []; }
}
function savePins(){
  try { localStorage.setItem(PIN_KEY, JSON.stringify(pins)); } catch {}
}

let toastTimer;
function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
}

const filtered = () => filterItems(items, { ...state, q: $("q").value, sort: $("sort").value });

function render(){
  $("depts").innerHTML = deptsHTML(items, state.dept);
  const cats = catsFor(items, state.dept);
  if (!cats.includes(state.category)) state.category = "All";
  $("cats").innerHTML = chipsHTML(cats, state.category);
  $("kinds").innerHTML = chipsHTML(KINDS, state.kind);
  $("digest").innerHTML = digestHTML(items);
  $("shortlist").innerHTML = shortlistHTML(pins.map((id) => items.find((i) => i.id === id)).filter(Boolean));
  const list = filtered();
  $("count").textContent = countText(list, items, state.dept);
  $("sortLabel").textContent = SORT_LABEL[$("sort").value] || "";
  $("board").innerHTML = boardHTML(list, state.dept, pins, freshIds);
}

async function copyText(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
    return ok;
  }
}

function togglePin(id){
  if (!items.some((i) => i.id === id)) return;
  if (pins.includes(id)) pins = pins.filter((x) => x !== id);
  else if (pins.length >= MAX_PINS) return toast(`Shortlist max is ${MAX_PINS}`);
  else pins.push(id);
  savePins();
  render();
}

const normUrl = (u) => String(u || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
function nameFromUrl(u){
  try {
    const url = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
    return (host === "github.com" && parts.length >= 2 ? `${parts[0]}/${parts[1]}` : host).slice(0, 80);
  } catch { return String(u).slice(0, 80); }
}
function resolveItem(q){
  const n = normUrl(q);
  const match = (x) => x.id === q || normUrl(x.url) === n;
  return items.find(match) || CATALOG.find(match) || null;
}

function openInspect(idOrUrl, { announce = false } = {}){
  const q = String(idOrUrl || "").trim().slice(0, 500);
  if (!q) return toast("Enter a URL to inspect");
  const it = resolveItem(q);
  const url = it?.url || (/^https?:\/\//i.test(q) ? q : `https://${q}`);
  const name = it?.name || nameFromUrl(q);
  const report = (it && Object.hasOwn(INSPECT, it.id) && INSPECT[it.id]) || {
    stars: "n/a",
    category: it?.category || "Unknown",
    analysis: `No cached deep-dive yet. ${name} looks like a ${it?.kind || "project"} in ${it?.category || "an uncategorized space"}. Check the official page, recent commits, and issue velocity before shortlisting.`,
    competitors: []
  };
  const at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const m = it ? metricsFor(it.id) : null;
  const stars = m?.stars != null ? `${m.stars.toLocaleString("en-US")} (live)` : report.stars;
  inspections = [{ name, url }, ...inspections.filter((i) => normUrl(i.url) !== normUrl(url))].slice(0, 8);
  const cell = (label, value) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
  const metricsBlock = m ? `
    <dl class="metrics-grid">
      ${cell("Stars", fmtNum(m.stars))}
      ${cell("7-day growth", m.stars7d != null ? fmtSigned(m.stars7d) : "collecting")}
      ${cell("30-day growth", m.stars30d != null ? fmtSigned(m.stars30d) : "collecting")}
      ${cell("Commits / 30d", fmtNum(m.commits30d))}
      ${cell("Forks", fmtNum(m.forks))}
      ${cell("Open issues", fmtNum(m.openIssues))}
      ${cell("Last push", fmtDay(m.pushedAt))}
      ${cell("Latest release", m.release ? `${m.release.tag}${m.release.date ? ` · ${fmtDay(m.release.date)}` : ""}` : "none")}
      ${cell("License", m.license && m.license !== "NOASSERTION" ? m.license : "see repo")}
    </dl>
    <p class="muted k">GitHub: <a href="${esc(safeUrl(repoUrl(m)))}" target="_blank" rel="noopener noreferrer">${esc(m.repo)}</a> · refreshed ${esc(fmtDay(METRICS_UPDATED))}${m.stale ? " · last refresh failed, showing previous data" : ""}${m.archived ? " · archived" : ""}</p>` : "";

  $("inspectBody").innerHTML = `
    <p class="eyebrow">Deep inspect</p>
    <h2 id="inspectTitle">${esc(name)}</h2>
    ${it ? `<div class="badges spaced"><span class="badge ${velClass(it.score)}">${it.score} ${velLabel(it.score)}</span><span class="badge">${esc(deptName(it.dept))}</span><span class="badge">${esc(it.kind)}</span></div>` : ""}
    <label class="sr-only" for="inspectUrl">Project URL</label>
    <input id="inspectUrl" value="${esc(url)}" maxlength="500" autocomplete="off" spellcheck="false" />
    <p class="report-meta"><b>${esc(report.category)}</b> <span class="muted">· stars ${esc(stars)} · analyzed ${esc(at)}</span></p>
    ${metricsBlock}
    <p>${esc(report.analysis)}</p>
    <p class="muted">Competitors: ${esc((report.competitors || []).join(", ") || "n/a")}</p>
    ${it ? `<p><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">Open ${esc(it.name)} ↗</a></p>` : ""}
    <p class="muted k recent-label">Recent inspections</p>
    <div class="recent">${inspections.map((i) => `<button type="button" data-recent="${esc(i.url)}">${esc(i.name)}</button>`).join("")}</div>
    <div class="actions">
      <button class="btn primary" type="button" id="doInspect">Analyze</button>
      <button class="ghost" type="button" id="dlInspect">Download md</button>
      <button class="ghost" type="button" id="closeInspect">Close</button>
    </div>`;
  const dlg = $("inspectDlg");
  if (!dlg.open) dlg.showModal();
  $("closeInspect").onclick = () => dlg.close();
  $("doInspect").onclick = () => {
    const value = $("inspectUrl").value.trim();
    if (!value) return toast("Enter a URL to inspect");
    const btn = $("doInspect");
    btn.disabled = true; btn.textContent = "Analyzing…";
    setTimeout(() => openInspect(value, { announce: true }), 200);   // openInspect redraws the button
  };
  $("inspectUrl").onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); $("doInspect").click(); } };
  if (announce) toast(`Analyzed ${name}`);
  $("dlInspect").onclick = () => {
    const md = [
      `# ${name}`, "",
      `- URL: ${url}`,
      `- Category: ${report.category}`,
      `- Stars: ${stars}`,
      ...(it ? [`- Velocity: ${it.score} (${velLabel(it.score)})`, `- Department: ${deptName(it.dept)}`] : []),
      ...(m ? [
        `- GitHub: ${repoUrl(m)} (refreshed ${fmtDay(METRICS_UPDATED)})`,
        `- Star growth: ${m.stars7d != null ? fmtSigned(m.stars7d) : "n/a"} / 7d, ${m.stars30d != null ? fmtSigned(m.stars30d) : "n/a"} / 30d`,
        `- Commits in last 30 days: ${m.commits30d ?? "n/a"}`,
        `- Latest release: ${m.release ? `${m.release.tag} (${fmtDay(m.release.date)})` : "none"}`,
        `- Last push: ${fmtDay(m.pushedAt)}`
      ] : []),
      "", "## Analysis", "", report.analysis, "",
      "## Competitors", "", ...((report.competitors || []).length ? report.competitors.map((c) => `- ${c}`) : ["- n/a"]), ""
    ].join("\n");
    download(`${name.replace(/\W+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "inspect"}.md`, md, "text/markdown");
  };
}

function download(name, text, type = "text/plain"){
  const href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = href; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function exportBoard(){
  const list = filtered();
  if (!list.length) return toast("Nothing to export — clear filters first");
  const q = $("q").value.trim();
  const scope = [
    state.dept !== "All" ? deptName(state.dept) : "All departments",
    state.category !== "All" ? state.category : "",
    state.kind !== "All" ? state.kind : "",
    q ? `“${q}”` : ""
  ].filter(Boolean).join(" · ");
  const md = ["# Nebrepora briefing", "", `_${scope} — ${list.length} signals — ${new Date().toISOString().slice(0, 10)}_`, "",
    ...list.map((i) => { const m = metricsFor(i.id); return `- **${i.name}** (${i.score}${m ? ` · ★ ${fmtNum(m.stars)}` : ""}) — ${i.hook}`; }), ""].join("\n");
  download("nebrepora-briefing.md", md, "text/markdown");
  const json = list.map((i) => ({ ...i, github: metricsFor(i.id) }));
  setTimeout(() => download("nebrepora-briefing.json", JSON.stringify({ exported: new Date().toISOString(), metricsUpdated: METRICS_UPDATED, signals: json }, null, 2), "application/json"), 300);
  toast("Exported markdown + JSON");
}

const STOP = new Set(["the", "and", "for", "of", "a", "an", "in", "on", "to", "with", "or"]);
function runScan(){
  const focus = $("focus").value.trim().slice(0, 120);
  const tokens = focus.toLowerCase().split(/[^a-z0-9/+#.]+/).filter((w) => w && !STOP.has(w));
  const eligible = SCAN_POOL
    .filter((p) => !items.some((i) => i.id === p.id))
    .filter((p) => (state.dept === "All" || p.dept === state.dept) && (state.category === "All" || p.category === state.category));
  if (!eligible.length) return toast("Scan already current");
  const hits = tokens.length
    ? eligible.filter((p) => { const hay = [p.name, p.hook, p.tech, p.category, p.dept].join(" ").toLowerCase(); return tokens.some((w) => hay.includes(w)); })
    : eligible;
  if (!hits.length) return toast(`No new signals for “${focus}”`);
  const add = hits.slice(0, 3).map((p) => ({ ...clone(p), first_seen: new Date().toISOString() }));
  items = [...add, ...items];
  freshIds = new Set(add.map((a) => a.id));
  if (state.kind !== "All" && add.every((a) => a.kind !== state.kind)) state.kind = "All";
  toast(`Scan added ${add.map((a) => a.name).join(", ")}`);
  render();
  freshIds = new Set();
}

function resetFilters(){
  Object.assign(state, { dept: "All", category: "All", kind: "All" });
  $("q").value = "";
  render();
}

// Events (delegated once; render() only swaps markup)
$("depts").addEventListener("click", (e) => {
  const b = e.target.closest("[data-d]");
  if (b) { state.dept = b.dataset.d; state.category = "All"; render(); }
});
$("cats").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) { state.category = b.dataset.v; render(); } });
$("kinds").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) { state.kind = b.dataset.v; render(); } });
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-copy],[data-inspect],[data-pin],[data-reset],[data-recent]");
  if (!el) return;
  if (el.dataset.recent) return openInspect(el.dataset.recent);
  if (el.closest("dialog")) return;
  if (el.dataset.copy) {
    const it = items.find((x) => x.id === el.dataset.copy);
    if (it) toast(await copyText(`${it.name} — ${it.hook}\n${it.tech}\n${it.url}`) ? "TL;DR copied" : "Copy failed");
  } else if (el.dataset.inspect) openInspect(el.dataset.inspect);
  else if (el.dataset.pin) togglePin(el.dataset.pin);
  else if ("reset" in el.dataset) resetFilters();
});
$("q").addEventListener("input", render);
$("sort").addEventListener("change", render);
$("btnScan").addEventListener("click", runScan);
$("btnExport").addEventListener("click", exportBoard);
$("btnInspect").addEventListener("click", () => openInspect(filtered()[0]?.id || items[0]?.id));
$("btnGuide").addEventListener("click", () => $("guideDlg").showModal());
$("closeGuide").addEventListener("click", () => $("guideDlg").close());
document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
// Keep pins in sync when the board is open in several tabs.
window.addEventListener("storage", (e) => {
  if (e.key !== PIN_KEY) return;
  pins = loadPins();
  const missing = SCAN_POOL.filter((p) => pins.includes(p.id) && !items.some((i) => i.id === p.id));
  if (missing.length) items = [...missing.map((p) => ({ ...clone(p), first_seen: null })), ...items];
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const openDlg = document.querySelector("dialog[open]");
  if (e.key === "Escape" && openDlg) { e.preventDefault(); openDlg.close(); return; }
  const tag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
    if (e.key === "Escape") document.activeElement.blur();
    return;
  }
  if (openDlg) return;
  if (e.key === "/") { e.preventDefault(); $("q").focus(); }
  else if (e.key === "s") runScan();
  else if (e.key === "i") $("btnInspect").click();
  else if (e.key === "e") exportBoard();
  else if (e.key === "?") $("guideDlg").showModal();
});

const rising = $("sort").querySelector('option[value="rising"]');
if (rising && !HAS_GROWTH) { rising.disabled = true; rising.textContent += " — after 7 days of data"; }

document.documentElement.classList.add("js");
render();
