import type { MidiFrame } from "./types"

type NoteSeed = readonly [name: string, midi: number, velocity?: number, duration?: number]

function note(
  name: string,
  midi: number,
  velocity = 0.8,
  duration = 0.25,
): { name: string; midi: number; velocity: number; duration: number } {
  return { name, midi, velocity, duration }
}

function singleNoteFrames(sequence: readonly NoteSeed[], step: number): MidiFrame[] {
  return sequence.map(([name, midi, velocity = 0.8, duration = step], index) => ({
    time: Number((index * step).toFixed(3)),
    notes: [note(name, midi, velocity, duration)],
  }))
}

const bachPreludePattern: NoteSeed[][] = [
  [["C3", 48], ["E3", 52], ["G3", 55], ["C4", 60], ["E4", 64], ["G4", 67], ["C5", 72], ["G4", 67]],
  [["C3", 48], ["E3", 52], ["A3", 57], ["C4", 60], ["E4", 64], ["A4", 69], ["C5", 72], ["A4", 69]],
  [["D3", 50], ["F3", 53], ["A3", 57], ["D4", 62], ["F4", 65], ["A4", 69], ["D5", 74], ["A4", 69]],
  [["B2", 47], ["D3", 50], ["G3", 55], ["B3", 59], ["D4", 62], ["G4", 67], ["B4", 71], ["G4", 67]],
  [["E3", 52], ["G3", 55], ["C4", 60], ["E4", 64], ["G4", 67], ["C5", 72], ["E5", 76], ["C5", 72]],
  [["A2", 45], ["E3", 52], ["A3", 57], ["C4", 60], ["E4", 64], ["A4", 69], ["C5", 72], ["A4", 69]],
  [["D3", 50], ["A3", 57], ["D4", 62], ["F4", 65], ["A4", 69], ["D5", 74], ["F5", 77], ["D5", 74]],
  [["G2", 43], ["D3", 50], ["G3", 55], ["B3", 59], ["D4", 62], ["G4", 67], ["B4", 71], ["G4", 67]],
]

const canonArpeggioPattern: NoteSeed[][] = [
  [["D3", 50], ["A3", 57], ["D4", 62], ["F#4", 66]],
  [["A2", 45], ["E3", 52], ["A3", 57], ["C#4", 61]],
  [["B2", 47], ["F#3", 54], ["B3", 59], ["D4", 62]],
  [["F#2", 42], ["C#3", 49], ["F#3", 54], ["A3", 57]],
  [["G2", 43], ["D3", 50], ["G3", 55], ["B3", 59]],
  [["D2", 38], ["A2", 45], ["D3", 50], ["F#3", 54]],
  [["G2", 43], ["D3", 50], ["G3", 55], ["B3", 59]],
  [["A2", 45], ["E3", 52], ["A3", 57], ["C#4", 61]],
]

const gymnopediePattern: NoteSeed[] = [
  ["D4", 62], ["G4", 67], ["A4", 69], ["B4", 71], ["A4", 69], ["G4", 67], ["F#4", 66], ["D4", 62],
  ["E4", 64], ["A4", 69], ["B4", 71], ["C#5", 73], ["B4", 71], ["A4", 69], ["G4", 67], ["E4", 64],
  ["D4", 62], ["G4", 67], ["A4", 69], ["B4", 71], ["D5", 74], ["B4", 71], ["A4", 69], ["G4", 67],
  ["F#4", 66], ["E4", 64], ["D4", 62], ["C#4", 61], ["B3", 59], ["A3", 57], ["G3", 55], ["D4", 62],
]

const minuetInGPattern: NoteSeed[] = [
  ["D4", 62], ["G4", 67], ["A4", 69], ["B4", 71], ["C5", 72], ["D5", 74], ["G4", 67], ["G4", 67],
  ["C5", 72], ["E5", 76], ["D5", 74], ["C5", 72], ["B4", 71], ["A4", 69], ["B4", 71], ["G4", 67],
  ["D4", 62], ["G4", 67], ["A4", 69], ["B4", 71], ["C5", 72], ["D5", 74], ["G4", 67], ["G4", 67],
  ["E5", 76], ["C5", 72], ["D5", 74], ["E5", 76], ["F#5", 78], ["G5", 79], ["G5", 79], ["D5", 74],
]

