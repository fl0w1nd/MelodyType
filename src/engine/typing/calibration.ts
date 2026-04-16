import {
  ADAPTIVE_TARGET_PRESETS,
  MIN_TARGET_CPM,
  MAX_TARGET_CPM,
} from "./adaptiveEngine"

export const CALIBRATION_WORD_COUNT = 25

const CALIBRATION_WORDS = [
  "pack",
  "my",
  "box",
  "with",
  "five",
  "dozen",
  "liquor",
  "jugs",
  "the",
  "quick",
  "brown",
  "fox",
  "jumps",
  "over",
  "the",
  "lazy",
  "dog",
  "sphinx",
  "of",
  "black",
  "quartz",
  "judge",
  "my",
  "vow",
  "wizard",
] as const

export function generateCalibrationText(): string {
  return CALIBRATION_WORDS.slice(0, CALIBRATION_WORD_COUNT).join(" ")
}

export interface CalibrationResult {
  measuredCpm: number
  measuredWpm: number
  accuracy: number
  recommendedTargetCpm: number
  presetLabel: string
}

/**
 * Compute a recommended target CPM from calibration round metrics.
 *
 * Strategy:
 * - Use the user's measured CPM as a baseline
 * - Set target slightly above their current speed (1.15×) to provide
 *   a reachable challenge without being frustrating
 * - Clamp to the defined range and snap to nearest preset
 */
export function computeCalibrationResult(
  wpm: number,
  accuracy: number,
): CalibrationResult {
  const measuredCpm = wpm * 5

  // Target is 15% above current speed, with accuracy penalty for sloppy typing
  const accuracyFactor = accuracy >= 90 ? 1.0 : 0.85 + (accuracy / 100) * 0.15
  const rawTarget = measuredCpm * 1.15 * accuracyFactor

  // Clamp to allowed range
  const clampedTarget = Math.round(
    Math.max(MIN_TARGET_CPM, Math.min(MAX_TARGET_CPM, rawTarget)),
  )

  // Find closest preset
  const closestPreset = ADAPTIVE_TARGET_PRESETS.reduce((best, preset) =>
    Math.abs(preset.cpm - clampedTarget) < Math.abs(best.cpm - clampedTarget)
      ? preset
      : best,
  )

  // Use the preset CPM if close enough (within 20%), otherwise use the calculated value
  const usePreset = Math.abs(closestPreset.cpm - clampedTarget) / clampedTarget < 0.2
  const recommendedTargetCpm = usePreset ? closestPreset.cpm : clampedTarget

  return {
    measuredCpm: Math.round(measuredCpm),
    measuredWpm: Math.round(wpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    recommendedTargetCpm,
    presetLabel: closestPreset.label,
  }
}
