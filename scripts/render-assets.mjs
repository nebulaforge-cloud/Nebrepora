// Renders the binary brand assets in public/ from the HTML sources in
// scripts/assets/ using a local headless Chromium (Edge or Chrome).
// Run after changing the icon or share-card design:  npm run assets
// Set BROWSER_PATH to point at a specific Chromium binary.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "..", "public");
const CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"
].filter(Boolean);
const browser = CANDIDATES.find((p) => existsSync(p));
if (!browser) { console.error("No Chromium browser found. Set BROWSER_PATH."); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), "nebrepora-assets-"));
// Headless Chromium enforces a minimum window size, so small outputs are
// rendered on a fixed-size page and scaled down with the device scale factor.
function shot(source, width, height, out, page = width){
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--allow-file-access-from-files", // lets the local HTML sources load public/fonts
    `--user-data-dir=${join(tmp, "profile")}`, `--force-device-scale-factor=${width / page}`,
    `--window-size=${page},${Math.round(height * page / width)}`, "--virtual-time-budget=6000",
    `--screenshot=${out}`, pathToFileURL(join(HERE, "assets", source)).href
  ], { stdio: "ignore" });
  console.log(`rendered ${out.replace(PUBLIC, "public")} (${width}x${height})`);
}

// ICO container holding PNG-encoded images (supported by every modern browser).
function writeIco(pngPaths, sizes, out){
  const pngs = pngPaths.map((p) => readFileSync(p));
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((png, i) => {
    const e = 6 + i * 16, s = sizes[i] >= 256 ? 0 : sizes[i];
    header.writeUInt8(s, e); header.writeUInt8(s, e + 1);
    header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  writeFileSync(out, Buffer.concat([header, ...pngs]));
  console.log(`wrote public/favicon.ico (${sizes.join(", ")})`);
}

try {
  shot("og-image.html", 1200, 630, join(PUBLIC, "og-image.png"));
  shot("icon.html", 512, 512, join(PUBLIC, "icon-512.png"));
  shot("icon.html", 192, 192, join(PUBLIC, "icon-192.png"), 512);
  shot("icon.html", 180, 180, join(PUBLIC, "apple-touch-icon.png"), 512);
  const ico = [32, 48].map((s) => { const p = join(tmp, `ico-${s}.png`); shot("icon.html", s, s, p, 512); return p; });
  writeIco(ico, [32, 48], join(PUBLIC, "favicon.ico"));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
