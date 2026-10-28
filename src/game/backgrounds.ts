// Era backdrops, painted pixel by pixel at 320x180. Scenery sits on a
// horizon at y = HORIZON; skies and hills wrap horizontally so the image
// can repeat while the level scrolls.
import { Painter, rng, textWidth } from './pixel';
import type { Era } from './eras';

export const BG_W = 320;
export const BG_H = 180;
const HORIZON = 150;

/* ---------------- shared helpers ---------------- */

const wrapDist = (x: number, cx: number) => ((((x - cx) % BG_W) + BG_W * 1.5) % BG_W) - BG_W / 2;

/** A rounded hill; `texture` sprinkles pixels (trees) inside it only. */
function hill(
  p: Painter,
  cx: number,
  halfW: number,
  height: number,
  color: string,
  texture?: { colors: string[]; density: number; seed: number },
  base = HORIZON
) {
  const r = rng(texture?.seed ?? 1);
  for (let x = 0; x < BG_W; x++) {
    const d = wrapDist(x, cx) / halfW;
    if (Math.abs(d) >= 1) continue;
    const top = Math.round(base - height * Math.pow(1 - d * d, 0.7));
    p.rect(x, top, 1, base - top + 1, color);
    if (!texture) continue;
    for (let y = top + 1; y < base; y++)
      if (r() < texture.density) p.px(x, y, texture.colors[Math.floor(r() * texture.colors.length)]);
  }
}

function speckle(p: Painter, x: number, y: number, w: number, h: number, colors: string[], n: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) p.px(x + Math.floor(r() * w), y + Math.floor(r() * h), colors[i % colors.length]);
}

function cloud(p: Painter, x: number, y: number, w: number, light = '#ffffff', shade = '#dbe7f2') {
  for (const dx of [0, -BG_W]) {
    p.rect(x + dx + 5, y, w - 12, 3, light);
    p.rect(x + dx + 2, y + 3, w - 4, 4, light);
    p.rect(x + dx, y + 7, w, 3, light);
    p.rect(x + dx + 1, y + 10, w - 2, 2, shade);
  }
}

function ellipse(p: Painter, cx: number, cy: number, rx: number, ry: number, color: string, topOnly = false) {
  for (let dx = -rx; dx <= rx; dx++) {
    const dy = Math.round(ry * Math.sqrt(1 - (dx / rx) ** 2));
    p.rect(cx + dx, cy - dy, 1, topOnly ? dy : dy * 2 + 1, color);
  }
}

/** A building with a grid of windows; `lit` is the share of glowing windows. */
function tower(
  p: Painter,
  x: number,
  w: number,
  h: number,
  body: string,
  win: string,
  litColor: string,
  lit: number,
  seed: number,
  base = HORIZON
) {
  const r = rng(seed);
  p.rect(x, base - h, w, h, body);
  for (let wy = base - h + 3; wy < base - 4; wy += 5)
    for (let wx = x + 2; wx < x + w - 2; wx += 4) p.rect(wx, wy, 2, 3, r() < lit ? litColor : win);
}

function treeline(p: Painter, colors: string[], seed: number, base = HORIZON) {
  const r = rng(seed);
  for (let x = -4; x < BG_W + 4; x += 5) {
    const s = 4 + Math.floor(r() * 5);
    p.rect(x, base - s, 7, s + 1, colors[Math.floor(r() * colors.length)]);
    p.rect(x + 1, base - s - 2, 5, 2, colors[0]);
  }
}

