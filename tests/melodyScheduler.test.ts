import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MelodyScheduler } from "../src/engine/midi/melodyScheduler"
import type { MelodyCarryoverState } from "../src/engine/midi/melodyScheduler"
import type { MidiFrame, MelodyState } from "../src/engine/midi/types"

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

  function tick(nowMs?: number) {
    const entry = queue.shift()
    if (entry) entry.cb(nowMs ?? performance.now())
  }

  function flushAll(maxIterations = 200, nowMs?: number) {
    let i = 0
    while (queue.length > 0 && i < maxIterations) {
      tick(nowMs)
      i++
    }
  }

  return { tick, flushAll, queue }
}

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
      scheduler.feed(false)
      expect(scheduler.getState().fuel).toBeGreaterThanOrEqual(maxFuel * 0.5)
    })

    it("subsequent correct feeds should increment fuel by 1.0", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      scheduler.feed(true)
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
        targetCPM: 60,
        synth,
        loopMode: "loop",
      })

      const maxFuel = scheduler.getState().maxFuel
      for (let i = 0; i < 100; i++) {
        scheduler.feed(true)
      }
      expect(scheduler.getState().fuel).toBeLessThanOrEqual(maxFuel)
    })

    it("can recover flow on input even when no synth is attached", () => {
      scheduler.start({
        frames: makeFrames(4),
        targetCPM: 180,
        synth: null,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      scheduler.feed(true)

      const lastState = stateChanges.at(-1)
      expect(lastState?.flowState).toBe("flowing")
      expect(lastState?.fuel ?? 0).toBeGreaterThan(0)
    })
  })

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
        frames: makeFrames(2, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "once",
        onPlaybackComplete,
      })
      expect(scheduler.isActive).toBe(true)

      scheduler.stop()
      expect(scheduler.isActive).toBe(false)

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

      const maxFuel = scheduler.getState().maxFuel
      expect(fuelAfter).toBeGreaterThanOrEqual(maxFuel * 0.5)
      expect(fuelAfter).toBeGreaterThanOrEqual(fuelBefore)
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
      scheduler.resetSession(600)
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
      expect(scheduler.isActive).toBe(false)
    })
  })

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

      scheduler.feed(true)

      now = 100
      raf.tick(now)
      now = 200
      raf.tick(now)
      now = 300
      raf.tick(now)

      const flowingStates = stateChanges.filter((s) => s.flowState === "flowing")
      expect(flowingStates.length).toBeGreaterThan(0)
    })

    it("should transition flowing → fading → stalled as fuel drains", () => {
      let now = 0
      vi.stubGlobal("performance", { now: () => now })

      scheduler.start({
        frames: makeFrames(10, 0.01),
        targetCPM: 6000,
        synth,
        loopMode: "loop",
        onStateChange: (s) => stateChanges.push(s),
      })

      scheduler.feed(false)

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
        frames: makeFrames(4, 0.01),
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

      for (let i = 0; i < 10; i++) scheduler.feed(true)

      now = 0
      raf.tick(now)
      now = 100
      raf.tick(now)

      expect(synth.triggerAttackRelease).toHaveBeenCalled()
    })
  })

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

      for (let i = 0; i < 50; i++) {
        now = i * 30
        raf.tick(now)
      }

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

      const carryover = onTrackComplete.mock.calls[0][0] as MelodyCarryoverState
      expect(carryover).not.toBeNull()
      expect(carryover.hasReceivedInput).toBe(true)
    })
  })

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
      expect(carryover!.flowState).toBe("flowing")
    })
  })

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

      scheduler.updateTargetCPM(60)
      const state = scheduler.getState()
      expect(state.fuel).toBeLessThanOrEqual(state.maxFuel)
    })
  })

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

      scheduler.feed(false)

      for (let i = 0; i < 200; i++) {
        now = i * 20
        raf.tick(now)
      }

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

  describe("edge cases", () => {
    it("start with empty frames should still become active (RAF runs)", () => {
      scheduler.start({
        frames: [],
        targetCPM: 300,
        synth,
        loopMode: "loop",
      })

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
        targetCPM: 60,
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

      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)

      scheduler.feed(true)
      scheduler.feed(true)
      scheduler.feed(true)

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

      for (let i = 0; i < 20; i++) scheduler.feed(true)
      for (let i = 0; i < 50; i++) {
        now = i * 30
        raf.tick(now)
      }

      expect(scheduler.isActive).toBe(false)
      expect(onTrackComplete).toHaveBeenCalled()

      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)

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

      scheduler.stop()
      expect(scheduler.isActive).toBe(false)

      scheduler.resetSession(300)
      expect(scheduler.isActive).toBe(true)
      expect(scheduler.getState().flowState).toBe("idle")
    })
  })

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
