// Verifies the favicon / icon / share-image set actually matches what the pages
// and the web manifest reference: files exist, are real images of the right
// format, and have the exact pixel sizes declared. Part of `npm run check`.
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const errors = [];
const fail = (msg) => { errors.push(msg); };   // returns undefined so callers can bail out
const read = (rel) => readFileSync(join(PUBLIC, rel));
const local = (url) => url.startsWith("/") ? url.slice(1) : null;

const MIN_BYTES = { ".png": 800, ".ico": 400, ".svg": 200 };
function pngSize(buf, rel, { whole = true } = {}){
  if (buf.readUInt32BE(0) !== 0x89504e47) return fail(`${rel}: not a PNG`);
  if (buf.subarray(12, 16).toString() !== "IHDR") return fail(`${rel}: malformed PNG header`);
  // A truncated or blank render still has a valid header, so check the file is
  // complete (ends with IEND) and big enough to hold real image data.
  if (whole) {
    if (buf.subarray(-8, -4).toString() !== "IEND") return fail(`${rel}: PNG is truncated (no IEND)`);
    if (buf.length < MIN_BYTES[".png"]) return fail(`${rel}: only ${buf.length} bytes — looks blank`);
  }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const html = readFileSync(join(PUBLIC, "index.html"), "utf8");
const notFound = readFileSync(join(PUBLIC, "404.html"), "utf8");

// 1. Every icon/manifest reference in index.html resolves to a real file
const refs = [...html.matchAll(/<link[^>]*rel="(icon|apple-touch-icon|manifest)"[^>]*href="([^"]+)"/g)].map((m) => ({ rel: m[1], href: m[2] }));
for (const kind of ["icon", "apple-touch-icon", "manifest"]) {
  if (!refs.some((r) => r.rel === kind)) fail(`index.html: no <link rel="${kind}">`);
}
if (!/<link[^>]*rel="icon"[^>]*href="\/favicon\.svg"/.test(html)) fail("index.html: missing the SVG favicon link");
if (!/<link[^>]*rel="icon"[^>]*href="\/favicon\.ico"/.test(html)) fail("index.html: missing the .ico fallback (bare /favicon.ico requests)");
if (!/<link[^>]*rel="icon"[^>]*href="\/favicon\.svg"/.test(notFound)) fail("404.html: missing the SVG favicon link");

for (const { rel, href } of refs) {
  const file = local(href);
  if (!file) { fail(`index.html: ${rel} href must be site-absolute, got ${href}`); continue; }
  if (!existsSync(join(PUBLIC, file))) { fail(`${file}: referenced by rel="${rel}" but missing`); continue; }
  const ext = file.slice(file.lastIndexOf("."));
  const size = statSync(join(PUBLIC, file)).size;
  if (size < (MIN_BYTES[ext] ?? 1)) fail(`${file}: only ${size} bytes — looks blank or truncated`);
}

// 2. Sizes of the rendered icons
for (const [file, want] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  if (!existsSync(join(PUBLIC, file))) { fail(`${file}: missing`); continue; }
  const d = pngSize(read(file), file);
  if (d && (d.w !== want || d.h !== want)) fail(`${file}: is ${d.w}x${d.h}, expected ${want}x${want}`);
}

// 3. favicon.svg must be square, or browsers letterbox it
if (existsSync(join(PUBLIC, "favicon.svg"))) {
  const svg = read("favicon.svg").toString();
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(svg);
  if (!vb) fail("favicon.svg: no viewBox");
  else if (Number(vb[3]) !== Number(vb[4])) fail(`favicon.svg: viewBox is ${vb[3]}x${vb[4]} — must be square`);
} else fail("favicon.svg: missing");

// 4. favicon.ico: real ICO whose entries match the PNGs inside
if (existsSync(join(PUBLIC, "favicon.ico"))) {
  const ico = read("favicon.ico");
  if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1) fail("favicon.ico: not an ICO file");
  const n = ico.readUInt16LE(4);
  if (n < 1) fail("favicon.ico: contains no images");
  for (let i = 0; i < n; i++) {
    const e = 6 + i * 16;
    const declared = ico[e] === 0 ? 256 : ico[e];
    const off = ico.readUInt32LE(e + 12), len = ico.readUInt32LE(e + 8);
    if (off + len > ico.length) { fail(`favicon.ico: entry ${i} points past the end of the file`); continue; }
    const d = pngSize(ico.subarray(off, off + len), `favicon.ico entry ${i}`, { whole: false });
    if (d && (d.w !== declared || d.h !== declared)) fail(`favicon.ico: entry ${i} declares ${declared}px but the image is ${d.w}x${d.h}`);
  }
} else fail("favicon.ico: missing");

// 5. Manifest icons exist, with the sizes they claim
const manifestRef = refs.find((r) => r.rel === "manifest");
if (manifestRef) {
  const file = local(manifestRef.href);
  if (file && existsSync(join(PUBLIC, file))) {
    let manifest;
    try { manifest = JSON.parse(read(file).toString()); } catch { fail(`${file}: invalid JSON`); }
    for (const icon of manifest?.icons ?? []) {
      const src = local(icon.src);
      if (!src || !existsSync(join(PUBLIC, src))) { fail(`${file}: icon ${icon.src} is missing`); continue; }
      if (src.endsWith(".png") && /^\d+x\d+$/.test(icon.sizes)) {
        const [w, h] = icon.sizes.split("x").map(Number);
        const d = pngSize(read(src), src);
        if (d && (d.w !== w || d.h !== h)) fail(`${file}: ${icon.src} claims ${icon.sizes} but is ${d.w}x${d.h}`);
      }
    }
    if (!manifest?.icons?.some((i) => String(i.purpose || "").includes("maskable"))) fail(`${file}: no maskable icon`);
  } else fail(`${manifestRef.href}: manifest missing`);
}

// 6. Share image matches the declared og:image dimensions
const og = /<meta property="og:image" content="[^"]*?([^/"]+\.png)"/.exec(html);
if (!og) fail("index.html: no og:image");
else {
  const file = og[1];
  if (!existsSync(join(PUBLIC, file))) fail(`${file}: og:image missing`);
  else {
    const d = pngSize(read(file), file);
    const w = Number(/<meta property="og:image:width" content="(\d+)"/.exec(html)?.[1]);
    const h = Number(/<meta property="og:image:height" content="(\d+)"/.exec(html)?.[1]);
    if (d && (d.w !== w || d.h !== h)) fail(`${file}: is ${d.w}x${d.h} but og:image says ${w}x${h}`);
    if (d && d.w < 600) fail(`${file}: ${d.w}px wide — too small for link previews`);
  }
}

if (errors.length) { console.error("Asset check failed:\n  " + errors.join("\n  ")); process.exit(1); }
console.log("Assets: favicons, app icons, manifest, and share image all check out.");