/** Gable on top of a narrow house: 'step' (Flemish), 'bell' (Dutch) or 'point'. */
function gable(p: Painter, x: number, top: number, w: number, kind: 'step' | 'bell' | 'point', color: string, trim?: string) {
  if (kind === 'step') {
    let s = 0;
    for (let ww = w; ww >= 6; ww -= 4, s++) p.rect(x + (w - ww) / 2, top - (s + 1) * 4, ww, 4, color);
    if (trim) p.rect(x + w / 2 - 1, top - (s + 1) * 4, 2, 4, trim);
  } else if (kind === 'bell') {
    const h = 14;
    for (let j = 0; j < h; j++) {
      const t = j / h; // 0 at bottom
      const half = t < 0.35 ? w / 2 - t * 6 : (w / 2 - 2.1) * Math.sqrt(Math.max(0, 1 - ((t - 0.35) / 0.65) ** 2)) + 1;
      p.rect(x + w / 2 - half, top - j - 1, half * 2, 1, color);
    }
    if (trim) {
      p.rect(x + w / 2 - 3, top - 6, 6, 4, trim);
      p.rect(x + w / 2 - 2, top - 5, 4, 2, '#2a2420');
    }
  } else {
    for (let j = 0; j < w / 2; j++) p.rect(x + j, top - j - 1, w - j * 2, 1, color);
  }
}

function windowsGrid(
  p: Painter,
  x: number,
  top: number,
  w: number,
  h: number,
  frame: string,
  pane: string,
  cols = 2,
  base = HORIZON
) {
  const gap = (w - cols * 4) / (cols + 1);
  for (let wy = top + 4; wy < base - 8; wy += 10)
    for (let c = 0; c < cols; c++) {
      const wx = x + gap + c * (4 + gap);
      p.rect(wx - 1, wy - 1, 6, 8, frame);
      p.rect(wx, wy, 4, 6, pane);
    }
}

/* ---------------- 2022 · Montréal ---------------- */

function montreal(p: Painter) {
  p.sky(['#5aa9e6', '#74b9ec', '#90c9f1', '#aed8f5', '#cbe7f9'], HORIZON, BG_W);
  cloud(p, 24, 22, 42);
  cloud(p, 168, 38, 30);
  cloud(p, 262, 16, 50);

  // Mont Royal and its cross
  hill(p, 78, 105, 62, '#3f8a3a', { colors: ['#357a30', '#4f9e44', '#2f6e2c'], density: 0.18, seed: 3 });
  p.rect(77, 70, 3, 20, '#eef3f8');
  p.rect(72, 75, 13, 2, '#eef3f8');
  p.rect(80, 70, 1, 20, '#c3ccd8');
  treeline(p, ['#2f6e2c', '#3f8a3a', '#2a5f27'], 21);

  // Downtown
  const body = '#8c9db3';
  tower(p, 122, 12, 40, '#7f90a7', '#6f8199', '#d7e3f0', 0.15, 11);
  tower(p, 136, 16, 54, body, '#6f8199', '#d7e3f0', 0.15, 12);
  // Place Ville Marie: a cross-shaped tower
  tower(p, 156, 24, 74, '#9aabc0', '#7a8ca4', '#d7e3f0', 0.15, 13);
  p.rect(156, HORIZON - 74, 4, 74, '#7f90a7');
  p.rect(176, HORIZON - 74, 4, 74, '#7f90a7');
  // 1000 de La Gauchetière: tall with a copper pyramid
  tower(p, 186, 14, 92, '#a4b3c6', '#7a8ca4', '#d7e3f0', 0.15, 14);
  for (let j = 0; j < 8; j++) p.rect(186 + j, HORIZON - 92 - j - 1, 14 - j * 2, 1, '#5fa08a');
  tower(p, 204, 16, 62, body, '#6f8199', '#d7e3f0', 0.15, 15);
  tower(p, 222, 12, 46, '#7f90a7', '#6f8199', '#d7e3f0', 0.15, 16);

  // Olympic Stadium and its leaning tower
  ellipse(p, 284, HORIZON, 30, 12, '#dfe3ea', true);
  p.rect(256, HORIZON - 3, 56, 3, '#c5cbd5');
  for (let i = 0; i < 64; i++) {
    const x = 258 + i * 0.5;
    p.rect(x, HORIZON - 4 - i, 7, 1, '#e6e9ee');
    p.rect(x + 6, HORIZON - 4 - i, 1, 1, '#b8c0cc');
  }
  p.rect(287, HORIZON - 72, 9, 5, '#d4d9e1');

  p.rect(0, HORIZON, BG_W, BG_H - HORIZON, '#4f8f3a');
}

