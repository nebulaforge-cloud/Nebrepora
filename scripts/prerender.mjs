// Build-time prerender for Nebrepora.
//
// Renders the default board (All departments, sorted by score) into
// public/index.html using the same view functions the browser uses, and
// regenerates the SEO / AEO / GEO files from public/data.js:
//   robots.txt, sitemap.xml, llms.txt, site.webmanifest, 404.html,
//   .well-known/security.txt
//
// Usage:  node scripts/prerender.mjs          write files
//         node scripts/prerender.mjs --check  exit 1 if any file is stale
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, WATCHLIST, KINDS, FAQ, BANDS, LANES, DEPTS } from "../public/data.js";
import {
  esc, deptName, velLabel, filterItems, catsFor, deptsHTML, chipsHTML,
  digestHTML, shortlistHTML, boardHTML, countText
} from "../public/view.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const CHECK = process.argv.includes("--check");
const HOME = `${SITE.url}/`;
const OG_IMAGE = `${SITE.url}/og-image.png`;
const OG_ALT = "Nebrepora signal board: velocity-scored open-source signals across Engineering, Game UI/UX, Art, and Other engineering.";
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const items = WATCHLIST.map((i) => ({ ...i }));
const state = { dept: "All", category: "All", kind: "All", q: "", sort: "score" };
const list = filterItems(items, state);

// ---------- index.html blocks ----------
const head = `
  <title>${esc(SITE.title)}</title>
  <meta name="description" content="${esc(SITE.description)}" />
  <link rel="canonical" href="${HOME}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <meta name="author" content="${esc(SITE.org.name)}" />
  <meta name="application-name" content="${esc(SITE.name)}" />
  <meta name="theme-color" content="#09090b" />
  <meta name="color-scheme" content="dark" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(SITE.name)}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:url" content="${HOME}" />
  <meta property="og:title" content="${esc(SITE.title)}" />
  <meta property="og:description" content="${esc(SITE.description)}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(OG_ALT)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(SITE.title)}" />
  <meta name="twitter:description" content="${esc(SITE.description)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <meta name="twitter:image:alt" content="${esc(OG_ALT)}" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  `;

const features = [
  "Organic velocity score (1–100) per signal",
  "Department lanes: Engineering, Game UI/UX, Art, Other engineering",
  "Category, kind, search, and sort filters",
  "Run scan with focus keywords",
  "Deep inspect with analysis and competitors",
  "Shortlist of up to 4 with compare table",
  "Markdown and JSON briefing export",
  "Keyboard shortcuts"
];

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization", "@id": `${SITE.org.url}/#organization`,
      name: SITE.org.name, url: SITE.org.url, sameAs: SITE.org.sameAs
    },
    {
      "@type": "WebSite", "@id": `${HOME}#website`, url: HOME, name: SITE.name,
      description: SITE.description, inLanguage: "en",
      publisher: { "@id": `${SITE.org.url}/#organization` }
    },
    {
      "@type": "WebApplication", "@id": `${HOME}#app`, name: SITE.name, url: HOME,
      description: SITE.description, applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)", browserRequirements: "Requires JavaScript for filters, scans, and export.",
      isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: features, image: OG_IMAGE, screenshot: OG_IMAGE,
      dateModified: SITE.updated, sameAs: [SITE.repo],
      publisher: { "@id": `${SITE.org.url}/#organization` }
    },
    {
      "@type": ["WebPage", "FAQPage"], "@id": `${HOME}#webpage`, url: HOME, name: SITE.title,
      description: SITE.description, inLanguage: "en", dateModified: SITE.updated,
      isPartOf: { "@id": `${HOME}#website` }, about: { "@id": `${HOME}#app` },
      primaryImageOfPage: OG_IMAGE, hasPart: { "@id": `${HOME}#watchlist` },
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
    },
    {
      "@type": "ItemList", "@id": `${HOME}#watchlist`, name: "Nebrepora watchlist",
      description: "Curated open-source and developer-tool signals, ranked by organic velocity score.",
      numberOfItems: list.length, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: list.map((it, i) => ({
        "@type": "ListItem", position: i + 1, name: it.name, url: it.url,
        description: `${deptName(it.dept)} · ${it.category} · velocity ${it.score} (${velLabel(it.score)}). ${it.hook}`
      }))
    }
  ]
};
const jsonld = `\n  <script type="application/ld+json">\n${jsonLd(graph)}\n  </script>\n  `;

const about = `
      <section class="about" id="about" aria-labelledby="aboutTitle">
        <p class="eyebrow">About</p>
        <h2 id="aboutTitle">${esc(FAQ[0].q)}</h2>
        <p class="lede">${esc(FAQ[0].a)}</p>
        <ul class="bands" aria-label="Velocity bands">
          ${BANDS.map((b) => `<li><span class="badge ${b.cls}">${esc(b.range)}</span><div><b>${esc(b.label)}</b> — ${esc(b.text)}</div></li>`).join("\n          ")}
        </ul>
        <h2 id="faq">Frequently asked questions</h2>
        <div class="faq">
          ${FAQ.slice(1).map((f) => `<article><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></article>`).join("\n          ")}
        </div>
      </section>
      `;

