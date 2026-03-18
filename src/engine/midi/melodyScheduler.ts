import type * as Tone from "tone"
import type { MidiFrame, FlowState, MelodyState } from "./types"

const FADE_VOLUME_DB = -18
const STATE_THROTTLE_MS = 50

export type LoopMode = "loop" | "once" | "random"

export interface SchedulerOptions {
  frames: MidiFrame[]
  targetCPM: number
  synth: Tone.PolySynth | null
  loopMode: LoopMode
  carryoverState?: MelodyCarryoverState | null
  onStateChange?: (state: MelodyState) => void
  onTrackComplete?: (carryoverState: MelodyCarryoverState | null) => void
}

export interface MelodyCarryoverState {
  fuel: number
  flowState: FlowState
  hasReceivedInput: boolean
}

const BUFFER_SECONDS = 3
const INITIAL_FUEL_RATIO = 0
const SESSION_BRIDGE_SECONDS = 1
const FADE_DRAIN_FACTOR = 0.95
const MAX_DT = 0.1

export class MelodyScheduler {
  private frames: MidiFrame[] = []
  private frameIndex = 0
  private virtualTime = 0
  private fuel = 0
  private maxFuel = 0
  private targetCPS = 0
  private flowState: FlowState = "idle"
  private synth: Tone.PolySynth | null = null
  private rafId: number | null = null
  private lastTickTime: number | null = null
  private loopMode: LoopMode = "loop"
  private loopDuration = 0
  private hasReceivedInput = false
  private onStateChange?: (state: MelodyState) => void
  private onTrackComplete?: (carryoverState: MelodyCarryoverState | null) => void
  private lastNotifyTime = 0
  private isRunning = false

  private configureFrames(frames: MidiFrame[]) {
    this.frames = frames
    this.frameIndex = 0
    this.virtualTime = 0
    this.lastTickTime = null

    if (this.frames.length > 0) {
      const lastFrame = this.frames[this.frames.length - 1]
      const maxNoteDur = Math.max(...lastFrame.notes.map((n) => n.duration), 0.5)
      this.loopDuration = lastFrame.time + maxNoteDur
      return
    }

    this.loopDuration = 0
  }

  private applyPlaybackState(
    targetCPM: number,
    carryoverState?: MelodyCarryoverState | null,
  ) {
    this.targetCPS = targetCPM / 60
    this.maxFuel = this.targetCPS * BUFFER_SECONDS

    if (carryoverState) {
      this.fuel = Math.min(Math.max(carryoverState.fuel, 0), this.maxFuel)
      this.flowState = carryoverState.flowState
      this.hasReceivedInput = carryoverState.hasReceivedInput
      return
    }

    this.fuel = this.maxFuel * INITIAL_FUEL_RATIO
    this.flowState = "idle"
    this.hasReceivedInput = false
  }

  start(options: SchedulerOptions) {
    this.stop()

    this.synth = options.synth
    this.loopMode = options.loopMode
    this.onStateChange = options.onStateChange
    this.onTrackComplete = options.onTrackComplete
    this.configureFrames(options.frames)
    this.applyPlaybackState(options.targetCPM, options.carryoverState)

    this.notifyState()
    this.isRunning = true
    this.scheduleTick()
  }

  switchTrack(options: SchedulerOptions) {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.synth = options.synth
    this.loopMode = options.loopMode
    this.onStateChange = options.onStateChange
    this.onTrackComplete = options.onTrackComplete
    this.configureFrames(options.frames)
    this.applyPlaybackState(
      options.targetCPM,
      options.carryoverState ?? this.captureCarryoverState(),
    )

    this.notifyState()
    this.isRunning = true
    this.scheduleTick()
  }

  captureCarryoverState(): MelodyCarryoverState | null {
    if (this.maxFuel <= 0) return null
    return {
      fuel: this.fuel,
      flowState: this.flowState,
      hasReceivedInput: this.hasReceivedInput,
    }
  }

  feed(correct: boolean) {
    if (!this.hasReceivedInput) {
      this.hasReceivedInput = true
    }
    const amount = correct ? 1.0 : 0.3
    this.fuel = Math.min(this.maxFuel, this.fuel + amount)
  }

  updateSynth(synth: Tone.PolySynth) {
    this.synth = synth
    if (this.flowState === "fading") {
      synth.volume.value = FADE_VOLUME_DB
    } else if (this.flowState === "stalled") {
      synth.volume.value = -Infinity
    }
  }

  updateTargetCPM(targetCPM: number) {
    this.targetCPS = targetCPM / 60
    this.maxFuel = this.targetCPS * BUFFER_SECONDS
    this.fuel = Math.min(this.fuel, this.maxFuel)
  }

