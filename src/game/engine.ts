// The platformer: fixed-step physics, tile collisions, a following camera,
// era changes (backdrop, outfit, banner) and achievement pickups.
import { Painter, makeCanvas, textWidth, pixelText } from './pixel';
import { playerFrame, OUTFIT_PALETTE, ITEMS, ITEM_PALETTE, type Frame, type Outfit } from './sprites';
import { paintTile, TILE } from './tiles';
import { BACKGROUNDS, BG_W } from './backgrounds';
import { ERAS, type Era } from './eras';
import { buildLevel, rowY, ROWS } from './level';

export type AchievementInfo = { id: string; icon: string; title: string };

const W = 320;
const H = 180;
const STEP = 1000 / 60;

// Feel: units are pixels per frame at 60 fps.
const GRAVITY = 0.32;
const JUMP = -6;
const JUMP_CUT = -2.5;
const MAX_FALL = 6;
const ACCEL = 0.3;
const MAX_SPEED = 1.8;
const FRICTION = 0.75;
const COYOTE = 6;
const BUFFER = 6;
const PW = 10; // hitbox
const PH = 22;

type State = 'title' | 'play' | 'end';
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

export class Game {
  private p: Painter;
  private level = buildLevel();
  private tiles: HTMLCanvasElement;
  private bgs = {} as Record<Era, HTMLCanvasElement>;
  private state: State = 'title';
  private player = { x: 0, y: 0, vx: 0, vy: 0, onGround: false, facing: 1, outfit: 'casual' as Outfit, coyote: 0, buffer: 0, walk: 0, blink: 0 };
  private era: Era = 'montreal';
  private prevEra: Era | null = null;
  private fade = 1;
  private banner = { title: '', sub: '', t: 0 };
  private camX = 0;
  private coinsTaken = new Set<number>();
  private achTaken = new Set<number>();
  private usedBlocks = new Set<string>();
  private coinCount = 0;
  private particles: Particle[] = [];
  private popups: { x: number; y: number; t: number }[] = [];
  private toasts: { id: string; t: number }[] = [];
  private frame = 0;
  private acc = 0;
  private last = 0;
  private running = false;
  private jumpWasDown = false;

  /** Inputs, set from the keyboard or touch buttons. */
  input = { left: false, right: false, jump: false };

  constructor(
    canvas: HTMLCanvasElement,
    private info: Record<string, AchievementInfo>,
    private unlocked: Set<string>,
    private onUnlock: (id: string) => void
  ) {
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    this.p = new Painter(ctx);

    for (const era of ERAS) {
      const { canvas: bg, p } = makeCanvas(BG_W, H);
      BACKGROUNDS[era.id](p);
      this.bgs[era.id] = bg;
    }
    this.tiles = this.paintTiles();
    this.reset();
  }

  /* ---------------- setup ---------------- */

  private sectionAt(col: number) {
    return this.level.sections.find((s) => col >= s.from && col <= s.to) ?? this.level.sections[0];
  }

