// Low-level pixel drawing on a canvas: rectangles, dithering, sprites from
// character grids, and a 3x5 pixel font. Everything is drawn at native
// resolution and scaled up with smoothing off.

export type Palette = Record<string, string>;
export type Grid = string[];

/** Small deterministic random generator, so art looks the same every time. */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 3x5 font: each glyph is five rows of three bits.
const FONT: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '110', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '110', '101', '010'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['010', '101', '010', '101', '010'],
  '9': ['010', '101', '011', '001', '110'],
  '-': ['000', '000', '111', '000', '000'],
  '.': ['000', '000', '000', '000', '010'],
  '!': ['010', '010', '010', '000', '010'],
  ':': ['000', '010', '000', '010', '000'],
  '/': ['001', '001', '010', '100', '100'],
  '+': ['000', '010', '111', '010', '000'],
  ',': ['000', '000', '000', '010', '100'],
  "'": ['010', '010', '000', '000', '000'],
  '?': ['110', '001', '010', '000', '010'],
  ' ': ['000', '000', '000', '000', '000'],
};

/** Map text onto the font: no accents, simple dashes, upper case. */
export const pixelText = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[·–—]/g, '-')
    .replace(/&/g, '+')
    .toUpperCase();

export const textWidth = (str: string, scale = 1) => (str.length * 4 - 1) * scale;

export class Painter {
  constructor(public ctx: CanvasRenderingContext2D) {}

  rect(x: number, y: number, w: number, h: number, color: string) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  px(x: number, y: number, color: string) {
    this.rect(x, y, 1, 1, color);
  }

  /** Checkerboard of two colors, the classic way to blend bands. */
  dither(x: number, y: number, w: number, h: number, a: string, b: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.px(x + i, y + j, (i + j) % 2 ? a : b);
  }

  /** Vertical sky made of flat bands with dithered seams. */
  sky(stops: string[], height: number, width: number) {
    const band = height / stops.length;
    stops.forEach((c, i) => this.rect(0, Math.floor(i * band), width, Math.ceil(band) + 1, c));
    for (let i = 1; i < stops.length; i++) {
      this.dither(0, Math.floor(i * band) - 1, width, 2, stops[i - 1], stops[i]);
    }
  }

  text(str: string, x: number, y: number, color: string, scale = 1) {
    [...pixelText(str)].forEach((ch, n) => {
      const glyph = FONT[ch] ?? FONT[' '];
      glyph.forEach((row, j) =>
        [...row].forEach((bit, i) => {
          if (bit === '1') this.rect(x + (n * 4 + i) * scale, y + j * scale, scale, scale, color);
        })
      );
    });
  }

  /** Draw a character grid; '.' is transparent. */
  sprite(grid: Grid, palette: Palette, x: number, y: number, flip = false) {
    const w = grid[0].length;
    grid.forEach((row, j) =>
      [...row].forEach((key, i) => {
        if (key === '.') return;
        const color = palette[key];
        if (color) this.px(x + (flip ? w - 1 - i : i), y + j, color);
      })
    );
  }
}

/** Make a canvas of a given size with crisp pixel scaling. */
export const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, p: new Painter(ctx) };
};
