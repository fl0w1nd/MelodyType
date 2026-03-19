import type { FlowState, MelodyState } from "./types"

export const DEFAULT_MELODY_INTEGRITY = 100
export const FLOW_EMPTY_EPSILON = 0.01

const FLOW_QUALITY_BY_STATE: Record<FlowState, number> = {
  idle: 1,
  flowing: 1,
  fading: 0.65,
  stalled: 0.2,
}

export interface MelodyIntegrityTracker {
  weightedQualityMs: number
  trackedMs: number
  lastTimestamp: number | null
}

interface UpdateMelodyIntegrityOptions {
  tracker: MelodyIntegrityTracker
  previousState: MelodyState
  nextState: MelodyState
  now: number
  suspend?: boolean
}

export function createMelodyIntegrityTracker(): MelodyIntegrityTracker {
  return {
    weightedQualityMs: 0,
    trackedMs: 0,
    lastTimestamp: null,
  }
}

export function resetMelodyIntegrityTracker(tracker: MelodyIntegrityTracker) {
  tracker.weightedQualityMs = 0
  tracker.trackedMs = 0
  tracker.lastTimestamp = null
}

export function computeMelodyIntegrity(tracker: MelodyIntegrityTracker) {
  if (tracker.trackedMs <= 0) {
    return DEFAULT_MELODY_INTEGRITY
  }

  const ratio = tracker.weightedQualityMs / tracker.trackedMs
  return Math.max(0, Math.min(DEFAULT_MELODY_INTEGRITY, ratio * 100))
}

function isIntegrityTrackable(state: MelodyState) {
  return (
    state.maxFuel > 0 &&
    (state.flowState !== "idle" || state.fuel > FLOW_EMPTY_EPSILON)
  )
}

function getStateQuality(state: MelodyState) {
  return FLOW_QUALITY_BY_STATE[state.flowState]
}

export function updateMelodyIntegrityTracker({
  tracker,
  previousState,
  nextState,
  now,
  suspend = false,
}: UpdateMelodyIntegrityOptions) {
  if (!suspend && tracker.lastTimestamp != null && isIntegrityTrackable(previousState)) {
    const dt = Math.max(0, now - tracker.lastTimestamp)
    if (dt > 0) {
      tracker.trackedMs += dt
      tracker.weightedQualityMs += dt * getStateQuality(previousState)
    }
  }

  tracker.lastTimestamp =
    !suspend && isIntegrityTrackable(nextState) ? now : null

  return computeMelodyIntegrity(tracker)
}