/* ---------------- 2023–2024 · CCGP, consulting ---------------- */

function consulting(p: Painter) {
  p.sky(['#2b1d4f', '#45266a', '#6e3378', '#a0457a', '#d0626a', '#f08c5c'], HORIZON, BG_W);
  speckle(p, 0, 0, BG_W, 40, ['#f6e9ff', '#c9b6ea'], 40, 5);

  // Back skyline
  const r = rng(8);
  for (let x = -6; x < BG_W; x += 14 + Math.floor(r() * 8)) {
    const w = 14 + Math.floor(r() * 10);
    const h = 60 + Math.floor(r() * 50);
    p.rect(x, HORIZON - h, w, h, '#3b2f5c');
  }

  // Middle towers with warm lit windows
  const mids = [
    [0, 22, 70], [26, 18, 92], [112, 20, 80], [140, 16, 64], [258, 22, 96], [286, 18, 74], [306, 20, 88],
  ];
  mids.forEach(([x, w, h], i) => tower(p, x, w, h, '#2e3558', '#252b48', '#ffd36b', 0.35, 30 + i));

  // Hero tower 1: BCG
  tower(p, 52, 46, 118, '#24423a', '#1c332d', '#9ff0c0', 0.25, 41);
  p.rect(58, HORIZON - 116, 34, 14, '#0f1f1a');
  p.text('BCG', 75 - textWidth('BCG', 2) / 2, HORIZON - 114, '#3fd17a', 2);
  p.rect(74, HORIZON - 128, 2, 12, '#24423a');
  p.px(74, HORIZON - 129, '#ff5a5a');

  // Hero tower 2: McKinsey
  tower(p, 176, 56, 108, '#1f2d4d', '#18233d', '#bcd4ff', 0.3, 42);
  p.rect(180, HORIZON - 106, 48, 11, '#0c1426');
  p.text('MCKINSEY', 204 - textWidth('MCKINSEY') / 2, HORIZON - 103, '#e8eefc');
  p.rect(202, HORIZON - 118, 3, 12, '#1f2d4d');

  // Street
  p.rect(0, HORIZON - 3, BG_W, 3, '#2a2440');
  p.rect(0, HORIZON, BG_W, BG_H - HORIZON, '#3a3550');
  for (let x = 4; x < BG_W; x += 22) p.rect(x, HORIZON - 14, 1, 11, '#5c5578'), p.rect(x - 1, HORIZON - 15, 3, 2, '#ffe08a');
}

/* ---------------- Sept 2025 · HackMIT ---------------- */

