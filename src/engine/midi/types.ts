export interface MidiNote {
  name: string
  midi: number
  velocity: number
  duration: number
}

export interface MidiFrame {
  time: number
  notes: MidiNote[]
}

export interface MidiFileInfo {
  id?: number
  name: string
  frameCount: number
  isPreset: boolean
  uploadedAt: number
}

export type SynthType = "piano" | "strings" | "synth" | "musicBox" | "bell"

export interface MidiConfig {
  volume: number
  synthType: SynthType
  loopMode: "loop" | "once" | "random"
  isEnabled: boolean
}

export const defaultMidiConfig: MidiConfig = {
  volume: -6,
  synthType: "piano",
  loopMode: "loop",
  isEnabled: true,
}