const greensleevesPattern: NoteSeed[] = [
  ["A4", 69], ["C5", 72], ["D5", 74], ["E5", 76], ["F5", 77], ["E5", 76], ["D5", 74], ["B4", 71],
  ["G4", 67], ["A4", 69], ["B4", 71], ["C5", 72], ["D5", 74], ["E5", 76], ["F5", 77], ["E5", 76],
  ["D5", 74], ["C5", 72], ["B4", 71], ["A4", 69], ["G4", 67], ["A4", 69], ["B4", 71], ["G4", 67],
  ["A4", 69], ["C5", 72], ["D5", 74], ["E5", 76], ["F5", 77], ["E5", 76], ["D5", 74], ["C5", 72],
]

export const presetMelodies: Record<string, { name: string; description: string; frames: MidiFrame[] }> = {
  "bach-prelude-c-major": {
    name: "Bach - Prelude in C Major",
    description: "Simplified rolling arpeggios inspired by BWV 846",
    frames: singleNoteFrames(bachPreludePattern.flat(), 0.25),
  },
  "ode-to-joy": {
    name: "Ode to Joy",
    description: "Beethoven's famous melody from Symphony No. 9",
    frames: [
      { time: 0, notes: [note("E4", 64)] },
      { time: 0.5, notes: [note("E4", 64)] },
      { time: 1, notes: [note("F4", 65)] },
      { time: 1.5, notes: [note("G4", 67)] },
      { time: 2, notes: [note("G4", 67)] },
      { time: 2.5, notes: [note("F4", 65)] },
      { time: 3, notes: [note("E4", 64)] },
      { time: 3.5, notes: [note("D4", 62)] },
      { time: 4, notes: [note("C4", 60)] },
      { time: 4.5, notes: [note("C4", 60)] },
      { time: 5, notes: [note("D4", 62)] },
      { time: 5.5, notes: [note("E4", 64)] },
      { time: 6, notes: [note("E4", 64)] },
      { time: 7, notes: [note("D4", 62)] },
      { time: 7.5, notes: [note("D4", 62)] },
      { time: 8, notes: [note("E4", 64)] },
      { time: 8.5, notes: [note("E4", 64)] },
      { time: 9, notes: [note("F4", 65)] },
      { time: 9.5, notes: [note("G4", 67)] },
      { time: 10, notes: [note("G4", 67)] },
      { time: 10.5, notes: [note("F4", 65)] },
      { time: 11, notes: [note("E4", 64)] },
      { time: 11.5, notes: [note("D4", 62)] },
      { time: 12, notes: [note("C4", 60)] },
      { time: 12.5, notes: [note("C4", 60)] },
      { time: 13, notes: [note("D4", 62)] },
      { time: 13.5, notes: [note("E4", 64)] },
      { time: 14, notes: [note("D4", 62)] },
      { time: 15, notes: [note("C4", 60)] },
      { time: 15.5, notes: [note("C4", 60)] },
    ],
  },
  "canon-in-d": {
    name: "Canon in D (Pachelbel)",
    description: "The iconic Canon progression with chords",
    frames: [
      { time: 0, notes: [note("D4", 62), note("F#4", 66), note("A4", 69)] },
      { time: 1, notes: [note("A3", 57), note("C#4", 61), note("E4", 64)] },
      { time: 2, notes: [note("B3", 59), note("D4", 62), note("F#4", 66)] },
      { time: 3, notes: [note("F#3", 54), note("A3", 57), note("C#4", 61)] },
      { time: 4, notes: [note("G3", 55), note("B3", 59), note("D4", 62)] },
      { time: 5, notes: [note("D3", 50), note("F#3", 54), note("A3", 57)] },
      { time: 6, notes: [note("G3", 55), note("B3", 59), note("D4", 62)] },
      { time: 7, notes: [note("A3", 57), note("C#4", 61), note("E4", 64)] },
      { time: 8, notes: [note("D4", 62), note("F#4", 66), note("A4", 69)] },
      { time: 9, notes: [note("A3", 57), note("C#4", 61), note("E4", 64)] },
      { time: 10, notes: [note("B3", 59), note("D4", 62), note("F#4", 66)] },
      { time: 11, notes: [note("F#3", 54), note("A3", 57), note("C#4", 61)] },
      { time: 12, notes: [note("G3", 55), note("B3", 59), note("D4", 62)] },
      { time: 13, notes: [note("D3", 50), note("F#3", 54), note("A3", 57)] },
      { time: 14, notes: [note("G3", 55), note("B3", 59), note("D4", 62)] },
      { time: 15, notes: [note("A3", 57), note("C#4", 61), note("E4", 64)] },
    ],
  },
  "canon-in-d-arpeggio": {
    name: "Canon in D (Arpeggio)",
    description: "A more flowing Canon progression arranged as broken chords",
    frames: singleNoteFrames(canonArpeggioPattern.flat(), 0.5),
  },
  "gymnopedie-no-1": {
    name: "Gymnopedie No. 1",
    description: "A calm, spacious simplified line inspired by Satie",
    frames: singleNoteFrames(gymnopediePattern, 0.75),
  },
  "minuet-in-g": {
    name: "Minuet in G",
    description: "A bright, classical dance tune with a steady melodic flow",
    frames: singleNoteFrames(minuetInGPattern, 0.5),
  },
  greensleeves: {
    name: "Greensleeves",
    description: "A lyrical folk melody that loops gently for longer practice",
    frames: singleNoteFrames(greensleevesPattern, 0.5),
  },
  "fur-elise": {
    name: "Für Elise (Theme)",
    description: "The famous opening theme by Beethoven",
    frames: [
      { time: 0, notes: [note("E5", 76)] },
      { time: 0.25, notes: [note("D#5", 75)] },
      { time: 0.5, notes: [note("E5", 76)] },
      { time: 0.75, notes: [note("D#5", 75)] },
      { time: 1, notes: [note("E5", 76)] },
      { time: 1.25, notes: [note("B4", 71)] },
      { time: 1.5, notes: [note("D5", 74)] },
      { time: 1.75, notes: [note("C5", 72)] },
      { time: 2, notes: [note("A4", 69)] },
      { time: 3, notes: [note("C4", 60)] },
      { time: 3.25, notes: [note("E4", 64)] },
      { time: 3.5, notes: [note("A4", 69)] },
      { time: 4, notes: [note("B4", 71)] },
      { time: 5, notes: [note("E4", 64)] },
      { time: 5.25, notes: [note("G#4", 68)] },
      { time: 5.5, notes: [note("B4", 71)] },
      { time: 6, notes: [note("C5", 72)] },
      { time: 7, notes: [note("E5", 76)] },
      { time: 7.25, notes: [note("D#5", 75)] },
      { time: 7.5, notes: [note("E5", 76)] },
      { time: 7.75, notes: [note("D#5", 75)] },
      { time: 8, notes: [note("E5", 76)] },
      { time: 8.25, notes: [note("B4", 71)] },
      { time: 8.5, notes: [note("D5", 74)] },
      { time: 8.75, notes: [note("C5", 72)] },
      { time: 9, notes: [note("A4", 69)] },
    ],
  },
  "c-major-scale": {
    name: "C Major Scale",
    description: "Simple ascending and descending C major scale",
    frames: [
      { time: 0, notes: [note("C4", 60)] },
      { time: 0.5, notes: [note("D4", 62)] },
      { time: 1, notes: [note("E4", 64)] },
      { time: 1.5, notes: [note("F4", 65)] },
      { time: 2, notes: [note("G4", 67)] },
      { time: 2.5, notes: [note("A4", 69)] },
      { time: 3, notes: [note("B4", 71)] },
      { time: 3.5, notes: [note("C5", 72)] },
      { time: 4, notes: [note("C5", 72)] },
      { time: 4.5, notes: [note("B4", 71)] },
      { time: 5, notes: [note("A4", 69)] },
      { time: 5.5, notes: [note("G4", 67)] },
      { time: 6, notes: [note("F4", 65)] },
      { time: 6.5, notes: [note("E4", 64)] },
      { time: 7, notes: [note("D4", 62)] },
      { time: 7.5, notes: [note("C4", 60)] },
    ],
  },
}

export const presetList = Object.entries(presetMelodies).map(([id, data]) => ({
  id,
  name: data.name,
  description: data.description,
  frameCount: data.frames.length,
}))
