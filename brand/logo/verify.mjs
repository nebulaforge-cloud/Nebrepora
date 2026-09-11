// Verifies out/<file>.mp4 without relying on <video> seeking: parses the MP4
// sample tables, decodes every sample with WebCodecs, and saves chosen frames.
//   node verify.mjs nebrepora-logo-4k.mp4 1.2 3.4 7.2
import http from "node:http";
import { spawn } from "node:child_process";
import { createWriteStream, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "out");
const [file, ...times] = process.argv.slice(2);
const FPS = 60;
const wanted = JSON.stringify(times.map((t) => Math.round(Number(t) * FPS)));

const page = `<!doctype html><script>
const post = (u, b) => fetch(u, { method: "POST", body: b });
const WANT = new Set(${wanted}), FPS = ${FPS}, process_crop = ${process.env.CROP ? "true" : "false"};
(async () => {
  const buf = new Uint8Array(await (await fetch("/video")).arrayBuffer()), dv = new DataView(buf.buffer);
  const find = (type, start, end) => {
    for (let o = start; o < end;) { const sz = dv.getUint32(o), t = String.fromCharCode(...buf.subarray(o + 4, o + 8)); if (t === type) return [o, o + sz]; o += sz; }
    throw new Error("box not found: " + type);
  };
  const [m0, m1] = find("moov", 0, buf.length), [t0, t1] = find("trak", m0 + 8, m1), [d0, d1] = find("mdia", t0 + 8, t1);
  const [n0, n1] = find("minf", d0 + 8, d1), [s0, s1] = find("stbl", n0 + 8, n1);
  const [sd0, sd1] = find("stsd", s0 + 8, s1);
  const e0 = sd0 + 16;                                   // avc1 sample entry
  const [a0, a1] = find("avcC", e0 + 8 + 78, sd1);       // after the 78-byte visual sample entry header
  const avcC = buf.slice(a0 + 8, a1);
  const [z0] = find("stsz", s0 + 8, s1), n = dv.getUint32(z0 + 16);
  const sizes = Array.from({ length: n }, (_, i) => dv.getUint32(z0 + 20 + i * 4));
  const [c0] = find("stco", s0 + 8, s1); let off = dv.getUint32(c0 + 16);
  const [k0] = find("stss", s0 + 8, s1), keys = new Set(Array.from({ length: dv.getUint32(k0 + 12) }, (_, i) => dv.getUint32(k0 + 16 + i * 4) - 1));
  const codec = "avc1." + [...avcC.subarray(1, 4)].map((b) => b.toString(16).padStart(2, "0")).join("");
  await post("/log", "parsed " + n + " samples, " + keys.size + " keyframes, codec " + codec);
  const c = document.createElement("canvas"); c.width = 1280; c.height = 720; const g = c.getContext("2d");
  let idx = 0; const saves = [];
  const dec = new VideoDecoder({
    output: (f) => { const i = idx++; if (WANT.has(i)) { process_crop ? g.drawImage(f, 1280, 520, 1280, 720, 0, 0, 1280, 720) : g.drawImage(f, 0, 0, 1280, 720); saves.push(new Promise((r) => c.toBlob((b) => post("/save/decode-" + (process_crop ? "crop-" : "") + (i / FPS).toFixed(2) + ".png", b).then(r)))); } f.close(); },
    error: (e) => post("/log", "decode error " + e.message)
  });
  dec.configure({ codec, description: avcC, codedWidth: 3840, codedHeight: 2160 });
  for (let i = 0; i < n; i++) {
    dec.decode(new EncodedVideoChunk({ type: keys.has(i) ? "key" : "delta", timestamp: Math.round(i * 1e6 / FPS), data: buf.subarray(off, off + sizes[i]) }));
    off += sizes[i];
    while (dec.decodeQueueSize > 8) await new Promise((r) => setTimeout(r, 2));
  }
  await dec.flush(); await Promise.all(saves);
  await post("/log", "decoded " + idx + " frames OK");
  await post("/done");
})().catch((e) => post("/log", "ERR " + e.stack).then(() => post("/done")));
</script>`;

let br;
const srv = http.createServer((req, res) => {
  if (req.url === "/") { res.setHeader("content-type", "text/html"); return res.end(page); }
  if (req.url === "/video") { res.setHeader("content-type", "video/mp4"); return res.end(readFileSync(join(OUT, basename(file)))); }
  if (req.url.startsWith("/save/")) { const ws = createWriteStream(join(OUT, basename(req.url.slice(6)))); req.pipe(ws); ws.on("finish", () => res.end()); return; }
  let b = ""; req.on("data", (d) => (b += d)).on("end", () => { res.end(); if (req.url === "/log") console.log(b); if (req.url === "/done") { br.kill(); srv.close(); } });
}).listen(0, "127.0.0.1", () => {
  br = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--no-first-run", "--use-angle=d3d11",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "nb-verify-"))}`, `http://127.0.0.1:${srv.address().port}/`], { stdio: "ignore" });
});
setTimeout(() => { console.error("verify timed out"); br?.kill(); process.exit(1); }, 120000).unref();
