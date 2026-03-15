import { Midi } from "@tonejs/midi"
import type { MidiFrame, MidiNote } from "./types"

export function parseMidiToFrames(
  arrayBuffer: ArrayBuffer,
  quantizeMs = 50,
): MidiFrame[] {
  const midi = new Midi(arrayBuffer)
  const allNotes: Array<{ time: number; note: MidiNote }> = []

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      allNotes.push({
        time: note.time,
        note: {
          name: note.name,
          midi: note.midi,
          velocity: note.velocity,
          duration: note.duration,
        },
      })
    }
  }

  allNotes.sort((a, b) => a.time - b.time)

  if (allNotes.length === 0) return []

  const frames: MidiFrame[] = []
  let currentTime = allNotes[0].time
  let currentNotes: MidiNote[] = [allNotes[0].note]

  for (let i = 1; i < allNotes.length; i++) {
    const entry = allNotes[i]
    if (Math.abs(entry.time - currentTime) <= quantizeMs / 1000) {
      currentNotes.push(entry.note)
    } else {
      frames.push({ time: currentTime, notes: [...currentNotes] })
      currentTime = entry.time
      currentNotes = [entry.note]
    }
  }

  if (currentNotes.length > 0) {
    frames.push({ time: currentTime, notes: currentNotes })
  }

  return frames
}

export function getMidiInfo(arrayBuffer: ArrayBuffer) {
  const midi = new Midi(arrayBuffer)
  let totalNotes = 0
  for (const track of midi.tracks) {
    totalNotes += track.notes.length
  }
  return {
    name: midi.name || "Untitled",
    tracks: midi.tracks.length,
    totalNotes,
    duration: midi.duration,
    bpm: midi.header.tempos.length > 0 ? midi.header.tempos[0].bpm : 120,
  }
}
