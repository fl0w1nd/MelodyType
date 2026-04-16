import { describe, expect, it } from "vitest"
import {
  resolveStoredAdaptivePhase,
} from "../src/engine/typing/adaptiveEngine"
import {
  CALIBRATION_WORD_COUNT,
  computeCalibrationResult,
  generateCalibrationText,
} from "../src/engine/typing/calibration"

describe("resolveStoredAdaptivePhase", () => {
  it("maps legacy calibration phase to progressive", () => {
    expect(resolveStoredAdaptivePhase("calibration")).toBe("progressive")
  })

  it("keeps reinforcement phase intact", () => {
    expect(resolveStoredAdaptivePhase("reinforcement")).toBe("reinforcement")
  })
})

describe("generateCalibrationText", () => {
  it("covers the full alphabet", () => {
    const letters = new Set(generateCalibrationText().replace(/[^a-z]/g, ""))
    expect(letters.size).toBe(26)
    expect(generateCalibrationText().split(" ")).toHaveLength(CALIBRATION_WORD_COUNT)
  })
})

describe("computeCalibrationResult", () => {
  it("snaps typical results to the nearest preset", () => {
    expect(computeCalibrationResult(24, 98).recommendedTargetCpm).toBe(125)
  })

  it("clamps very slow results to the minimum target", () => {
    expect(computeCalibrationResult(5, 100).recommendedTargetCpm).toBe(75)
  })
})