  private paintTiles() {
    const { grid, cols } = this.level;
    const { canvas, p } = makeCanvas(cols * TILE, H);
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];
        const era = this.sectionAt(col).era;
        if (cell === '#') paintTile(p, era, row > 0 && grid[row - 1][col] === '#' ? 'fill' : 'top', col * TILE, rowY(row));
        if (cell === '=') paintTile(p, era, 'platform', col * TILE, rowY(row));
      }
    return canvas;
  }

  private reset() {
    const pl = this.player;
    pl.x = this.level.spawnCol * TILE;
    pl.y = rowY(9) - PH;
    pl.vx = pl.vy = 0;
    pl.facing = 1;
    pl.outfit = 'casual';
    pl.blink = 0;
    this.era = 'montreal';
    this.prevEra = null;
    this.fade = 1;
    this.camX = 0;
    this.coinsTaken.clear();
    this.achTaken.clear();
    this.usedBlocks.clear();
    this.coinCount = 0;
    this.particles = [];
    this.popups = [];
    this.toasts = [];
  }

  /** Start from the title screen, or play again from the end screen. */
  start() {
    if (this.state === 'play') return;
    if (this.state === 'end') this.reset();
    this.state = 'play';
    this.showBanner('montreal');
  }

  get playing() {
    return this.state === 'play';
  }

  /* ---------------- loop ---------------- */

  run() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.acc = Math.min(this.acc + now - this.last, 250);
      this.last = now;
      while (this.acc >= STEP) {
        this.update();
        this.acc -= STEP;
      }
      this.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    this.input.left = this.input.right = this.input.jump = false;
  }

  /* ---------------- physics ---------------- */

  private solid(col: number, row: number) {
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= this.level.cols) return true;
    const c = this.level.grid[row][col];
    return c === '#' || c === '=' || c === '?';
  }

  private rowOf(y: number) {
    return Math.floor((y - rowY(0)) / TILE);
  }

  private update() {
    this.frame++;
    this.updateEffects();
    if (this.state !== 'play') return;

    const pl = this.player;
    const { input } = this;

    // Run
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir) {
      pl.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, pl.vx + ACCEL * dir));
      pl.facing = dir;
    } else {
      pl.vx *= FRICTION;
      if (Math.abs(pl.vx) < 0.05) pl.vx = 0;
    }

    // Jump with coyote time, input buffering and variable height
    if (input.jump && !this.jumpWasDown) pl.buffer = BUFFER;
    this.jumpWasDown = input.jump;
    pl.coyote = pl.onGround ? COYOTE : pl.coyote - 1;
    if (pl.buffer > 0 && pl.coyote > 0) {
      pl.vy = JUMP;
      pl.buffer = 0;
      pl.coyote = 0;
    }
    pl.buffer--;
    if (!input.jump && pl.vy < JUMP_CUT) pl.vy = JUMP_CUT;
    pl.vy = Math.min(pl.vy + GRAVITY, MAX_FALL);

    // Move and collide, one axis at a time
    pl.x += pl.vx;
    const r0 = this.rowOf(pl.y);
    const r1 = this.rowOf(pl.y + PH - 1);
    if (pl.vx !== 0) {
      const col = Math.floor((pl.vx > 0 ? pl.x + PW - 1 : pl.x) / TILE);
      for (let r = r0; r <= r1; r++)
        if (this.solid(col, r)) {
          pl.x = pl.vx > 0 ? col * TILE - PW : (col + 1) * TILE;
          pl.vx = 0;
          break;
        }
    }

    pl.y += pl.vy;
    pl.onGround = false;
    const c0 = Math.floor(pl.x / TILE);
    const c1 = Math.floor((pl.x + PW - 1) / TILE);
    if (pl.vy >= 0) {
      // Look at the pixel just below the feet, and only land on a tile
      // whose top the feet were above last frame.
      const row = this.rowOf(pl.y + PH);
      const top = rowY(row);
      for (let c = c0; c <= c1; c++)
        if (this.solid(c, row) && pl.y + PH >= top && pl.y + PH - pl.vy <= top + 1) {
          pl.y = top - PH;
          pl.vy = 0;
          pl.onGround = true;
          break;
        }
    } else {
      const row = this.rowOf(pl.y);
      for (let c = c0; c <= c1; c++)
        if (this.solid(c, row)) {
          pl.y = rowY(row + 1);
          pl.vy = 0;
          this.bump(c, row);
          break;
        }
    }

    // Fell in a gap: back to the start of the era
    if (pl.y > H + 24) {
      const s = this.sectionAt(Math.floor(pl.x / TILE));
      pl.x = (s.from + 3) * TILE;
      pl.y = rowY(9) - PH;
      pl.vx = pl.vy = 0;
      pl.blink = 60;
    }
    if (pl.blink > 0) pl.blink--;
    pl.walk += Math.abs(pl.vx);

    this.pickups();
    this.checkEra();

    if (pl.x + PW >= this.level.flagCol * TILE + 2) {
      this.state = 'end';
      pl.vx = 0;
    }

    // Camera leads slightly in the direction of travel
    const target = pl.x - W * 0.4 + pl.facing * 16;
    this.camX += (target - this.camX) * 0.12;
    this.camX = Math.max(0, Math.min(this.camX, this.level.cols * TILE - W));
  }

  private bump(col: number, row: number) {
    const key = `${col},${row}`;
    if (this.level.grid[row][col] !== '?' || this.usedBlocks.has(key)) return;
    this.usedBlocks.add(key);
    this.coinCount++;
    this.popups.push({ x: col * TILE, y: rowY(row) - 16, t: 30 });
  }

  private pickups() {
    const pl = this.player;
    const overlaps = (x: number, y: number, w: number, h: number) =>
      pl.x < x + w && pl.x + PW > x && pl.y < y + h && pl.y + PH > y;

    this.level.coins.forEach((c, i) => {
      if (this.coinsTaken.has(i)) return;
      if (overlaps(c.col * TILE + 3, rowY(c.row) + 2, 10, 12)) {
        this.coinsTaken.add(i);
        this.coinCount++;
        this.sparkle(c.col * TILE + 8, rowY(c.row) + 8, '#f7c843', 6);
      }
    });

    this.level.achievements.forEach((a, i) => {
      if (this.achTaken.has(i)) return;
      if (overlaps(a.col * TILE + 1, rowY(a.row) + 1, 14, 14)) {
        this.achTaken.add(i);
        this.sparkle(a.col * TILE + 8, rowY(a.row) + 8, '#ffffff', 14);
        if (!this.unlocked.has(a.id)) {
          this.unlocked.add(a.id);
          this.toasts.push({ id: a.id, t: 200 });
          this.onUnlock(a.id);
        }
      }
    });
  }

  private checkEra() {
    const s = this.sectionAt(Math.floor((this.player.x + PW / 2) / TILE));
    if (s.era === this.era) return;
    this.prevEra = this.era;
    this.era = s.era;
    this.fade = 0;
    this.showBanner(s.era);
    const outfit = ERAS.find((e) => e.id === s.era)!.outfit;
    if (outfit !== this.player.outfit) {
      this.player.outfit = outfit;
      this.sparkle(this.player.x + PW / 2, this.player.y + PH / 2, '#ffffff', 16);
    }
  }

  private showBanner(id: Era) {
    const era = ERAS.find((e) => e.id === id)!;
    this.banner = { title: era.title, sub: era.when, t: 150 };
  }

  private sparkle(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.particles.push({ x, y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.4, life: 22, color });
    }
  }

  private updateEffects() {
    if (this.fade < 1) this.fade = Math.min(1, this.fade + 1 / 36);
    if (this.banner.t > 0) this.banner.t--;
    for (const q of this.particles) {
      q.x += q.vx;
      q.y += q.vy;
      q.vx *= 0.92;
      q.vy *= 0.92;
      q.life--;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const q of this.popups) q.t--;
    this.popups = this.popups.filter((q) => q.t > 0);
    if (this.toasts[0] && --this.toasts[0].t <= 0) this.toasts.shift();
  }

  /* ---------------- drawing ---------------- */

  private render() {
    const { p } = this;
    const ctx = p.ctx;
    const cam = Math.round(this.camX);

    // Backdrop with parallax, cross-fading between eras
    const drawBg = (era: Era) => {
      const off = -Math.round((cam * 0.35) % BG_W);
      ctx.drawImage(this.bgs[era], off, 0);
      ctx.drawImage(this.bgs[era], off + BG_W, 0);
    };
    if (this.prevEra && this.fade < 1) {
      drawBg(this.prevEra);
      ctx.globalAlpha = this.fade;
      drawBg(this.era);
      ctx.globalAlpha = 1;
    } else drawBg(this.era);

    ctx.drawImage(this.tiles, cam, 0, W, H, 0, 0, W, H);

    const visible = (x: number) => x > cam - 32 && x < cam + W + 32;
    const bob = (i: number) => Math.round(Math.sin(this.frame / 14 + i) * 1.5);

    // Era signposts
    for (const s of this.level.sections) {
      const x = (s.from + 1) * TILE;
      if (!visible(x)) continue;
      this.drawSign(x - cam, rowY(9), ERAS.find((e) => e.id === s.era)!.sign);
    }

    // "?" blocks
    this.level.grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell !== '?' || !visible(c * TILE)) return;
        const x = c * TILE - cam;
        if (this.usedBlocks.has(`${c},${r}`)) {
          p.rect(x, rowY(r), TILE, TILE, '#1a1626');
          p.rect(x + 1, rowY(r) + 1, TILE - 2, TILE - 2, '#a8763a');
          p.rect(x + 2, rowY(r) + 2, TILE - 4, 1, '#c99a5a');
        } else p.sprite(ITEMS.block, ITEM_PALETTE, x, rowY(r));
      })
    );

    // Coins and achievements
    this.level.coins.forEach((c, i) => {
      if (this.coinsTaken.has(i) || !visible(c.col * TILE)) return;
      p.sprite(ITEMS.coin, ITEM_PALETTE, c.col * TILE - cam, rowY(c.row) + bob(i));
    });
    this.level.achievements.forEach((a, i) => {
      if (this.achTaken.has(i) || !visible(a.col * TILE)) return;
      const x = a.col * TILE - cam;
      const y = rowY(a.row) + bob(i * 2);
      const pulse = this.frame % 40 < 20;
      p.rect(x - 2, y - 2, 20, 20, pulse ? 'rgba(255,240,170,0.35)' : 'rgba(255,240,170,0.18)');
      p.sprite(ITEMS[this.info[a.id].icon] ?? ITEMS.star, ITEM_PALETTE, x, y);
      if (pulse) p.px(x + 14, y + 1, '#ffffff');
    });

    // Goal flag at "today"
    const fx = this.level.flagCol * TILE - cam;
    if (fx > -32 && fx < W + 32) {
      p.rect(fx + 2, rowY(3), 2, rowY(9) - rowY(3), '#c9d0da');
      p.rect(fx + 1, rowY(3) - 2, 4, 3, '#f7c843');
      for (let j = 0; j < 12; j++) p.rect(fx + 4, rowY(3) + 2 + j, 16 - Math.abs(6 - j) * 1.5, 1, j % 4 < 2 ? '#3fb24f' : '#56c867');
      p.rect(fx - 1, rowY(9) - 4, 8, 4, '#8792a3');
    }

    this.drawPlayer(cam);

    for (const q of this.particles) p.rect(q.x - cam, q.y, 2, 2, q.color);
    for (const q of this.popups) {
      p.sprite(ITEMS.coin, ITEM_PALETTE, q.x - cam, q.y - (30 - q.t));
    }

    this.drawHud();
    if (this.state === 'title') this.drawTitle();
    if (this.state === 'end') this.drawEnd();
  }

  private drawSign(x: number, groundY: number, text: string) {
    const { p } = this;
    const w = textWidth(text) + 6;
    p.rect(x + 7, groundY - 14, 2, 14, '#5e3b1a');
    p.rect(x + 8 - w / 2, groundY - 24, w, 11, '#1a1626');
    p.rect(x + 9 - w / 2, groundY - 23, w - 2, 9, '#8a5a2b');
    p.text(text, x + 11 - w / 2, groundY - 21, '#fff1a8');
  }

  private drawPlayer(cam: number) {
    const pl = this.player;
    if (pl.blink > 0 && this.frame % 6 < 3) return;
    let frame: Frame = 'idle';
    if (!pl.onGround && this.state === 'play') frame = 'jump';
    else if (Math.abs(pl.vx) > 0.2) frame = (['walk1', 'idle', 'walk2', 'idle'] as const)[Math.floor(pl.walk / 7) % 4];
    this.p.sprite(playerFrame(pl.outfit, frame), OUTFIT_PALETTE[pl.outfit], Math.round(pl.x - 3 - cam), Math.round(pl.y - 2), pl.facing < 0);
  }

  private panel(x: number, y: number, w: number, h: number) {
    this.p.rect(x, y, w, h, '#1a1626');
    this.p.rect(x + 1, y + 1, w - 2, h - 2, '#2a2440');
    this.p.rect(x + 1, y + 1, w - 2, 1, '#4a4170');
  }

  private drawHud() {
    const { p } = this;
    if (this.state === 'title') return;
    // coins
    const coins = `X${this.coinCount}`;
    this.panel(4, 4, textWidth(coins) + 26, 20);
    p.sprite(ITEMS.coin, ITEM_PALETTE, 5, 6);
    p.text(coins, 22, 12, '#ffffff');
    // achievements
    const label = `${this.unlocked.size}/${Object.keys(this.info).length}`;
    const w = textWidth(label) + 26;
    this.panel(W - 4 - w, 4, w, 20);
    p.sprite(ITEMS.star, ITEM_PALETTE, W - 3 - w, 5);
    p.text(label, W - 4 - w + 20, 12, '#f7c843');

    // Era banner
    if (this.banner.t > 0 && (this.banner.t > 20 || this.frame % 4 < 2)) {
      const t = pixelText(this.banner.title);
      const bw = Math.max(textWidth(t), textWidth(this.banner.sub)) + 16;
      this.panel(W / 2 - bw / 2, 24, bw, 22);
      p.text(t, W / 2 - textWidth(t) / 2, 28, '#ffffff');
      p.text(this.banner.sub, W / 2 - textWidth(pixelText(this.banner.sub)) / 2, 37, '#f7c843');
    }

    // Achievement toast
    const toast = this.toasts[0];
    if (toast) {
      const a = this.info[toast.id];
      const title = pixelText(a.title).slice(0, 52);
      const tw = Math.max(textWidth(title), textWidth('ACHIEVEMENT UNLOCKED!')) + 30;
      const y = H - 36 + (toast.t > 185 ? (toast.t - 185) * 2 : 0);
      p.rect(W / 2 - tw / 2 - 1, y - 1, tw + 2, 26, '#f7c843');
      this.panel(W / 2 - tw / 2, y, tw, 24);
      p.sprite(ITEMS[a.icon] ?? ITEMS.star, ITEM_PALETTE, W / 2 - tw / 2 + 4, y + 4);
      p.text('ACHIEVEMENT UNLOCKED!', W / 2 - tw / 2 + 24, y + 5, '#f7c843');
      p.text(title, W / 2 - tw / 2 + 24, y + 14, '#ffffff');
    }
  }

  private drawCentered(text: string, y: number, color: string, scale = 1) {
    const t = pixelText(text);
    this.p.text(t, Math.round(W / 2 - textWidth(t, scale) / 2), y, color, scale);
  }

  private drawTitle() {
    const { p } = this;
    p.rect(0, 0, W, H, 'rgba(10, 8, 20, 0.45)');
    this.panel(40, 40, 240, 92);
    this.drawCentered('BEYOND RESEARCH', 50, '#f7c843', 2);
    this.drawCentered('A PLATFORMER ABOUT MY YEARS OUTSIDE THE LAB', 68, '#ffffff');
    this.drawCentered('COLLECT THE ACHIEVEMENTS, 2022 TO TODAY', 78, '#c9c3e6');
    if (this.frame % 60 < 40) this.drawCentered('PRESS ENTER, CLICK OR TAP TO PLAY', 96, '#7fe07f');
    this.drawCentered('ARROWS OR WASD: MOVE   SPACE: JUMP', 114, '#9d97b8');
  }

  private drawEnd() {
    const { p } = this;
    p.rect(0, 0, W, H, 'rgba(10, 8, 20, 0.5)');
    this.panel(50, 40, 220, 90);
    this.drawCentered("YOU'VE REACHED TODAY!", 50, '#f7c843', 1);
    this.drawCentered(`ACHIEVEMENTS: ${this.unlocked.size}/${Object.keys(this.info).length}`, 66, '#ffffff');
    this.drawCentered(`COINS: ${this.coinCount}`, 76, '#ffffff');
    this.drawCentered('THE STORY CONTINUES...', 92, '#c9c3e6');
    if (this.frame % 60 < 40) this.drawCentered('ENTER, CLICK OR TAP TO PLAY AGAIN', 110, '#7fe07f');
  }
}
