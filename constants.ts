import { Chord, Progression } from './types';

export const STEPS_PER_BAR = 8;
export const NUM_BARS = 4;
export const TOTAL_STEPS = STEPS_PER_BAR * NUM_BARS;
export const SUSTAIN_TOKEN = 'HOLD';

export const SCALE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Palette of colors for Material Design feel - refined for 2025 Sleek
// using rings instead of borders for softer focus
const COLORS = {
  I: 'bg-rose-50 text-rose-600 ring-rose-100',
  ii: 'bg-orange-50 text-orange-600 ring-orange-100',
  iii: 'bg-amber-50 text-amber-600 ring-amber-100',
  IV: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  V: 'bg-sky-50 text-sky-600 ring-sky-100',
  vi: 'bg-violet-50 text-violet-600 ring-violet-100',
  vii: 'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100',
};

// Simplified and Translated for accessibility
export const CHORDS_C_MAJOR: Chord[] = [
  { id: 'I', roman: 'I', name: '도 (C)', mood: '행복해요', notes: ['C', 'E', 'G'], root: 'C', type: 'major', color: COLORS.I },
  { id: 'ii', roman: 'ii', name: '레 (Dm)', mood: '차분해요', notes: ['D', 'F', 'A'], root: 'D', type: 'minor', color: COLORS.ii },
  { id: 'iii', roman: 'iii', name: '미 (Em)', mood: '깊어요', notes: ['E', 'G', 'B'], root: 'E', type: 'minor', color: COLORS.iii },
  { id: 'IV', roman: 'IV', name: '파 (F)', mood: '씩씩해요', notes: ['F', 'A', 'C'], root: 'F', type: 'major', color: COLORS.IV },
  { id: 'V', roman: 'V', name: '솔 (G)', mood: '신나요', notes: ['G', 'B', 'D'], root: 'G', type: 'major', color: COLORS.V },
  { id: 'vi', roman: 'vi', name: '라 (Am)', mood: '슬퍼요', notes: ['A', 'C', 'E'], root: 'A', type: 'minor', color: COLORS.vi },
  { id: 'vii', roman: 'vii°', name: '시 (Bdim)', mood: '긴장돼요', notes: ['B', 'D', 'F'], root: 'B', type: 'diminished', color: COLORS.vii },
];

// Piano Roll Range (C3 to B4) - 2 octaves approx
export const PITCH_ROWS = [
  'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4',
  'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3', 'C3'
];

export const DEFAULT_PROGRESSION: Progression = [
  CHORDS_C_MAJOR[0], // I
  CHORDS_C_MAJOR[5], // vi
  CHORDS_C_MAJOR[3], // IV
  CHORDS_C_MAJOR[4], // V
];