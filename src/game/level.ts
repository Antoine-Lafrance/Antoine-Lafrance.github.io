// The level: one section per era, laid out on a grid of 16px tiles.
// Rows run 0 (top) to 10; the ground is rows 9-10. Jumps reach about
// three tiles up and three tiles across.
import type { Era } from './eras';

export const ROWS = 11;
export const ROW_Y0 = 4; // y of the top of row 0 (180 - 11 * 16)
export const rowY = (row: number) => ROW_Y0 + row * 16;

type SectionSpec = {
  era: Era;
  width: number;
  gaps: [number, number][]; // [from, to] columns with no ground
  platforms: [row: number, from: number, to: number][];
  blocks: [row: number, col: number][]; // "?" blocks with a coin inside
  coins: [row: number, col: number][];
  achievements: [row: number, col: number, id: string][];
};

const SECTIONS: SectionSpec[] = [
  {
    era: 'montreal',
    width: 40,
    gaps: [[26, 28]],
    platforms: [[6, 19, 23]],
    blocks: [[6, 11], [6, 13]],
    coins: [[8, 14], [8, 16], [8, 31], [8, 33], [8, 35]],
    achievements: [[5, 21, 'codeml']],
  },
  {
    era: 'consulting',
    width: 56,
    gaps: [[16, 18], [38, 40]],
    platforms: [[6, 8, 11], [6, 26, 29], [6, 44, 46], [4, 48, 50]],
    blocks: [[6, 32]],
    coins: [[8, 21], [8, 23], [8, 25], [8, 34], [8, 36]],
    achievements: [[8, 4, 'ccgp'], [5, 9, 'ibm'], [5, 27, 'datathon'], [3, 49, 'mckinsey']],
  },
  {
    era: 'mit',
    width: 36,
    gaps: [[22, 24]],
    platforms: [[6, 12, 16]],
    blocks: [[6, 7]],
    coins: [[8, 6], [8, 8], [8, 28], [8, 30], [8, 32]],
    achievements: [[5, 14, 'hackmit']],
  },
  {
    era: 'belgium',
    width: 36,
    gaps: [[14, 16], [27, 28]],
    platforms: [[6, 20, 24]],
    blocks: [[6, 8], [6, 10]],
    coins: [[5, 21], [5, 23], [8, 31], [8, 33]],
    achievements: [[8, 4, 'polymonde']],
  },
  {
    era: 'netherlands',
    width: 36,
    gaps: [[10, 12], [24, 26]],
    platforms: [[6, 15, 18], [5, 19, 21]],
    blocks: [[6, 29]],
    coins: [[4, 19], [4, 20], [4, 21], [8, 4], [8, 6], [8, 31], [8, 33]],
    achievements: [],
  },
  {
    era: 'korea',
    width: 40,
    gaps: [[12, 14]],
    platforms: [[6, 18, 22], [4, 25, 27]],
    blocks: [[6, 7]],
    coins: [[8, 5], [8, 30], [8, 32]],
    achievements: [[3, 26, 'companies']],
  },
];

export type Level = {
  cols: number;
  /** grid[row][col]: '.' empty, '#' ground, '=' platform, '?' block */
  grid: string[][];
  sections: { era: Era; from: number; to: number }[];
  coins: { col: number; row: number }[];
  achievements: { col: number; row: number; id: string }[];
  flagCol: number;
  spawnCol: number;
};

export function buildLevel(): Level {
  const cols = SECTIONS.reduce((n, s) => n + s.width, 0);
  const grid = Array.from({ length: ROWS }, () => Array<string>(cols).fill('.'));
  const level: Level = { cols, grid, sections: [], coins: [], achievements: [], flagCol: cols - 4, spawnCol: 4 };

  let start = 0;
  for (const s of SECTIONS) {
    for (let c = 0; c < s.width; c++) {
      const inGap = s.gaps.some(([a, b]) => c >= a && c <= b);
      if (!inGap) grid[9][start + c] = grid[10][start + c] = '#';
    }
    for (const [row, a, b] of s.platforms) for (let c = a; c <= b; c++) grid[row][start + c] = '=';
    for (const [row, c] of s.blocks) grid[row][start + c] = '?';
    for (const [row, c] of s.coins) level.coins.push({ row, col: start + c });
    for (const [row, c, id] of s.achievements) level.achievements.push({ row, col: start + c, id });
    level.sections.push({ era: s.era, from: start, to: start + s.width - 1 });
    start += s.width;
  }
  return level;
}
