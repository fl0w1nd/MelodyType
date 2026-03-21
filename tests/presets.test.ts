import { describe, expect, it } from "vitest"

import { presetList, presetMelodies } from "../src/engine/midi/presets"

const recommendedPresetIds = [
  "bach-prelude-c-major",
  "canon-in-d-arpeggio",
  "gymnopedie-no-1",
  "minuet-in-g",
  "greensleeves",
] as const

describe("preset library", () => {
  it("uses the Bach prelude as the default preset", () => {
    expect(presetList[0]?.id).toBe("bach-prelude-c-major")
  })

  it("removes retired demo presets", () => {
    expect(presetMelodies["twinkle-twinkle"]).toBeUndefined()
    expect(presetMelodies.chromatic).toBeUndefined()
  })

  it("includes the new long-form recommended presets", () => {
    for (const id of recommendedPresetIds) {
      expect(presetMelodies[id]).toBeDefined()
      expect(presetMelodies[id].frames.length).toBeGreaterThanOrEqual(32)
    }
  })
})
