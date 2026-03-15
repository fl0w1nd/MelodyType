import * as Tone from "tone"
import type { SynthType } from "./types"

let audioStarted = false

export async function ensureAudioStarted(): Promise<void> {
  if (audioStarted) return
  await Tone.start()
  audioStarted = true
}

export function createSynth(
  type: SynthType,
  volume = -6,
): Tone.PolySynth {
  const gain = new Tone.Volume(volume).toDestination()

  // Use type assertion for partial option objects - Tone.js types require
  // all properties but PolySynth actually accepts partials at runtime.
  const configs: Record<SynthType, Record<string, unknown>> = {
    piano: {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 1.2 },
    },
    strings: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 1.5 },
    },
    synth: {
      oscillator: { type: "square8" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.8 },
    },
    musicBox: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.0, release: 1.0 },
    },
    bell: {
      oscillator: { type: "sine4" },
      envelope: { attack: 0.001, decay: 0.8, sustain: 0.05, release: 2.0 },
    },
  }

  const synth = new Tone.PolySynth(Tone.Synth)
  synth.set(configs[type] as Partial<Tone.SynthOptions>)
  synth.connect(gain)
  return synth
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export function midiNumberToNote(midi: number): string {
  if (midi < 0 || midi > 127) return "C4"
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

export function isValidMidiNote(midi: number): boolean {
  return midi >= 0 && midi <= 127
}
