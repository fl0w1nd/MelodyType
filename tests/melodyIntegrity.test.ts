import { describe, expect, it } from "vitest"
import {
  createMelodyIntegrityTracker,
  DEFAULT_MELODY_INTEGRITY,
  updateMelodyIntegrityTracker,
} from "../src/engine/midi/melodyIntegrity"
import type { MelodyState } from "../src/engine/midi/types"

function makeState(overrides: Partial<MelodyState> = {}): MelodyState {
  return {
    fuel: 0,
    maxFuel: 10,
    flowState: "idle",
    frameIndex: 0,
    totalFrames: 16,
    ...overrides,
  }
}

describe("melodyIntegrity", () => {
  it("stays high after a brief fade and stall", () => {
    const tracker = createMelodyIntegrityTracker()

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState(),
      nextState: makeState({ fuel: 6, flowState: "flowing" }),
      now: 0,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 6, flowState: "flowing" }),
      nextState: makeState({ fuel: 1.5, flowState: "fading" }),
      now: 4000,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 1.5, flowState: "fading" }),
      nextState: makeState({ fuel: 0, flowState: "stalled" }),
      now: 4200,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 0, flowState: "stalled" }),
      nextState: makeState({ fuel: 4, flowState: "flowing" }),
      now: 4500,
    })

    const integrity = updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 4, flowState: "flowing" }),
      nextState: makeState({ fuel: 5, flowState: "flowing" }),
      now: 10000,
    })

    expect(integrity).toBeGreaterThan(95)
  })

  it("drops meaningfully after prolonged stalls", () => {
    const tracker = createMelodyIntegrityTracker()

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState(),
      nextState: makeState({ fuel: 5, flowState: "flowing" }),
      now: 0,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 5, flowState: "flowing" }),
      nextState: makeState({ fuel: 1.2, flowState: "fading" }),
      now: 2000,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 1.2, flowState: "fading" }),
      nextState: makeState({ fuel: 0, flowState: "stalled" }),
      now: 3000,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 0, flowState: "stalled" }),
      nextState: makeState({ fuel: 0, flowState: "stalled" }),
      now: 7000,
    })

    const integrity = updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 0, flowState: "stalled" }),
      nextState: makeState({ fuel: 5, flowState: "flowing" }),
      now: 8000,
    })

    expect(integrity).toBeLessThan(70)
  })

  it("ignores expected resets instead of counting them as failures", () => {
    const tracker = createMelodyIntegrityTracker()

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState(),
      nextState: makeState({ fuel: 6, flowState: "flowing" }),
      now: 0,
    })

    const duringReset = updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 6, flowState: "flowing" }),
      nextState: makeState({ fuel: 0, flowState: "idle" }),
      now: 2500,
      suspend: true,
    })

    updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 0, flowState: "idle" }),
      nextState: makeState({ fuel: 6, flowState: "flowing" }),
      now: 3000,
    })

    const resumed = updateMelodyIntegrityTracker({
      tracker,
      previousState: makeState({ fuel: 6, flowState: "flowing" }),
      nextState: makeState({ fuel: 5, flowState: "flowing" }),
      now: 5000,
    })

    expect(duringReset).toBe(DEFAULT_MELODY_INTEGRITY)
    expect(resumed).toBe(DEFAULT_MELODY_INTEGRITY)
  })
})
