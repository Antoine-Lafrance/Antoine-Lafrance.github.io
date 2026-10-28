// Builds the animated favicon from the frames in img/source/favicon/
// (face_1.png, face_2.png, ...): each is a portrait on a pink circle over
// a white background. Run with: node scripts/favicon.mjs
//
// Output in public/favicon/: one small PNG per frame (swapped by a script
// in the page, so the icon animates in Chrome too) and an animated GIF
// (Firefox plays it on its own).
import { readdirSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'img/source/favicon';
const OUT = 'public/favicon';
const SIZE = 64;
const FRAME_MS = 700;

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC)
  .filter((f) => /^face_\d+\.png$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));

// Find the circle: the bounding box of everything that isn't near-white.
async function findCircle(file) {
  const { data, info } = await sharp(`${SRC}/${file}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = Infinity, maxX = -1, minY = Infinity;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const o = (y * info.width + x) * 3;
      if (data[o] < 235 || data[o + 1] < 235 || data[o + 2] < 235) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
      }
    }
  const r = (maxX - minX) / 2;
  return { cx: minX + r, cy: minY + r, r };
}

// A soft-edged circle, slightly inset so no white fringe survives.
const mask = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 0.75}" fill="#fff"/></svg>`
);

const frames = [];
for (const [i, file] of files.entries()) {
  const { cx, cy, r } = await findCircle(file);
  const png = await sharp(`${SRC}/${file}`)
    .extract({ left: Math.round(cx - r), top: Math.round(cy - r), width: Math.round(2 * r), height: Math.round(2 * r) })
    .resize(SIZE, SIZE)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(png).toFile(`${OUT}/face-${i + 1}.png`);
  frames.push(png);
}

await sharp(frames, { join: { animated: true } })
  .gif({ delay: frames.map(() => FRAME_MS), loop: 0 })
  .toFile(`${OUT}/face.gif`);

console.log(`${frames.length} frames → ${OUT}/face-*.png and ${OUT}/face.gif`);
