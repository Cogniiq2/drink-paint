/**
 * Generates tasteful abstract placeholder images in the brand palette so every
 * media slot has a file. Replace the outputs with real photography — same
 * filenames, same aspect ratios. Run: node scripts/generate-placeholders.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const out = new URL("../public/media/", import.meta.url);
await mkdir(out, { recursive: true });

const palettes = {
  ink: ["#1d1915", "#3a2f27", "#6a5343", "#7a3430"],
  wine: ["#4a1f1e", "#7a3230", "#a0564a", "#2e1715"],
  bone: ["#d2c5b0", "#efe8da", "#b9a88e", "#f6f1e7"],
  umber: ["#2b2420", "#5a463a", "#8a6d57", "#3d2f28"],
  plaster: ["#dcd2c1", "#c3b49b", "#f0e9dc", "#a8967a"],
};

const files = [
  { name: "hero-poster", w: 2400, h: 1500, p: "ink", seed: 3 },
  { name: "hero-poster-mobile", w: 1200, h: 1800, p: "ink", seed: 3 },
  { name: "arrival", w: 1600, h: 2000, p: "umber", seed: 11 },
  { name: "wine-pour", w: 1600, h: 2000, p: "wine", seed: 5 },
  { name: "brush-detail", w: 2000, h: 1400, p: "plaster", seed: 7 },
  { name: "guests-painting", w: 2000, h: 1400, p: "umber", seed: 13 },
  { name: "table-wide", w: 2400, h: 1350, p: "ink", seed: 17 },
  { name: "finished-art", w: 1600, h: 2000, p: "bone", seed: 19 },
  { name: "atelier-room", w: 2400, h: 1600, p: "umber", seed: 23 },
  { name: "exterior-night", w: 2000, h: 1400, p: "ink", seed: 29 },
  { name: "private-table", w: 2400, h: 1400, p: "wine", seed: 31 },
  { name: "og-default", w: 1200, h: 630, p: "ink", seed: 37 },
  ...Array.from({ length: 6 }, (_, i) => ({ name: `gallery-0${i + 1}`, w: 1200, h: i % 2 ? 1500 : 1200, p: ["ink", "wine", "bone", "umber", "plaster", "ink"][i], seed: 41 + i })),
];

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

async function render({ w, h, p, seed }) {
  const cols = palettes[p];
  const r = rng(seed);
  // Work at low resolution, blur heavily, upscale: cheap and perfectly smooth.
  const sw = 240, sh = Math.round((h / w) * 240);
  const shapes = Array.from({ length: 5 }, () => {
    const cx = (0.1 + r() * 0.8) * sw, cy = (0.1 + r() * 0.8) * sh;
    const rx = (0.2 + r() * 0.4) * sw, ry = (0.2 + r() * 0.4) * sh;
    const col = cols[Math.floor(r() * cols.length)];
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}" opacity="0.85"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><rect width="100%" height="100%" fill="${cols[0]}"/>${shapes}</svg>`;
  const base = await sharp(Buffer.from(svg)).blur(28).resize(w, h, { kernel: "cubic" }).toBuffer();

  // Vignette
  const vig = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="45%" r="78%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);

  // Film grain: random noise, soft-light blended
  const nw = Math.round(w / 2), nh = Math.round(h / 2);
  const raw = randomBytes(nw * nh);
  for (let i = 0; i < raw.length; i++) raw[i] = 128 + ((raw[i] - 128) * 0.35) | 0;
  const noise = await sharp(raw, { raw: { width: nw, height: nh, channels: 1 } }).resize(w, h, { kernel: "nearest" }).png().toBuffer();

  return sharp(base)
    .composite([
      { input: vig, blend: "over" },
      { input: noise, blend: "soft-light" },
    ])
    .modulate({ saturation: 0.92 })
    .webp({ quality: 62 });
}

for (const f of files) {
  const img = await render(f);
  await img.toFile(fileURLToPath(new URL(`${f.name}.webp`, out)));
  console.log("wrote", `${f.name}.webp`);
}