  updateLoopMode(loopMode: LoopMode) {
    this.loopMode = loopMode
  }

  get isActive(): boolean {
    return this.rafId !== null
  }

  /**
   * Reset session-level state (fuel, input flag, flow) while preserving
   * the current playback position (frameIndex, virtualTime). Resumes the
   * RAF loop if it was stopped.
   */
  resetSession(targetCPM?: number, bridge = false) {
    if (targetCPM != null) {
      this.targetCPS = targetCPM / 60
      this.maxFuel = this.targetCPS * BUFFER_SECONDS
    }

    if (bridge && this.hasReceivedInput) {
      this.fuel = this.targetCPS * SESSION_BRIDGE_SECONDS
      this.flowState = "flowing"
    } else {
      this.fuel = this.maxFuel * INITIAL_FUEL_RATIO
      this.hasReceivedInput = false
      this.flowState = "idle"
      this.lastTickTime = null
    }

    if (this.synth) {
      try {
        this.synth.volume.rampTo(0, 0.05)
      } catch { /* synth may be disposed */ }
    }

    this.notifyState()

    if (this.rafId === null && this.frames.length > 0) {
      this.scheduleTick()
    }
  }

  stop() {
    this.isRunning = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.frameIndex = 0
    this.virtualTime = 0
    this.fuel = 0
    this.lastTickTime = null
    this.lastNotifyTime = 0
    this.hasReceivedInput = false
    this.flowState = "idle"
    // Restore synth volume when stopping
    if (this.synth) {
      try {
        this.synth.volume.rampTo(0, 0.05)
      } catch { /* synth may be disposed */ }
    }
    this.notifyState()
  }

  getState(): MelodyState {
    return {
      fuel: this.fuel,
      maxFuel: this.maxFuel,
      flowState: this.flowState,
      frameIndex: this.frameIndex,
      totalFrames: this.frames.length,
    }
  }

  private scheduleTick() {
    if (!this.isRunning) return
    this.rafId = requestAnimationFrame(this.tick)
  }

  private tick = () => {
    const now = performance.now()

    if (
      this.lastTickTime !== null &&
      this.hasReceivedInput &&
      this.frames.length > 0
    ) {
      const dt = Math.min((now - this.lastTickTime) / 1000, MAX_DT)
      const consume = this.targetCPS * dt

      if (this.fuel >= consume) {
        this.fuel -= consume
        this.virtualTime += dt
        this.playPendingFrames()

        if (this.flowState !== "flowing" && this.synth) {
          this.synth.volume.rampTo(0, 0.15)
        }
        this.flowState = "flowing"
      } else if (this.fuel > 0.01) {
        this.fuel *= FADE_DRAIN_FACTOR

        if (this.flowState !== "fading" && this.synth) {
          this.synth.volume.rampTo(FADE_VOLUME_DB, 0.5)
        }
        this.flowState = "fading"
      } else {
        this.fuel = 0
        if (this.flowState !== "stalled" && this.synth) {
          this.synth.volume.rampTo(-Infinity, 0.3)
        }
        this.flowState = "stalled"
      }
    }

    this.lastTickTime = now

    if (now - this.lastNotifyTime > STATE_THROTTLE_MS) {
      this.lastNotifyTime = now
      this.notifyState()
    }

    this.scheduleTick()
  }

  private playPendingFrames() {
    if (!this.synth) return

    while (this.frameIndex < this.frames.length) {
      const frame = this.frames[this.frameIndex]
      if (frame.time > this.virtualTime) break

      if (frame.notes.length > 0) {
        const noteNames = frame.notes.map((n) => n.name)
        const duration = Math.max(...frame.notes.map((n) => n.duration))
        try {
          this.synth.triggerAttackRelease(
            noteNames,
            duration > 0 ? duration : "8n",
          )
        } catch { /* audio context may not be ready */ }
      }

      this.frameIndex++
    }

    if (this.frameIndex >= this.frames.length) {
      if (this.loopMode === "loop") {
        this.frameIndex = 0
        this.virtualTime -= this.loopDuration
      } else if (this.loopMode === "random") {
        this.isRunning = false
        this.rafId = null
        this.frameIndex = 0
        this.virtualTime = 0
        this.lastTickTime = null
        const onTrackComplete = this.onTrackComplete
        onTrackComplete?.(this.captureCarryoverState())
      } else {
        this.stop()
      }
    }
  }

  private notifyState() {
    this.onStateChange?.(this.getState())
  }
}
