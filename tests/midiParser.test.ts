import { describe, it, expect, vi } from "vitest"

// We mock @tonejs/midi because it requires ArrayBuffer parsing internals.
// Instead we test parseMidiToFrames via a shim that injects known note data.
vi.mock("@tonejs/midi", () => ({
  Midi: class FakeMidi {
    tracks: Array<{ notes: Array<{ time: number; name: string; midi: number; velocity: number; duration: number }> }>
    name: string
    duration: number
    header: { tempos: Array<{ bpm: number }> }

    constructor(_buffer: ArrayBuffer) {
      // Decode a simple JSON payload from the ArrayBuffer for test control
      const text = new TextDecoder().decode(_buffer)
      const data = JSON.parse(text)
      this.tracks = data.tracks ?? []
      this.name = data.name ?? "Test"
      this.duration = data.duration ?? 0
      this.header = { tempos: data.tempos ?? [{ bpm: 120 }] }
    }
  },
}))

import { parseMidiToFrames, getMidiInfo } from "../src/engine/midi/midiParser"

function encode(data: object): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(data)).buffer as ArrayBuffer
}

describe("parseMidiToFrames", () => {
  it("should return empty array for MIDI with no notes", () => {
    const buf = encode({ tracks: [{ notes: [] }] })
    expect(parseMidiToFrames(buf)).toEqual([])
  })

  it("should return empty array for MIDI with no tracks", () => {
    const buf = encode({ tracks: [] })
    expect(parseMidiToFrames(buf)).toEqual([])
  })

  it("should parse a single note into one frame", () => {
    const buf = encode({
      tracks: [{
        notes: [{ time: 0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 }],
      }],
    })

    const frames = parseMidiToFrames(buf)
    expect(frames).toHaveLength(1)
    expect(frames[0].time).toBe(0)
    expect(frames[0].notes).toHaveLength(1)
    expect(frames[0].notes[0].name).toBe("C4")
  })

  it("should quantize simultaneous notes within quantizeMs into one frame", () => {
    const buf = encode({
      tracks: [{
        notes: [
          { time: 1.0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 },
          { time: 1.04, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 }, // within 50ms
          { time: 1.045, name: "G4", midi: 67, velocity: 0.8, duration: 0.25 }, // within 50ms
        ],
      }],
    })

    const frames = parseMidiToFrames(buf)
    expect(frames).toHaveLength(1)
    expect(frames[0].notes).toHaveLength(3)
  })

  it("should separate notes beyond quantizeMs into different frames", () => {
    const buf = encode({
      tracks: [{
        notes: [
          { time: 0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 },
          { time: 0.5, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 },
          { time: 1.0, name: "G4", midi: 67, velocity: 0.8, duration: 0.25 },
        ],
      }],
    })

    const frames = parseMidiToFrames(buf)
    expect(frames).toHaveLength(3)
  })

  // -----------------------------------------------------------------------
  // Critical: time normalization (the fix for leading silence)
  // -----------------------------------------------------------------------

  it("should normalize frame times so first frame starts at 0", () => {
    const buf = encode({
      tracks: [{
        notes: [
          { time: 5.0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 },
          { time: 5.5, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 },
          { time: 6.0, name: "G4", midi: 67, velocity: 0.8, duration: 0.25 },
        ],
      }],
    })

    const frames = parseMidiToFrames(buf)
    expect(frames).toHaveLength(3)
    expect(frames[0].time).toBe(0)
    expect(frames[1].time).toBeCloseTo(0.5, 5)
    expect(frames[2].time).toBeCloseTo(1.0, 5)
  })

  it("should handle very large leading silence (e.g. 30 seconds)", () => {
    const buf = encode({
      tracks: [{
        notes: [
          { time: 30.0, name: "A4", midi: 69, velocity: 0.8, duration: 0.5 },
          { time: 31.0, name: "B4", midi: 71, velocity: 0.8, duration: 0.5 },
        ],
      }],
    })

    const frames = parseMidiToFrames(buf)
    expect(frames[0].time).toBe(0)
    expect(frames[1].time).toBeCloseTo(1.0, 5)
  })

  it("should not shift if first frame already starts at 0", () => {
    const buf = encode({
      tracks: [{
        notes: [
          { time: 0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 },
          { time: 0.5, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 },
        ],
      }],
    })

    const frames = parseMidiToFrames(buf)
    expect(frames[0].time).toBe(0)
    expect(frames[1].time).toBe(0.5)
  })

  // -----------------------------------------------------------------------
  // Multi-track merging
  // -----------------------------------------------------------------------

  it("should merge notes from multiple tracks and sort by time", () => {
    const buf = encode({
      tracks: [
        {
          notes: [
            { time: 1.0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 },
            { time: 2.0, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 },
          ],
        },
        {
          notes: [
            { time: 0.5, name: "G4", midi: 67, velocity: 0.8, duration: 0.25 },
            { time: 1.5, name: "A4", midi: 69, velocity: 0.8, duration: 0.25 },
          ],
        },
      ],
    })

    const frames = parseMidiToFrames(buf)

    // Should be sorted by time, and normalized
    expect(frames.length).toBeGreaterThanOrEqual(4)
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].time).toBeGreaterThanOrEqual(frames[i - 1].time)
    }
    expect(frames[0].time).toBe(0) // normalized from 0.5
  })

  // -----------------------------------------------------------------------
  // Custom quantize
  // -----------------------------------------------------------------------

  it("should respect custom quantizeMs parameter", () => {
    const buf = encode({
      tracks: [{
        notes: [
          { time: 0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 },
          { time: 0.09, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 }, // 90ms apart
        ],
      }],
    })

    // Default quantize (50ms) → separate frames
    const framesSeparate = parseMidiToFrames(buf, 50)
    expect(framesSeparate).toHaveLength(2)

    // Large quantize (100ms) → merged into one frame
    const framesMerged = parseMidiToFrames(buf, 100)
    expect(framesMerged).toHaveLength(1)
    expect(framesMerged[0].notes).toHaveLength(2)
  })
})

describe("getMidiInfo", () => {
  it("should return basic info about the MIDI data", () => {
    const buf = encode({
      name: "Test Song",
      tracks: [
        { notes: [{ time: 0, name: "C4", midi: 60, velocity: 0.8, duration: 0.25 }] },
        { notes: [{ time: 0, name: "E4", midi: 64, velocity: 0.8, duration: 0.25 }] },
      ],
      duration: 10,
      tempos: [{ bpm: 140 }],
    })

    const info = getMidiInfo(buf)
    expect(info.name).toBe("Test Song")
    expect(info.tracks).toBe(2)
    expect(info.totalNotes).toBe(2)
    expect(info.duration).toBe(10)
    expect(info.bpm).toBe(140)
  })

  it("should fallback to 'Untitled' and 120 bpm", () => {
    const buf = encode({
      name: "",
      tracks: [],
      duration: 0,
      tempos: [],
    })

    const info = getMidiInfo(buf)
    expect(info.name).toBe("Untitled")
    expect(info.bpm).toBe(120)
  })
})
