// Renders the binary brand assets in public/ with a local headless Chromium (Edge or Chrome):
//   favicon.ico                      flat pixel mark (scripts/assets/icon.html), crisp at 32/48px
//   icon-512/192, apple-touch-icon   3D gold mark (brand/logo renderer), inside the maskable safe zone
//   og-image.png                     3D gold lockup, 1200x630
// Run after changing the mark:  npm run assets      (BROWSER_PATH overrides the browser)
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PUBLIC = join(ROOT, "public");
const LOGO = join(ROOT, "brand", "logo");
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
    `--user-data-dir=${join(tmp, "profile")}`, `--force-device-scale-factor=${width / page}`,
    `--window-size=${page},${Math.round(height * page / width)}`, "--virtual-time-budget=4000",
    `--screenshot=${out}`, pathToFileURL(join(HERE, "assets", source)).href
  ], { stdio: "ignore" });
  console.log(`rendered ${out.replace(PUBLIC, "public")} (${width}x${height})`);
}
// 3D renders come from the GPU ray tracer in brand/logo (final lockup frame, t = 7.2s).
function logo(name, args){
  execFileSync(process.execPath, [join(LOGO, "render.mjs"), "still", "--t=7.2", `--name=${name}`, ...args], { stdio: "ignore" });
  copyFileSync(join(LOGO, "out", name), join(PUBLIC, name));
  console.log(`rendered public/${name} (3D, ${args.join(" ")})`);
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
  logo("og-image.png", ["--w=1200", "--h=630", "--spp=4"]);
  logo("icon-512.png", ["--frame=mark", "--w=512", "--h=512", "--spp=4", "--zoom=1.25"]);
  logo("icon-192.png", ["--frame=mark", "--w=192", "--h=192", "--spp=4", "--zoom=1.25"]);
  logo("apple-touch-icon.png", ["--frame=mark", "--w=180", "--h=180", "--spp=4", "--zoom=1.3"]);
  const ico = [32, 48].map((s) => { const p = join(tmp, `ico-${s}.png`); shot("icon.html", s, s, p, 512); return p; });
  writeIco(ico, [32, 48], join(PUBLIC, "favicon.ico"));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
