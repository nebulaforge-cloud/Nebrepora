// Renders the Nebrepora logo with headless Edge/Chrome on the local GPU.
//   node render.mjs video                         → out/nebrepora-logo-4k.mp4 (3840x2160, 60fps)
//   node render.mjs still --t=7.2                 → out/nebrepora-logo-4k.png
//   node render.mjs still --t=7.2 --alpha=1       → transparent PNG
// Any --key=value is passed to logo.html (w, h, fps, dur, spp, t, alpha, name, codec, bitrate).
import http from "node:http";
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
mkdirSync(OUT, { recursive: true });
const [mode = "still", ...rest] = process.argv.slice(2);
const params = new URLSearchParams({ mode, ...Object.fromEntries(rest.map((a) => a.replace(/^--/, "").split("="))) });
const BROWSERS = [process.env.BROWSER_PATH, "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe"].filter(Boolean);
const browserPath = BROWSERS.find((p) => existsSync(p));
const profile = mkdtempSync(join(tmpdir(), "nebrepora-logo-"));
let browser;

const server = http.createServer((req, res) => {
  if (req.method === "GET") { res.setHeader("content-type", "text/html"); return res.end(readFileSync(join(HERE, "logo.html"))); }
  if (req.url.startsWith("/save/")) {
    const file = join(OUT, basename(decodeURIComponent(req.url.slice(6))));
    const ws = createWriteStream(file); req.pipe(ws);
    ws.on("finish", () => { console.log(`saved ${file}`); res.end(); });
    return;
  }
  let body = ""; req.on("data", (d) => (body += d)).on("end", () => {
    res.end();
    if (req.url === "/log") console.log(body);
    if (req.url === "/done") { browser?.kill(); server.close(); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 1500); }
  });
}).listen(0, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${server.address().port}/?${params}`;
  browser = spawn(browserPath, ["--headless=new", "--no-first-run", "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, "--use-angle=d3d11", "--ignore-gpu-blocklist",
    "--enable-gpu", "--force-gpu-mem-available-mb=8192", url], { stdio: "ignore" });
});
setTimeout(() => { console.error("Timed out."); browser?.kill(); process.exit(1); }, 30 * 60 * 1000).unref();