const footer = `
    <footer>
      <p>Departments: Engineering · Game UI/UX · Art · Other engineering. Pin up to 4. Shortcuts: / search · s scan · i inspect · e export · ? guide</p>
      <p>Watchlist reviewed <time datetime="${SITE.updated}">${fmtDate(SITE.updated)}</time> · Built by <a href="${SITE.org.url}">${esc(SITE.org.name)}</a> · <a href="${SITE.repo}" rel="noopener">Source on GitHub</a> · <a href="#about">About</a> · <a href="/llms.txt">llms.txt</a></p>
    </footer>
    `;

const blocks = {
  head, jsonld, about, footer,
  depts: deptsHTML(items, state.dept),
  cats: chipsHTML(catsFor(items, state.dept), state.category),
  kinds: chipsHTML(KINDS, state.kind),
  digest: digestHTML(items),
  shortlist: shortlistHTML([]),
  count: countText(list, items, state.dept),
  board: boardHTML(list, state.dept)
};

function inject(html){
  for (const [name, content] of Object.entries(blocks)) {
    const re = new RegExp(`<!-- prerender:${name} -->[\\s\\S]*?<!-- /prerender:${name} -->`);
    if (!re.test(html)) throw new Error(`Missing prerender marker: ${name}`);
    html = html.replace(re, () => `<!-- prerender:${name} -->${content}<!-- /prerender:${name} -->`);
  }
  return html;
}

// ---------- companion files ----------
const robots = `# ${SITE.name} — public signal board. Search engines and AI answer engines are welcome.
User-agent: *
Allow: /

User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Google-Extended
User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${HOME}</loc>
    <lastmod>${SITE.updated}</lastmod>
  </url>
</urlset>
`;

const llms = `# ${SITE.name}

> ${FAQ[0].a}

- Live board: ${HOME}
- Source code: ${SITE.repo}
- Publisher: ${SITE.org.name} (${SITE.org.url})
- Watchlist last reviewed: ${SITE.updated}

## How scoring works

${FAQ[1].a}

${BANDS.map((b) => `- ${b.range} — ${b.label}: ${b.text}`).join("\n")}

## Watchlist (ranked by organic velocity)

${LANES.map((d) => {
  const slice = list.filter((i) => i.dept === d);
  return `### ${deptName(d)}\n\n${DEPTS.find((x) => x.id === d).blurb}\n\n${slice.map((i) =>
    `- [${i.name}](${i.url}): velocity ${i.score} (${velLabel(i.score)}), ${i.category}, ${i.kind}. ${i.hook} ${i.tech} Builders: ${i.sentiment}`
  ).join("\n")}`;
}).join("\n\n")}

## FAQ

${FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")}
`;

const manifest = JSON.stringify({
  name: SITE.name,
  short_name: SITE.name,
  description: SITE.description,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#09090b",
  theme_color: "#09090b",
  icons: [
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ]
}, null, 2) + "\n";

const expires = new Date(`${SITE.updated}T00:00:00Z`);
expires.setUTCFullYear(expires.getUTCFullYear() + 1);
const securityTxt = `Contact: ${SITE.repo}/security/advisories/new
Expires: ${expires.toISOString()}
Preferred-Languages: en
Canonical: ${SITE.url}/.well-known/security.txt
Policy: ${SITE.repo}/blob/main/SECURITY.md
`;

const notFound = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page not found — ${esc(SITE.name)}</title>
  <meta name="robots" content="noindex" />
  <meta name="theme-color" content="#09090b" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="wrap">
    <p class="eyebrow">404 · no signal</p>
    <h1>This page isn’t on the board.</h1>
    <p class="sub">${esc(SITE.name)} is a single signal board. Head back to see every tracked repo and tool.</p>
    <p><a class="btn primary" href="/">Open the board</a></p>
  </main>
</body>
</html>
`;

// ---------- write / check ----------
const outputs = {
  "index.html": inject(readFileSync(join(ROOT, "index.html"), "utf8")),
  "robots.txt": robots,
  "sitemap.xml": sitemap,
  "llms.txt": llms,
  "site.webmanifest": manifest,
  "404.html": notFound,
  ".well-known/security.txt": securityTxt
};

let stale = [];
for (const [rel, content] of Object.entries(outputs)) {
  const file = join(ROOT, rel);
  const current = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
  if (current === content) continue;
  if (CHECK) { stale.push(rel); continue; }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log(`wrote public/${rel}`);
}
if (CHECK && stale.length) {
  console.error(`Stale generated files: ${stale.join(", ")}\nRun: npm run build`);
  process.exit(1);
}
console.log(CHECK ? "Prerender output is up to date." : "Prerender complete.");
