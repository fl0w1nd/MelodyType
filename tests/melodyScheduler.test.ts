import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MelodyScheduler } from "../src/engine/midi/melodyScheduler"
import type { MelodyCarryoverState } from "../src/engine/midi/melodyScheduler"
import type { MidiFrame, MelodyState } from "../src/engine/midi/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFrames(count: number, spacing = 0.5): MidiFrame[] {
  return Array.from({ length: count }, (_, i) => ({
    time: i * spacing,
    notes: [{ name: "C4", midi: 60, velocity: 0.8, duration: 0.25 }],
  }))
}

function makeSynth() {
  return {
    triggerAttackRelease: vi.fn(),
    volume: { value: 0, rampTo: vi.fn() },
    dispose: vi.fn(),
  } as unknown as import("tone").PolySynth
}

/**
 * Since MelodyScheduler uses `requestAnimationFrame` internally, we stub
 * it with a manually-advanceable version so tests are synchronous.
 */
function installFakeRAF() {
  const queue: Array<{ id: number; cb: FrameRequestCallback }> = []
  let nextId = 1

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.push({ id, cb })
    return id
  })

  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    const idx = queue.findIndex((e) => e.id === id)
    if (idx >= 0) queue.splice(idx, 1)
  })

  /** Flush exactly one queued RAF callback (simulates a single frame). */
  function tick(nowMs?: number) {
    const entry = queue.shift()
    if (entry) entry.cb(nowMs ?? performance.now())
  }

  /** Flush all queued RAF callbacks (careful: ticking can enqueue more). */
  function flushAll(maxIterations = 200, nowMs?: number) {
    let i = 0
    while (queue.length > 0 && i < maxIterations) {
      tick(nowMs)
      i++
    }
  }

  return { tick, flushAll, queue }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MelodyScheduler", () => {
  let scheduler: MelodyScheduler
  let synth: ReturnType<typeof makeSynth>
  let raf: ReturnType<typeof installFakeRAF>
  let stateChanges: MelodyState[]

  beforeEach(() => {
    vi.stubGlobal("performance", { now: vi.fn(() => 0) })
    raf = installFakeRAF()
    scheduler = new MelodyScheduler()
    synth = makeSynth()
    stateChanges = []
  })

  afterEach(() => {
    scheduler.stop()
    vi.restoreAllMocks()
  })

  // -----------------------------------------------------------------------
  // 1. start / stop lifecycle
  // -----------------------------------------------------------------------

  describe("start / stop lifecycle", () => {
    it("should become active after start", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      expect(scheduler.isActive).toBe(true)
      expect(stateChanges.length).toBeGreaterThanOrEqual(1)
      expect(stateChanges[0].flowState).toBe("idle")
    })

    it("should become inactive after stop", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.stop()
      expect(scheduler.isActive).toBe(false)
      expect(scheduler.getState().fuel).toBe(0)
      expect(scheduler.getState().flowState).toBe("idle")
    })

    it("stop should reset all playback state", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
      scheduler.feed(true)
      scheduler.stop()

      const state = scheduler.getState()
      expect(state.fuel).toBe(0)
      expect(state.frameIndex).toBe(0)
      expect(state.flowState).toBe("idle")
    })

    it("calling stop multiple times should be safe", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.stop()
      scheduler.stop()
      scheduler.stop()
      expect(scheduler.isActive).toBe(false)
    })

    it("start should stop previous session before starting new one", () => {
      const changes1: MelodyState[] = []
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        onStateChange: (s) => changes1.push(s),
      })
      scheduler.feed(true)

      const changes2: MelodyState[] = []
      scheduler.start({
        frames: makeFrames(2),
        targetCPM: 200,
        synth,
        loopMode: "loop",
        onStateChange: (s) => changes2.push(s),
      })

      expect(scheduler.getState().totalFrames).toBe(2)
      expect(scheduler.isActive).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // 2. feed() and fuel management
  // -----------------------------------------------------------------------

  describe("feed() and fuel management", () => {
    it("first correct feed should give at least INITIAL_INPUT_FUEL_RATIO * maxFuel", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      const maxFuel = scheduler.getState().maxFuel
      scheduler.feed(true)
      expect(scheduler.getState().fuel).toBeGreaterThanOrEqual(maxFuel * 0.5)
    })

    it("first incorrect feed should still set hasReceivedInput and give initial fuel", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      const maxFuel = scheduler.getState().maxFuel
      scheduler.feed(false) // incorrect
      // 0.3 + initial ratio boost
      expect(scheduler.getState().fuel).toBeGreaterThanOrEqual(maxFuel * 0.5)
    })

    it("subsequent correct feeds should increment fuel by 1.0", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true) // first — gets initial boost
      const afterFirst = scheduler.getState().fuel
      scheduler.feed(true)
      expect(scheduler.getState().fuel).toBeCloseTo(afterFirst + 1.0, 5)
    })

    it("subsequent incorrect feeds should increment fuel by 0.3", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
      const afterFirst = scheduler.getState().fuel
      scheduler.feed(false)
      expect(scheduler.getState().fuel).toBeCloseTo(afterFirst + 0.3, 5)
    })

    it("fuel should not exceed maxFuel", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 60, // low CPM = small maxFuel
        synth,
        loopMode: "loop",
      })

      const maxFuel = scheduler.getState().maxFuel
      for (let i = 0; i < 100; i++) {
        scheduler.feed(true)
      }
      expect(scheduler.getState().fuel).toBeLessThanOrEqual(maxFuel)
    })
  })

  // -----------------------------------------------------------------------
  // 3. resetSession — the critical bug fix
  // -----------------------------------------------------------------------

  describe("resetSession — RAF resume after stop", () => {
    it("should resume RAF loop after stop() + resetSession()", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })
      expect(scheduler.isActive).toBe(true)

      scheduler.stop()
      expect(scheduler.isActive).toBe(false)

      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)
    })

    it("should resume RAF loop after once-mode playback completes + resetSession()", () => {
      const onPlaybackComplete = vi.fn()

      scheduler.start({
        frames: makeFrames(2, 0.01), // very short frames
        targetCPM: 300,
        synth,
        loopMode: "once",
        onPlaybackComplete,
      })
      expect(scheduler.isActive).toBe(true)

      // Simulate playback completion by stopping (mimics once-mode end)
      scheduler.stop()
      expect(scheduler.isActive).toBe(false)

      // resetSession should re-arm
      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)
    })

    it("resetSession with bridge=true should preserve fuel when hasReceivedInput", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
      scheduler.feed(true)
      scheduler.feed(true)
      const fuelBefore = scheduler.getState().fuel

      scheduler.resetSession(300, true)
      const fuelAfter = scheduler.getState().fuel

      // Bridge should give at least SESSION_BRIDGE_MIN_RATIO (0.5) of maxFuel
      const maxFuel = scheduler.getState().maxFuel
      expect(fuelAfter).toBeGreaterThanOrEqual(maxFuel * 0.5)
      expect(scheduler.getState().flowState).toBe("flowing")
    })

    it("resetSession with bridge=false should reset fuel to zero ratio", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
      scheduler.feed(true)

      scheduler.resetSession(300, false)

      // INITIAL_FUEL_RATIO is 0
      expect(scheduler.getState().fuel).toBe(0)
      expect(scheduler.getState().flowState).toBe("idle")
    })

    it("resetSession should update targetCPM when provided", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      const oldMaxFuel = scheduler.getState().maxFuel
      scheduler.resetSession(600) // double the CPM
      const newMaxFuel = scheduler.getState().maxFuel

      expect(newMaxFuel).toBeCloseTo(oldMaxFuel * 2, 5)
    })

    it("resetSession without targetCPM should keep existing maxFuel", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      const maxFuel = scheduler.getState().maxFuel
      scheduler.resetSession()
      expect(scheduler.getState().maxFuel).toBe(maxFuel)
    })

    it("resetSession on empty frames should NOT start RAF", () => {
      scheduler.start({
        frames: [],
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.stop()
      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // 4. isActive correctness
  // -----------------------------------------------------------------------

  describe("isActive correctness", () => {
    it("isActive should be false before start", () => {
      expect(scheduler.isActive).toBe(false)
    })

    it("isActive should be true after start with frames", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })
      expect(scheduler.isActive).toBe(true)
    })

    it("isActive should be false after stop even if rafId somehow lingered (defense)", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.stop()
      // isActive requires BOTH isRunning AND rafId — stop sets isRunning=false
      expect(scheduler.isActive).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // 5. switchTrack with carryover
  // -----------------------------------------------------------------------

  describe("switchTrack with carryover", () => {
    it("should carry over fuel when switching tracks", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "random",
        onStateChange: (s) => stateChanges.push(s),
      })

      scheduler.feed(true)
      scheduler.feed(true)
      scheduler.feed(true)
      const carryover = scheduler.captureCarryoverState()
      expect(carryover).not.toBeNull()
      expect(carryover!.fuel).toBeGreaterThan(0)

      scheduler.switchTrack({
        frames: makeFrames(8),
        targetCPM: 300,
        synth,
        loopMode: "random",
        carryoverState: carryover,
        onStateChange: (s) => stateChanges.push(s),
      })

      expect(scheduler.isActive).toBe(true)
      expect(scheduler.getState().fuel).toBe(carryover!.fuel)
      expect(scheduler.getState().totalFrames).toBe(8)
    })

    it("switchTrack without carryover should use current state", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
      scheduler.feed(true)
      const fuelBefore = scheduler.getState().fuel

      scheduler.switchTrack({
        frames: makeFrames(6),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      // Should use captureCarryoverState() as fallback
      expect(scheduler.getState().fuel).toBe(fuelBefore)
    })

    it("switchTrack should reset frame index and virtual time", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.switchTrack({
        frames: makeFrames(6),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      expect(scheduler.getState().frameIndex).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // 6. Tick-driven flow state transitions
  // -----------------------------------------------------------------------

  describe("tick-driven flow state transitions", () => {
    it("should transition idle → flowing when fuel is consumed", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(10),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      scheduler.feed(true) // hasReceivedInput = true, fuel > 0

      // First tick sets lastTickTime
      now = 100
      raf.tick(now)

      // Second tick actually consumes fuel; advance past STATE_THROTTLE_MS (50ms)
      now = 200
      raf.tick(now)

      // Third tick to ensure notification fires
      now = 300
      raf.tick(now)

      const flowingStates = stateChanges.filter((s) => s.flowState === "flowing")
      expect(flowingStates.length).toBeGreaterThan(0)
    })

    it("should transition flowing → fading → stalled as fuel drains", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(10, 0.01), // tight frames
        targetCPM: 6000, // high consumption rate
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      // Give minimal fuel
      scheduler.feed(false) // only 0.3 amount after initial boost

      // Run a few ticks to drain fuel
      for (let i = 0; i < 100; i++) {
        now = i * 20
        raf.tick(now)
      }

      const flowStates = stateChanges.map((s) => s.flowState)
      expect(flowStates).toContain("stalled")
    })

    it("should play notes via synth.triggerAttackRelease when flowing", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(4, 0.01), // frames at 0, 0.01, 0.02, 0.03
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      // Feed enough fuel
      for (let i = 0; i < 10; i++) scheduler.feed(true)

      // Advance time
      now = 0
      raf.tick(now)
      now = 100
      raf.tick(now)

      expect(synth.triggerAttackRelease).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // 7. Loop modes
  // -----------------------------------------------------------------------

  describe("loop modes", () => {
    it("loop mode should reset frameIndex to 0 when reaching end", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(2, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      for (let i = 0; i < 20; i++) scheduler.feed(true)

      // Tick forward enough to exhaust all frames
      for (let i = 0; i < 50; i++) {
        now = i * 30
        raf.tick(now)
      }

      // Should have looped — isActive should still be true
      expect(scheduler.isActive).toBe(true)
    })

    it("once mode should stop after all frames played", () => {
      const onPlaybackComplete = vi.fn()
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(2, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "once",
        onPlaybackComplete,
      })

      for (let i = 0; i < 20; i++) scheduler.feed(true)

      for (let i = 0; i < 50; i++) {
        now = i * 30
        raf.tick(now)
      }

      expect(scheduler.isActive).toBe(false)
      expect(onPlaybackComplete).toHaveBeenCalled()
    })

    it("random mode should fire onTrackComplete and become inactive", () => {
      const onTrackComplete = vi.fn()
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(2, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "random",
        onTrackComplete,
      })

      for (let i = 0; i < 20; i++) scheduler.feed(true)

      for (let i = 0; i < 50; i++) {
        now = i * 30
        raf.tick(now)
      }

      expect(scheduler.isActive).toBe(false)
      expect(onTrackComplete).toHaveBeenCalledTimes(1)

      // carryover state should be passed
      const carryover = onTrackComplete.mock.calls[0][0] as MelodyCarryoverState
      expect(carryover).not.toBeNull()
      expect(carryover.hasReceivedInput).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // 8. captureCarryoverState
  // -----------------------------------------------------------------------

  describe("captureCarryoverState", () => {
    it("should return null if maxFuel is 0", () => {
      expect(scheduler.captureCarryoverState()).toBeNull()
    })

    it("should capture current fuel, flowState, and hasReceivedInput", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
      const carryover = scheduler.captureCarryoverState()

      expect(carryover).not.toBeNull()
      expect(carryover!.fuel).toBeGreaterThan(0)
      expect(carryover!.hasReceivedInput).toBe(true)
      // flowState is idle since no tick has run yet
      expect(carryover!.flowState).toBe("idle")
    })
  })

  // -----------------------------------------------------------------------
  // 9. updateTargetCPM
  // -----------------------------------------------------------------------

  describe("updateTargetCPM", () => {
    it("should update maxFuel proportionally", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      const oldMax = scheduler.getState().maxFuel
      scheduler.updateTargetCPM(600)
      expect(scheduler.getState().maxFuel).toBeCloseTo(oldMax * 2, 5)
    })

    it("should clamp existing fuel to new maxFuel", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      for (let i = 0; i < 20; i++) scheduler.feed(true)

      scheduler.updateTargetCPM(60) // drastically lower
      const state = scheduler.getState()
      expect(state.fuel).toBeLessThanOrEqual(state.maxFuel)
    })
  })

  // -----------------------------------------------------------------------
  // 10. updateSynth
  // -----------------------------------------------------------------------

  describe("updateSynth", () => {
    it("should apply fading volume when flowState is fading", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(10, 0.01),
        targetCPM: 6000,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(false) // small amount of fuel

      // Drain fuel to get to fading
      for (let i = 0; i < 200; i++) {
        now = i * 20
        raf.tick(now)
      }

      // If flowState is fading, updating synth should apply fade volume
      const state = scheduler.getState()
      const newSynth = makeSynth()

      if (state.flowState === "fading") {
        scheduler.updateSynth(newSynth)
        expect(newSynth.volume.value).toBe(-18)
      } else if (state.flowState === "stalled") {
        scheduler.updateSynth(newSynth)
        expect(newSynth.volume.value).toBe(-Infinity)
      }
    })
  })

  // -----------------------------------------------------------------------
  // 11. Edge: start with empty frames
  // -----------------------------------------------------------------------

  describe("edge cases", () => {
    it("start with empty frames should still become active (RAF runs)", () => {
      scheduler.start({
        frames: [],
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      // isActive is true because start() always sets isRunning + schedules tick
      expect(scheduler.isActive).toBe(true)
      expect(scheduler.getState().totalFrames).toBe(0)
    })

    it("feed without start should not throw", () => {
      expect(() => scheduler.feed(true)).not.toThrow()
      expect(() => scheduler.feed(false)).not.toThrow()
    })

    it("start with null synth should still run RAF", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth: null,
        loopMode: "loop",
      })

      expect(scheduler.isActive).toBe(true)
    })

    it("carryoverState should clamp fuel within maxFuel", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 60, // maxFuel = 1 * 3 = 3
        synth,
        loopMode: "loop",
        carryoverState: { fuel: 999, flowState: "flowing", hasReceivedInput: true },
      })

      expect(scheduler.getState().fuel).toBeLessThanOrEqual(scheduler.getState().maxFuel)
    })

    it("carryoverState should clamp negative fuel to 0", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        carryoverState: { fuel: -10, flowState: "flowing", hasReceivedInput: true },
      })

      expect(scheduler.getState().fuel).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // 12. The critical regression test: stop → resetSession → feed → sound
  // -----------------------------------------------------------------------

  describe("regression: stop → resetSession → feed should produce sound", () => {
    it("full cycle: start → stop → resetSession → feed → tick should play notes", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(4, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.stop()
      expect(scheduler.isActive).toBe(false)

      // This is the critical path that was broken before the fix
      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)

      // Feed keystrokes
      scheduler.feed(true)
      scheduler.feed(true)
      scheduler.feed(true)

      // Run ticks
      now = 0
      raf.tick(now)
      now = 100
      raf.tick(now)

      expect(synth.triggerAttackRelease).toHaveBeenCalled()
    })

    it("random mode end → resetSession → feed should resume playback", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      const onTrackComplete = vi.fn()

      scheduler.start({
        frames: makeFrames(2, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "random",
        onTrackComplete,
      })

      // Feed and drain to trigger track complete
      for (let i = 0; i < 20; i++) scheduler.feed(true)
      for (let i = 0; i < 50; i++) {
        now = i * 30
        raf.tick(now)
      }

      expect(scheduler.isActive).toBe(false)
      expect(onTrackComplete).toHaveBeenCalled()

      // Simulate practice controller calling resetSession (e.g. new round)
      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)

      // Feed again — should work
      synth.triggerAttackRelease.mockClear()
      scheduler.feed(true)
      scheduler.feed(true)

      now = 1600
      raf.tick(now)
      now = 1700
      raf.tick(now)

      expect(synth.triggerAttackRelease).toHaveBeenCalled()
    })

    it("once mode end → resetSession → should resume", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "once",
      })

      scheduler.stop() // simulate once-mode end
      expect(scheduler.isActive).toBe(false)

      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)
      expect(scheduler.getState().flowState).toBe("idle")
    })
  })

  // -----------------------------------------------------------------------
  // 13. onStateChange notification
  // -----------------------------------------------------------------------

  describe("onStateChange notifications", () => {
    it("should notify on start", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      expect(stateChanges.length).toBe(1)
    })

    it("should notify on stop", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      stateChanges.length = 0
      scheduler.stop()
      expect(stateChanges.length).toBe(1)
      expect(stateChanges[0].flowState).toBe("idle")
      expect(stateChanges[0].fuel).toBe(0)
    })

    it("should notify on resetSession", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      stateChanges.length = 0
      scheduler.resetSession(300)
      expect(stateChanges.length).toBeGreaterThanOrEqual(1)
    })
  })
})
