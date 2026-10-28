// 16x16 ground tiles for each era, painted procedurally so every era gets
// its own surface: grass, sidewalk, brick, cobblestone, tulip fields, stone.
import { Painter, rng } from './pixel';
import type { Era } from './eras';

export const TILE = 16;
export type TileKind = 'top' | 'fill' | 'platform';

type Style = 'grass' | 'paving' | 'brick' | 'cobble' | 'tulips' | 'stone';

const STYLE: Record<Era, { style: Style; c: string[] }> = {
  // c: [light, mid, dark, accent]
  montreal: { style: 'grass', c: ['#6cc24a', '#4c9a35', '#8a5a35', '#6e4528'] },
  consulting: { style: 'paving', c: ['#b4b0c2', '#9894a8', '#6f6b80', '#55516a'] },
  mit: { style: 'brick', c: ['#b4523a', '#94402c', '#d9cbb8', '#6e2e20'] },
  belgium: { style: 'cobble', c: ['#a59c90', '#857c70', '#5f574d', '#c2b9ad'] },
  netherlands: { style: 'tulips', c: ['#7ed05a', '#56a83c', '#7a5232', '#5c3d24'] },
  korea: { style: 'stone', c: ['#b0a6b8', '#8f8598', '#6b6276', '#a8333a'] },
};

const dirt = (p: Painter, x: number, y: number, top: number, c: string[], r: () => number) => {
  p.rect(x, y + top, TILE, TILE - top, c[2]);
  for (let i = 0; i < 9; i++) p.rect(x + Math.floor(r() * 15), y + top + 1 + Math.floor(r() * (14 - top)), 2, 1, c[3]);
};

export function paintTile(p: Painter, era: Era, kind: TileKind, x: number, y: number) {
  const { style, c } = STYLE[era];
  const r = rng(era.length * 97 + kind.length * 13 + 7);

  if (kind === 'platform') {
    // A floating block in the era's palette, with a light top edge.
    p.rect(x, y, TILE, TILE, c[1]);
    p.rect(x, y, TILE, 2, c[0]);
    p.rect(x, y + TILE - 2, TILE, 2, c[2]);
    p.rect(x + 7, y + 2, 2, 12, c[2]);
    p.rect(x, y + 8, TILE, 1, c[2]);
    p.rect(x, y, 1, TILE, '#1a1626');
    p.rect(x + TILE - 1, y, 1, TILE, '#1a1626');
    p.rect(x, y, TILE, 1, '#1a1626');
    p.rect(x, y + TILE - 1, TILE, 1, '#1a1626');
    return;
  }

  switch (style) {
    case 'grass':
    case 'tulips': {
      if (kind === 'fill') return dirt(p, x, y, 0, c, r);
      dirt(p, x, y, 5, c, r);
      p.rect(x, y, TILE, 5, c[1]);
      p.rect(x, y, TILE, 2, c[0]);
      for (let i = 0; i < TILE; i += 2) p.px(x + i, y + 5 + (i % 4 === 0 ? 1 : 0), c[1]);
      if (style === 'tulips') {
        const colors = ['#e2403a', '#f7c843', '#f08ab8'];
        for (let i = 1; i < TILE; i += 5) {
          p.px(x + i, y - 2, colors[(i + era.length) % 3]);
          p.px(x + i, y - 1, '#2f7a2a');
        }
      } else {
        for (let i = 0; i < TILE; i += 3) p.px(x + i, y - 1, c[0]);
      }
      return;
    }
    case 'paving': {
      p.rect(x, y, TILE, TILE, c[1]);
      if (kind === 'top') {
        p.rect(x, y, TILE, 3, c[0]);
        p.rect(x, y + 3, TILE, 1, c[2]);
      }
      p.rect(x + 7, y + (kind === 'top' ? 4 : 0), 1, TILE, c[2]);
      p.rect(x, y + 11, TILE, 1, c[2]);
      for (let i = 0; i < 6; i++) p.px(x + Math.floor(r() * 16), y + 4 + Math.floor(r() * 12), c[3]);
      return;
    }
    case 'brick': {
      p.rect(x, y, TILE, TILE, c[2]);
      // Running bond: 7x3 bricks with 1px mortar, every other row offset.
      for (let row = 0; row < 4; row++) {
        const off = row % 2 ? 4 : 0;
        for (let bx = x - 8 + off; bx < x + TILE; bx += 8) {
          const left = Math.max(bx, x);
          const right = Math.min(bx + 7, x + TILE);
          p.rect(left, y + row * 4, right - left, 3, row % 2 ? c[1] : c[0]);
        }
      }
      if (kind === 'top') p.rect(x, y, TILE, 2, '#e3d6c4');
      return;
    }
    case 'cobble': {
      p.rect(x, y, TILE, TILE, c[2]);
      const stones = [
        [1, 1, 6, 4], [8, 0, 7, 4], [0, 6, 4, 4], [5, 5, 6, 5], [12, 5, 4, 5],
        [1, 11, 6, 4], [8, 11, 7, 4],
      ];
      for (const [sx, sy, w, h] of stones) {
        p.rect(x + sx, y + sy, w, h, c[1]);
        p.rect(x + sx, y + sy, w - 1, 1, c[3]);
        p.rect(x + sx + 1, y + sy + 1, w - 2, h - 2, c[0]);
      }
      return;
    }
    case 'stone': {
      p.rect(x, y, TILE, TILE, c[1]);
      p.rect(x, y + 7, TILE, 1, c[2]);
      p.rect(x + 9, y, 1, 7, c[2]);
      p.rect(x + 3, y + 8, 1, 8, c[2]);
      p.rect(x, y, TILE, 1, c[0]);
      if (kind === 'top') {
        // A red-lacquered edge, like palace steps.
        p.rect(x, y, TILE, 3, c[0]);
        p.rect(x, y + 3, TILE, 1, c[3]);
      }
      return;
    }
  }
}
