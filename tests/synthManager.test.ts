import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockContext, mockStart } = vi.hoisted(() => ({
  mockContext: { state: "suspended" as string },
  mockStart: vi.fn(() => Promise.resolve()),
}))

const volumeInstances: Array<{ toDestination: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }> = []
const synthInstances: Array<{ set: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }> = []

vi.mock("tone", () => ({
  getContext: () => mockContext,
  start: mockStart,
  Synth: class Synth {},
  Volume: class MockVolume {
    toDestination = vi.fn(() => this)
    dispose = vi.fn()
    constructor(public volumeArg: number) {
      volumeInstances.push(this)
    }
  },
  PolySynth: class MockPolySynth {
    set = vi.fn()
    connect = vi.fn()
    dispose = vi.fn()
    constructor() {
      synthInstances.push(this)
    }
  },
}))

import {
  isAudioRunning,
  ensureAudioStarted,
  createSynth,
  disposeSynth,
  midiNumberToNote,
  isValidMidiNote,
} from "../src/engine/midi/synthManager"

beforeEach(() => {
  vi.clearAllMocks()
  volumeInstances.length = 0
  synthInstances.length = 0
  mockContext.state = "suspended"
})

describe("isAudioRunning", () => {
  it("returns false when AudioContext is suspended", () => {
    mockContext.state = "suspended"
    expect(isAudioRunning()).toBe(false)
  })

  it("returns true when AudioContext is running", () => {
    mockContext.state = "running"
    expect(isAudioRunning()).toBe(true)
  })
})

describe("ensureAudioStarted", () => {
  it("calls Tone.start() when context is not running", async () => {
    mockContext.state = "suspended"
    await ensureAudioStarted()
    expect(mockStart).toHaveBeenCalledOnce()
  })

  it("skips Tone.start() when context is already running", async () => {
    mockContext.state = "running"
    await ensureAudioStarted()
    expect(mockStart).not.toHaveBeenCalled()
  })

  it("propagates errors from Tone.start()", async () => {
    mockContext.state = "suspended"
    mockStart.mockRejectedValueOnce(new Error("not allowed"))
    await expect(ensureAudioStarted()).rejects.toThrow("not allowed")
  })
})

describe("createSynth", () => {
  it("creates a PolySynth connected to a Volume gain node", () => {
    const synth = createSynth("piano")
    expect(synthInstances).toHaveLength(1)
    expect(synth.set).toHaveBeenCalledOnce()
    expect(synth.connect).toHaveBeenCalledWith(volumeInstances[0])
  })

  it("applies default volume of -6", () => {
    createSynth("piano")
    expect(volumeInstances[0].volumeArg).toBe(-6)
  })

  it("applies custom volume", () => {
    createSynth("piano", -12)
    expect(volumeInstances[0].volumeArg).toBe(-12)
  })
})

describe("disposeSynth", () => {
  it("disposes synth and its gain node", () => {
    const synth = createSynth("piano")
    disposeSynth(synth)
    expect(synth.dispose).toHaveBeenCalledOnce()
    expect(volumeInstances[0].dispose).toHaveBeenCalledOnce()
  })

  it("does nothing for null input", () => {
    expect(() => disposeSynth(null)).not.toThrow()
  })
})

describe("midiNumberToNote", () => {
  it("converts MIDI 60 to C4", () => {
    expect(midiNumberToNote(60)).toBe("C4")
  })

  it("converts MIDI 69 to A4", () => {
    expect(midiNumberToNote(69)).toBe("A4")
  })

  it("converts MIDI 0 to C-1", () => {
    expect(midiNumberToNote(0)).toBe("C-1")
  })

  it("converts MIDI 127 to G9", () => {
    expect(midiNumberToNote(127)).toBe("G9")
  })

  it("returns C4 for out-of-range values", () => {
    expect(midiNumberToNote(-1)).toBe("C4")
    expect(midiNumberToNote(128)).toBe("C4")
  })
})

describe("isValidMidiNote", () => {
  it("returns true for valid range 0-127", () => {
    expect(isValidMidiNote(0)).toBe(true)
    expect(isValidMidiNote(60)).toBe(true)
    expect(isValidMidiNote(127)).toBe(true)
  })

  it("returns false for out-of-range values", () => {
    expect(isValidMidiNote(-1)).toBe(false)
    expect(isValidMidiNote(128)).toBe(false)
  })
})