function mit(p: Painter) {
  p.sky(['#4c8fd9', '#63a0df', '#7db2e6', '#98c4ee', '#b9dbf5'], HORIZON, BG_W);
  cloud(p, 20, 26, 36);
  cloud(p, 236, 18, 46);

  // Fall trees on both sides
  const fall = ['#e07b2e', '#c7442e', '#e8b23a', '#b85a24'];
  const r = rng(77);
  for (const [from, to] of [[0, 82], [238, 320]]) {
    for (let x = from; x < to; x += 9) {
      const h = 26 + Math.floor(r() * 16);
      const c = fall[Math.floor(r() * fall.length)];
      ellipse(p, x + 6, HORIZON - h, 9, 9, c);
      speckle(p, x - 2, HORIZON - h - 9, 16, 16, fall, 22, x);
      p.rect(x + 5, HORIZON - h + 6, 2, h - 6, '#5a3a24');
    }
  }

  // The Great Dome
  const cx = 160;
  p.rect(95, 108, 130, 42, '#ddd6c6');
  p.rect(95, 108, 130, 6, '#cfc7b3');
  p.rect(95, 114, 130, 1, '#b8b09c');
  p.rect(100, 115, 120, 27, '#a79f8c');
  for (let i = 0; i < 10; i++) {
    const x = 104 + i * 12;
    p.rect(x, 115, 4, 27, '#efe9dc');
    p.rect(x + 3, 115, 1, 27, '#bdb5a2');
    p.rect(x - 1, 115, 6, 2, '#e3dccd');
  }
  p.rect(97, 142, 126, 3, '#cfc7b3');
  p.rect(93, 145, 134, 3, '#c4bca8');
  p.rect(90, 148, 140, 2, '#b8b09c');
  p.text('HACKMIT', cx - textWidth('HACKMIT') / 2, 109, '#6b5f4a');
  // drum
  p.rect(cx - 28, 96, 56, 12, '#d4cdbd');
  for (let i = 0; i < 6; i++) p.rect(cx - 24 + i * 9, 99, 3, 6, '#9c947f');
  // dome with shading and ribs
  for (let dx = -30; dx <= 30; dx++) {
    const dy = Math.round(24 * Math.sqrt(1 - (dx / 30) ** 2));
    p.rect(cx + dx, 96 - dy, 1, dy, dx < -8 ? '#e2dfd8' : dx < 12 ? '#cfcbc2' : '#b5b1a8');
    if (dx % 6 === 0) p.rect(cx + dx, 96 - dy + 1, 1, dy - 1, '#a9a59b');
  }
  p.rect(cx - 2, 66, 5, 6, '#cfcbc2');
  p.rect(cx - 1, 63, 3, 3, '#b5b1a8');

  // Killian Court lawn
  p.rect(0, HORIZON, BG_W, BG_H - HORIZON, '#4f9a3c');
}

/* ---------------- PolyMonde · Belgium ---------------- */

function belgium(p: Painter) {
  p.sky(['#7f98b8', '#93abc8', '#a9bdd6', '#bfcfe2', '#d6e1ec'], HORIZON, BG_W);
  cloud(p, 120, 20, 60, '#eef2f6', '#c9d3de');
  cloud(p, 250, 34, 44, '#eef2f6', '#c9d3de');

  // Brussels Town Hall: gothic facade with a tall spire
  const stone = '#8c7b62';
  p.rect(8, 100, 104, 50, stone);
  p.rect(8, 100, 104, 3, '#a8977c');
  for (let x = 12; x < 108; x += 8) {
    p.rect(x, 108, 3, 9, '#3d342a');
    p.rect(x, 122, 3, 9, '#3d342a');
    p.rect(x + 1, 106, 1, 2, '#3d342a');
  }
  for (let x = 10; x < 110; x += 10) ellipse(p, x + 4, 150, 4, 8, '#2e2720', true);
  const tx = 60;
  p.rect(tx - 7, 60, 14, 40, '#7d6c55');
  p.rect(tx - 5, 40, 10, 20, '#8c7b62');
  p.rect(tx - 4, 28, 8, 12, '#7d6c55');
  for (let j = 0; j < 16; j++) p.rect(tx - 4 + j / 4, 28 - j, 8 - j / 2, 1, '#6e5e48');
  p.rect(tx, 8, 1, 5, '#e0b53b');
  p.px(tx - 1, 9, '#e0b53b');
  p.px(tx + 1, 9, '#e0b53b');
  for (let j = 0; j < 4; j++) p.rect(tx - 3, 64 + j * 9, 6, 5, '#3d342a');

  // Grand-Place guildhouses: dark stone with gold trim
  const houses = [
    [118, 26, 72, '#5a4a3a', 'step'], [146, 22, 64, '#6e5a44', 'bell'], [170, 28, 78, '#4f4134', 'step'],
    [200, 24, 68, '#6a563f', 'point'], [226, 30, 82, '#55463a', 'step'], [258, 24, 70, '#6e5a44', 'bell'],
    [284, 32, 76, '#5a4a3a', 'step'],
  ] as const;
  for (const [x, w, h, c, g] of houses) {
    p.rect(x, HORIZON - h, w, h, c);
    gable(p, x, HORIZON - h, w, g, c, '#e0b53b');
    windowsGrid(p, x, HORIZON - h, w, h, '#d9a92b', '#2a2420', 2);
    p.rect(x, HORIZON - h, w, 1, '#d9a92b');
  }

  p.rect(0, HORIZON, BG_W, BG_H - HORIZON, '#857c70');
}

