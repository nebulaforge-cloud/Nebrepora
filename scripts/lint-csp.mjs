// Fails if any deployed HTML would violate the strict CSP in render.yaml:
// inline scripts, inline styles, event-handler attributes, or off-site assets.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const RULES = [
  [/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/i, "inline <script>"],
  [/<script[^>]*\bsrc="(?:https?:)?\/\//i, "off-site script"],
  [/<link[^>]*\bhref="(?:https?:)?\/\/(?![^"]*nebulaforge\.dev)[^"]*"[^>]*rel="(?:stylesheet|preload|modulepreload)"|<link[^>]*rel="(?:stylesheet|preload|modulepreload)"[^>]*\bhref="(?:https?:)?\/\//i, "off-site stylesheet/preload"],
  [/<style[\s>]/i, "inline <style>"],
  [/\sstyle="/i, "inline style attribute"],
  [/\son[a-z]+\s*=\s*["']/i, "inline event handler"]
];

let errors = 0;
for (const file of readdirSync(PUBLIC).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(join(PUBLIC, file), "utf8");
  for (const [re, label] of RULES) {
    const m = re.exec(html);
    if (m) { errors++; console.error(`public/${file}: ${label} → ${m[0].slice(0, 80)}`); }
  }
}
if (errors) process.exit(1);
console.log("CSP lint: clean");
