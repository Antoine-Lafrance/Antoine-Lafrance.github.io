// The eras the platformer moves through, in order. Each has a backdrop,
// ground tiles and the outfit the player wears.
import type { Outfit } from './sprites';

export type Era = 'montreal' | 'consulting' | 'mit' | 'belgium' | 'netherlands' | 'korea';

// `sign` is the short text on the signpost at the start of each era.
export const ERAS: { id: Era; title: string; when: string; sign: string; outfit: Outfit }[] = [
  { id: 'montreal', title: 'Montréal · Polytechnique', when: '2022', sign: '2022', outfit: 'casual' },
  { id: 'consulting', title: 'CCGP · Consulting', when: '2023–2024', sign: '2023', outfit: 'suit' },
  { id: 'mit', title: 'HackMIT · Cambridge', when: 'Sept 2025', sign: '2025', outfit: 'casual' },
  { id: 'belgium', title: 'PolyMonde · Belgium', when: '2025–2026', sign: 'BE', outfit: 'explorer' },
  { id: 'netherlands', title: 'PolyMonde · Netherlands', when: '2025–2026', sign: 'NL', outfit: 'explorer' },
  { id: 'korea', title: 'PolyMonde · South Korea', when: 'Today', sign: 'KR', outfit: 'explorer' },
];
