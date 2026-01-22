export interface Chord {
  id: string;
  roman: string;
  name: string;
  mood: string; // e.g., "Happy", "Sad" - easier for non-musicians
  notes: string[]; // e.g., ["C", "E", "G"]
  root: string;
  type: 'major' | 'minor' | 'diminished';
  color: string; // Tailwind color class for UI
}

export interface Note {
  pitch: string; // e.g., "C4"
}

// 4 bars * 8 eighth notes = 32 steps
export type Melody = (string | null)[];

export type Progression = [Chord, Chord, Chord, Chord];

export type NoteMode = 'chord' | 'scale' | 'chromatic';