/* ---------------- PolyMonde · Netherlands ---------------- */

function windmill(p: Painter, cx: number, base: number, height: number, body: string, cap: string, sail: string, lattice: string) {
  const top = base - height;
  for (let y = top; y < base; y++) {
    const w = 8 + ((y - top) / height) * 10;
    p.rect(cx - w / 2, y, w, 1, body);
  }
  p.rect(cx - 2, base - 10, 4, 10, '#2a2220');
  ellipse(p, cx, top + 1, 6, 4, cap, true);
  const hub = { x: cx, y: top + 3 };
  const L = Math.round(height * 0.42);
  for (const [dx, dy] of [[1, -1], [1, 1], [-1, 1], [-1, -1]]) {
    for (let i = 2; i < L; i++) {
      const x = hub.x + dx * i;
      const y = hub.y + dy * i;
      p.px(x, y, sail);
      for (let k = 1; k <= 3; k++) p.px(x + dy * k, y - dx * k, (i + k) % 2 ? sail : lattice);
    }
  }
  p.rect(hub.x - 1, hub.y - 1, 3, 3, cap);
}

function netherlands(p: Painter) {
  p.sky(['#5f9fe0', '#78b0e7', '#92c1ed', '#acd1f3', '#cde3f7'], HORIZON, BG_W);
  cloud(p, 40, 24, 40);
  cloud(p, 200, 14, 54);

  // Meadow, distant and near windmills
  p.rect(160, 128, BG_W - 160, 22, '#6cbf4a');
  windmill(p, 296, 128, 30, '#8a93a8', '#6d7590', '#e6e9f0', '#a9b0c0');
  windmill(p, 236, 136, 58, '#4a3a2e', '#2e2620', '#f2efe6', '#9a8b7a');

  // Tulip stripes
  const tulips = ['#e2403a', '#f7c843', '#f08ab8', '#e2403a', '#ffffff'];
  tulips.forEach((c, i) => {
    p.rect(160, 138 + i * 2, BG_W - 160, 1, c);
    p.rect(160, 139 + i * 2, BG_W - 160, 1, '#3f8f3a');
  });

  // Canal houses along the water
  const houses = [
    [2, 24, 66, '#9c3b2c', 'bell'], [26, 22, 74, '#6b4430', 'step'], [48, 26, 60, '#3d4a3a', 'bell'],
    [74, 22, 70, '#9c3b2c', 'point'], [96, 26, 78, '#5a3a2a', 'bell'], [122, 24, 64, '#7a3a30', 'step'],
  ] as const;
  for (const [x, w, h, c, g] of houses) {
    const base = 140;
    p.rect(x, base - h, w, h, c);
    gable(p, x, base - h, w, g, c, '#f1ece1');
    windowsGrid(p, x, base - h, w, h, '#f1ece1', '#2f3a48', 2, base);
    p.rect(x + w / 2 - 3, base - 9, 6, 9, '#2a2220');
  }
  // Canal
  p.rect(0, 140, 160, 10, '#3b6ea8');
  for (let x = 2; x < 160; x += 9) p.rect(x, 143 + (x % 3), 4, 1, '#7fb0e0');
  p.rect(0, 139, 160, 1, '#5c3d24');

  p.rect(0, HORIZON, BG_W, BG_H - HORIZON, '#56a83c');
}

/* ---------------- Today · South Korea ---------------- */

function korea(p: Painter) {
  p.sky(['#3b2a6b', '#5a3176', '#8a3f7d', '#c2567c', '#ec8a6c', '#f7c27a'], HORIZON, BG_W);

  // Setting sun, just above the ridge
  ellipse(p, 292, 70, 17, 17, '#f9b26a');
  ellipse(p, 292, 70, 13, 13, '#ffd98a');

  // Mountains (Bukhansan) in two layers
  const ridge = (x: number, a: number, b: number) =>
    a + 12 * Math.sin((2 * Math.PI * x) / BG_W * 2 + 1) + 7 * Math.sin((2 * Math.PI * x) / BG_W * 5 + 2) + b * Math.abs(Math.sin((2 * Math.PI * x) / BG_W * 13));
  for (let x = 0; x < BG_W; x++) {
    const back = HORIZON - ridge(x, 62, 6);
    p.rect(x, back, 1, HORIZON - back, '#5a3f6e');
    const front = HORIZON - ridge(x + 90, 34, 4);
    p.rect(x, front, 1, HORIZON - front, '#3e2f55');
  }

  // City lights
  const r = rng(51);
  for (let x = -4; x < BG_W; x += 10 + Math.floor(r() * 8)) {
    const h = 16 + Math.floor(r() * 30);
    tower(p, x, 10, h, '#2b2547', '#211c38', '#ffd98a', 0.3, x + 900);
  }

  // Namsan with N Seoul Tower
  hill(p, 64, 62, 44, '#2f2a46');
  const tx = 64;
  const ty = HORIZON - 44;
  p.rect(tx - 2, ty - 34, 4, 34, '#e9e4ec');
  p.rect(tx + 1, ty - 34, 1, 34, '#bdb5c6');
  p.rect(tx - 5, ty - 42, 10, 8, '#d8d2de');
  p.rect(tx - 5, ty - 39, 10, 2, '#ffd98a');
  p.rect(tx, ty - 56, 1, 14, '#e9e4ec');
  p.px(tx, ty - 57, '#ff5a5a');

  // Palace gate (Gwanghwamun-style)
  const gx = 220;
  p.rect(gx - 50, 126, 100, 24, '#9a8f86');
  for (let i = 0; i < 6; i++) p.rect(gx - 50, 128 + i * 4, 100, 1, '#867b72');
  for (const ox of [-26, 0, 26]) {
    ellipse(p, gx + ox, 136, 7, 6, '#2a2230', true);
    p.rect(gx + ox - 7, 136, 15, 14, '#2a2230');
  }
  p.rect(gx - 38, 112, 76, 14, '#5a3a2a');
  for (let x = gx - 38; x <= gx + 36; x += 8) p.rect(x, 112, 2, 14, '#a8332b');
  p.rect(gx - 40, 108, 80, 4, '#3f8f7a');
  const roof = (half: number, ridgeY: number, eaveY: number, ridgeHalf: number) => {
    for (let x = -half; x <= half; x++) {
      const t = Math.abs(x) / half;
      const eave = eaveY - 7 * Math.pow(t, 6);
      const top = Math.abs(x) <= ridgeHalf ? ridgeY : ridgeY + ((Math.abs(x) - ridgeHalf) / (half - ridgeHalf)) * (eave - ridgeY - 3);
      p.rect(gx + x, top, 1, eave - top + 1, x % 3 === 0 ? '#3d404c' : '#2b2d36');
    }
    p.rect(gx - ridgeHalf, ridgeY - 1, ridgeHalf * 2 + 1, 2, '#1d1e26');
  };
  roof(50, 96, 107, 24);
  p.rect(gx - 22, 84, 44, 10, '#5a3a2a');
  for (let x = gx - 22; x <= gx + 20; x += 7) p.rect(x, 84, 2, 10, '#a8332b');
  p.rect(gx - 24, 82, 48, 2, '#3f8f7a');
  roof(32, 70, 81, 14);

  p.rect(0, HORIZON, BG_W, BG_H - HORIZON, '#4a4058');
}

export const BACKGROUNDS: Record<Era, (p: Painter) => void> = {
  montreal,
  consulting,
  mit,
  belgium,
  netherlands,
  korea,
};
