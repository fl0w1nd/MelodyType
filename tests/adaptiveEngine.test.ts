import { describe, it, expect } from "vitest"
import {
  computeMastery,
  computeTransitionScore,
  getKeyUnlockChecks,
  isKeyReadyToUnlock,
  isKeyStrictlyMastered,
  getAdaptiveKeyTier,
  shouldUnlockNextKey,
  getNextKeyToUnlock,
  getFocusKey,
  computeKeyWeights,
  extractBigramMetrics,
  MIN_HITS_FOR_MASTERY,
  MIN_RECENT_ACCURACY_FOR_MASTERY,
  MIN_LIFETIME_ACCURACY_FOR_MASTERY,
  MIN_SAMPLES_FOR_STABLE_SIGNAL,
  DEFAULT_TARGET_CPM,
  LETTER_FREQUENCY_ORDER,
  type KeyConfidence,
} from "../src/engine/typing/adaptiveEngine"
import type { BigramStat } from "../src/lib/db"

function makeKC(overrides: Partial<KeyConfidence> & { key: string }): KeyConfidence {
  return {
    confidence: 0,
    bestConfidence: 0,
    qualifiedBestConfidence: 0,
    speed: 0,
    accuracy: 0,
    lifetimeAccuracy: 0,
    samples: 0,
    unlocked: true,
    focused: false,
    forced: false,
    learningRate: null,
    ...overrides,
  }
}

function makeStroke(
  key: string,
  correct: boolean,
  timestamp: number,
  wordIndex: number,
  charIndex: number,
) {
  return {
    key,
    correct,
    timestamp,
    wordIndex,
    charIndex,
  }
}

// ---------------------------------------------------------------------------
// computeMastery
// ---------------------------------------------------------------------------
describe("computeMastery", () => {
  it("returns ewmaCpm / targetCpm for positive values", () => {
    expect(computeMastery(175, 175)).toBe(1)
    expect(computeMastery(350, 175)).toBe(2)
    expect(computeMastery(87.5, 175)).toBeCloseTo(0.5)
  })

  it("uses DEFAULT_TARGET_CPM when targetCpm is omitted", () => {
    expect(computeMastery(DEFAULT_TARGET_CPM)).toBe(1)
  })

  it("returns 0 for undefined ewmaCpm", () => {
    expect(computeMastery(undefined, 175)).toBe(0)
  })

  it("returns 0 for ewmaCpm = 0", () => {
    expect(computeMastery(0, 175)).toBe(0)
  })

  it("returns 0 for negative ewmaCpm", () => {
    expect(computeMastery(-100, 175)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getKeyUnlockChecks
// ---------------------------------------------------------------------------
describe("getKeyUnlockChecks", () => {
  it("returns all false for a zero-stat key", () => {
    const kc = makeKC({ key: "e" })
    const checks = getKeyUnlockChecks(kc)
    expect(checks).toEqual({
      speed: false,
      hits: false,
      recentAccuracy: false,
      lifetimeAccuracy: false,
    })
  })

  it("returns all true when all thresholds are met", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.5,
      bestConfidence: 1.5,
      samples: 55,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    const checks = getKeyUnlockChecks(kc)
    expect(checks).toEqual({
      speed: true,
      hits: true,
      recentAccuracy: true,
      lifetimeAccuracy: true,
    })
  })

  it("uses bestConfidence when recoverKeys=false (default)", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.5,
      bestConfidence: 1.0,
      samples: 55,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(getKeyUnlockChecks(kc, false).speed).toBe(true)
  })

  it("keeps all checks passed after historical qualification when recoverKeys=false", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.4,
      bestConfidence: 1.2,
      qualifiedBestConfidence: 1.2,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(getKeyUnlockChecks(kc, false)).toEqual({
      speed: true,
      hits: true,
      recentAccuracy: true,
      lifetimeAccuracy: true,
    })
  })

  it("does not keep historical qualification when recoverKeys=true", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.4,
      bestConfidence: 1.2,
      qualifiedBestConfidence: 1.2,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(getKeyUnlockChecks(kc, true)).toEqual({
      speed: false,
      hits: true,
      recentAccuracy: false,
      lifetimeAccuracy: false,
    })
  })

  it("drops back to live checks when target CPM increases beyond historical qualification", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.6,
      bestConfidence: 0.9,
      qualifiedBestConfidence: 0.9,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(getKeyUnlockChecks(kc, false)).toEqual({
      speed: false,
      hits: true,
      recentAccuracy: false,
      lifetimeAccuracy: false,
    })
  })

  it("uses confidence when recoverKeys=true", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.5,
      bestConfidence: 1.0,
      samples: 55,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(getKeyUnlockChecks(kc, true).speed).toBe(false)
  })

  // Boundary: exactly at thresholds
  it("speed passes at exactly 1.0 bestConfidence", () => {
    const kc = makeKC({ key: "e", bestConfidence: 1.0 })
    expect(getKeyUnlockChecks(kc).speed).toBe(true)
  })

  it("speed fails just below 1.0 bestConfidence", () => {
    const kc = makeKC({ key: "e", bestConfidence: 0.999 })
    expect(getKeyUnlockChecks(kc).speed).toBe(false)
  })

  it("hits passes at exactly MIN_HITS_FOR_MASTERY", () => {
    const kc = makeKC({ key: "e", samples: MIN_HITS_FOR_MASTERY })
    expect(getKeyUnlockChecks(kc).hits).toBe(true)
  })

  it("hits fails at MIN_HITS_FOR_MASTERY - 1", () => {
    const kc = makeKC({ key: "e", samples: MIN_HITS_FOR_MASTERY - 1 })
    expect(getKeyUnlockChecks(kc).hits).toBe(false)
  })

  it("recentAccuracy passes at exactly 90", () => {
    const kc = makeKC({ key: "e", accuracy: MIN_RECENT_ACCURACY_FOR_MASTERY * 100 })
    expect(getKeyUnlockChecks(kc).recentAccuracy).toBe(true)
  })

  it("recentAccuracy fails just below 90", () => {
    const kc = makeKC({ key: "e", accuracy: MIN_RECENT_ACCURACY_FOR_MASTERY * 100 - 0.01 })
    expect(getKeyUnlockChecks(kc).recentAccuracy).toBe(false)
  })

  it("lifetimeAccuracy passes at exactly 88", () => {
    const kc = makeKC({ key: "e", lifetimeAccuracy: MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100 })
    expect(getKeyUnlockChecks(kc).lifetimeAccuracy).toBe(true)
  })

  it("lifetimeAccuracy fails just below 88", () => {
    const kc = makeKC({ key: "e", lifetimeAccuracy: MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100 - 0.01 })
    expect(getKeyUnlockChecks(kc).lifetimeAccuracy).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isKeyReadyToUnlock
// ---------------------------------------------------------------------------
describe("isKeyReadyToUnlock", () => {
  it("returns true when all checks pass", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.2,
      bestConfidence: 1.2,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyReadyToUnlock(kc)).toBe(true)
  })

  it("returns false if any single check fails (low samples)", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.2,
      bestConfidence: 1.2,
      samples: 5,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyReadyToUnlock(kc)).toBe(false)
  })

  it("returns false if speed fails", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.8,
      bestConfidence: 0.8,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyReadyToUnlock(kc)).toBe(false)
  })

  it("respects recoverKeys flag", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.5,
      bestConfidence: 1.2,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyReadyToUnlock(kc, false)).toBe(true)
    expect(isKeyReadyToUnlock(kc, true)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isKeyStrictlyMastered
// ---------------------------------------------------------------------------
describe("isKeyStrictlyMastered", () => {
  it("returns true when all strict conditions met (default recoverKeys=false uses bestConfidence)", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.0,
      bestConfidence: 1.0,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyStrictlyMastered(kc)).toBe(true)
  })

  it("uses bestConfidence when recoverKeys=false (default)", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.9,
      bestConfidence: 1.5,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyStrictlyMastered(kc)).toBe(true)
    expect(isKeyStrictlyMastered(kc, false)).toBe(true)
  })

  it("uses confidence when recoverKeys=true", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.9,
      bestConfidence: 1.5,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyStrictlyMastered(kc, true)).toBe(false)
  })

  it("keeps mastered state after historical qualification when recoverKeys=false", () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.6,
      bestConfidence: 1.2,
      qualifiedBestConfidence: 1.2,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(isKeyStrictlyMastered(kc, false)).toBe(true)
    expect(isKeyStrictlyMastered(kc, true)).toBe(false)
  })

  it("returns false if samples below threshold", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.5,
      bestConfidence: 1.5,
      samples: 9,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(isKeyStrictlyMastered(kc)).toBe(false)
  })

  it("returns false if recentAccuracy below threshold", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.5,
      bestConfidence: 1.5,
      samples: 60,
      accuracy: 89.99,
      lifetimeAccuracy: 95,
    })
    expect(isKeyStrictlyMastered(kc)).toBe(false)
  })

  it("returns false if lifetimeAccuracy below threshold", () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.5,
      bestConfidence: 1.5,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 87.99,
    })
    expect(isKeyStrictlyMastered(kc)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getAdaptiveKeyTier
// ---------------------------------------------------------------------------
describe("getAdaptiveKeyTier", () => {
  it('returns "locked" when key is not unlocked', () => {
    const kc = makeKC({ key: "e", unlocked: false, confidence: 2.0, bestConfidence: 2.0 })
    expect(getAdaptiveKeyTier(kc)).toBe("locked")
  })

  it('returns "mastered" when strictly mastered', () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.0,
      bestConfidence: 1.0,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(getAdaptiveKeyTier(kc)).toBe("mastered")
  })

  it('returns "mastered" via bestConfidence when recoverKeys=false even if confidence dropped', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.8,
      bestConfidence: 1.2,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(getAdaptiveKeyTier(kc, false)).toBe("mastered")
  })

  it('stays "mastered" when recoverKeys=false after speed and accuracy regress, if historically qualified', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.6,
      bestConfidence: 1.2,
      qualifiedBestConfidence: 1.2,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(getAdaptiveKeyTier(kc, false)).toBe("mastered")
  })

  it('returns "good" when recoverKeys=true and confidence dropped below 1.0', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.8,
      bestConfidence: 1.2,
      samples: 60,
      accuracy: 95,
      lifetimeAccuracy: 95,
    })
    expect(getAdaptiveKeyTier(kc, true)).toBe("good")
  })

  it('retreats from "mastered" when recoverKeys=true and accuracy regresses', () => {
    const kc = makeKC({
      key: "e",
      confidence: 1.1,
      bestConfidence: 1.2,
      qualifiedBestConfidence: 1.2,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(getAdaptiveKeyTier(kc, true)).toBe("good")
  })

  it('retreats to the corresponding tier when target CPM rises above historical qualification', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.6,
      bestConfidence: 0.9,
      qualifiedBestConfidence: 0.9,
      samples: 60,
      accuracy: 70,
      lifetimeAccuracy: 80,
    })
    expect(getAdaptiveKeyTier(kc, false)).toBe("learning")
  })

  it('returns "good" when bestConfidence >= 1.0 but accuracy insufficient for mastery', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.8,
      bestConfidence: 1.0,
      samples: 15,
      accuracy: 95,
      lifetimeAccuracy: 90,
    })
    expect(getAdaptiveKeyTier(kc)).toBe("good")
  })

  it('returns "learning" when confidence >= 0.4 and bestConfidence < 1.0', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.4,
      bestConfidence: 0.5,
    })
    expect(getAdaptiveKeyTier(kc)).toBe("learning")
  })

  it('returns "weak" when confidence < 0.4 and bestConfidence < 1.0', () => {
    const kc = makeKC({
      key: "e",
      confidence: 0.39,
      bestConfidence: 0.39,
    })
    expect(getAdaptiveKeyTier(kc)).toBe("weak")
  })

  it('returns "weak" for a newly unlocked key with zero stats', () => {
    const kc = makeKC({ key: "e" })
    expect(getAdaptiveKeyTier(kc)).toBe("weak")
  })

  it("boundary: confidence exactly 0.4 → learning, not weak", () => {
    const kc = makeKC({ key: "e", confidence: 0.4, bestConfidence: 0.4 })
    expect(getAdaptiveKeyTier(kc)).toBe("learning")
  })

  it("boundary: bestConfidence exactly 1.0 but confidence < 1.0 → good (no samples)", () => {
    const kc = makeKC({ key: "e", confidence: 0.5, bestConfidence: 1.0 })
    expect(getAdaptiveKeyTier(kc)).toBe("good")
  })
})

// ---------------------------------------------------------------------------
// shouldUnlockNextKey
// ---------------------------------------------------------------------------
describe("shouldUnlockNextKey", () => {
  it("returns true when no non-forced unlocked keys exist", () => {
    expect(shouldUnlockNextKey([])).toBe(true)
  })

  it("returns true when all non-forced unlocked keys are ready", () => {
    const confs = [
      makeKC({ key: "e", bestConfidence: 1.0, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", bestConfidence: 1.0, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
    ]
    expect(shouldUnlockNextKey(confs)).toBe(true)
  })

  it("returns false when any non-forced unlocked key is not ready", () => {
    const confs = [
      makeKC({ key: "e", bestConfidence: 1.0, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", bestConfidence: 0.5, samples: 3, accuracy: 80, lifetimeAccuracy: 70 }),
    ]
    expect(shouldUnlockNextKey(confs)).toBe(false)
  })

  it("ignores forced keys", () => {
    const confs = [
      makeKC({ key: "e", bestConfidence: 1.0, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "z", forced: true, bestConfidence: 0.1, samples: 1, accuracy: 50, lifetimeAccuracy: 50 }),
    ]
    expect(shouldUnlockNextKey(confs)).toBe(true)
  })

  it("returns true when only forced keys exist (no non-forced unlocked)", () => {
    const confs = [
      makeKC({ key: "z", forced: true, bestConfidence: 0.1, samples: 1, accuracy: 50, lifetimeAccuracy: 50 }),
    ]
    expect(shouldUnlockNextKey(confs)).toBe(true)
  })

  it("respects recoverKeys=true (uses confidence instead of bestConfidence)", () => {
    const confs = [
      makeKC({ key: "e", confidence: 0.5, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
    ]
    expect(shouldUnlockNextKey(confs, false)).toBe(true)
    expect(shouldUnlockNextKey(confs, true)).toBe(false)
  })

  it("keeps progression open when recoverKeys=false and the key was historically qualified", () => {
    const confs = [
      makeKC({
        key: "e",
        confidence: 0.4,
        bestConfidence: 1.2,
        qualifiedBestConfidence: 1.2,
        samples: 60,
        accuracy: 70,
        lifetimeAccuracy: 80,
      }),
    ]
    expect(shouldUnlockNextKey(confs, false)).toBe(true)
  })

  it("blocks progression again when recoverKeys=true after a regression", () => {
    const confs = [
      makeKC({
        key: "e",
        confidence: 0.4,
        bestConfidence: 1.2,
        qualifiedBestConfidence: 1.2,
        samples: 60,
        accuracy: 70,
        lifetimeAccuracy: 80,
      }),
    ]
    expect(shouldUnlockNextKey(confs, true)).toBe(false)
  })

  it("blocks progression again when target CPM rises above historical qualification", () => {
    const confs = [
      makeKC({
        key: "e",
        confidence: 0.6,
        bestConfidence: 0.9,
        qualifiedBestConfidence: 0.9,
        samples: 60,
        accuracy: 70,
        lifetimeAccuracy: 80,
      }),
    ]
    expect(shouldUnlockNextKey(confs, false)).toBe(false)
  })

  it("ignores locked keys (unlocked: false)", () => {
    const confs = [
      makeKC({ key: "e", unlocked: false, bestConfidence: 0.1 }),
      makeKC({ key: "n", bestConfidence: 1.0, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
    ]
    // The locked key is filtered by k.unlocked && !k.forced, so only "n" is checked
    expect(shouldUnlockNextKey(confs)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getNextKeyToUnlock
// ---------------------------------------------------------------------------
describe("getNextKeyToUnlock", () => {
  it("returns the first letter from LETTER_FREQUENCY_ORDER when nothing is unlocked", () => {
    expect(getNextKeyToUnlock([])).toBe("e")
  })

  it("returns the next letter not in unlockedKeys", () => {
    expect(getNextKeyToUnlock(["e"])).toBe("n")
    expect(getNextKeyToUnlock(["e", "n"])).toBe("i")
  })

  it("skips unlocked letters in the middle", () => {
    // skip "e", "n" is not unlocked
    expect(getNextKeyToUnlock(["e", "i", "t"])).toBe("n")
  })

  it("returns null when all 26 letters are unlocked", () => {
    expect(getNextKeyToUnlock([...LETTER_FREQUENCY_ORDER])).toBeNull()
  })

  it("returns the last remaining letter", () => {
    const allButJ = LETTER_FREQUENCY_ORDER.filter((l) => l !== "j")
    expect(getNextKeyToUnlock(allButJ)).toBe("j")
  })

  it("follows exact LETTER_FREQUENCY_ORDER", () => {
    const unlocked: string[] = []
    for (const expected of LETTER_FREQUENCY_ORDER) {
      expect(getNextKeyToUnlock(unlocked)).toBe(expected)
      unlocked.push(expected)
    }
    expect(getNextKeyToUnlock(unlocked)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getFocusKey
// ---------------------------------------------------------------------------
describe("getFocusKey", () => {
  it("returns null when no keys are unlocked", () => {
    const confs = [makeKC({ key: "e", unlocked: false })]
    expect(getFocusKey(confs)).toBeNull()
  })

  it("returns null when all unlocked keys are mastered under the active gate", () => {
    const confs = [
      makeKC({ key: "e", confidence: 1.5, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", confidence: 1.2, bestConfidence: 1.2, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
    ]
    expect(getFocusKey(confs)).toBeNull()
  })

  it("returns the only blocked key", () => {
    const confs = [
      makeKC({ key: "e", confidence: 1.5, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", confidence: 0.5, bestConfidence: 0.5, samples: 3, accuracy: 80, lifetimeAccuracy: 70 }),
    ]
    expect(getFocusKey(confs)).toBe("n")
  })

  it("returns first unmastered key in frequency order", () => {
    // Both "n" and "i" are unmastered; "n" comes first in frequency order
    const confs = [
      makeKC({ key: "e", confidence: 1.5, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", confidence: 0.5, bestConfidence: 0.5, samples: 10, accuracy: 80, lifetimeAccuracy: 90 }),
      makeKC({ key: "i", confidence: 0.3, bestConfidence: 0.5, samples: 10, accuracy: 80, lifetimeAccuracy: 80 }),
    ]
    expect(getFocusKey(confs)).toBe("n")
  })

  it("does not retreat focus when recoverKeys=false and only current confidence dropped", () => {
    const confs = [
      makeKC({ key: "e", confidence: 0.8, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", confidence: 0.5, bestConfidence: 0.5, samples: 3, accuracy: 80, lifetimeAccuracy: 70 }),
    ]
    expect(getFocusKey(confs, false)).toBe("n")
  })

  it("retreats focus when recoverKeys=true and current confidence dropped", () => {
    // "e" has high bestConfidence but current confidence dropped below 1.0
    const confs = [
      makeKC({ key: "e", confidence: 0.8, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
      makeKC({ key: "n", confidence: 0.5, bestConfidence: 0.5, samples: 3, accuracy: 80, lifetimeAccuracy: 70 }),
    ]
    expect(getFocusKey(confs, true)).toBe("e")
  })

  it("does not consider locked keys", () => {
    const confs = [
      makeKC({ key: "e", unlocked: false, confidence: 0.0, bestConfidence: 0.0, samples: 0 }),
      makeKC({ key: "n", confidence: 1.5, bestConfidence: 1.5, samples: 60, accuracy: 95, lifetimeAccuracy: 95 }),
    ]
    expect(getFocusKey(confs)).toBeNull()
  })

  it("returns null for empty input", () => {
    expect(getFocusKey([])).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// computeKeyWeights
// ---------------------------------------------------------------------------
describe("computeKeyWeights", () => {
  it("assigns weight 4.0 for confidence < 0.4", () => {
    const confs = [makeKC({ key: "e", confidence: 0.3, bestConfidence: 0.3, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(4.0)
  })

  it("assigns weight 2.5 for confidence in [0.4, 0.7)", () => {
    const confs = [makeKC({ key: "e", confidence: 0.5, bestConfidence: 0.5, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(2.5)
  })

  it("assigns weight 1.5 for confidence in [0.7, 1.0)", () => {
    const confs = [makeKC({ key: "e", confidence: 0.8, bestConfidence: 0.8, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(1.5)
  })

  it("assigns weight 1.0 for confidence >= 1.0", () => {
    const confs = [makeKC({ key: "e", confidence: 1.0, bestConfidence: 1.0, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(1.0)
  })

  it("uses bestConfidence when recoverKeys=false", () => {
    const confs = [makeKC({ key: "e", confidence: 0.3, bestConfidence: 1.2, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null, false)
    expect(weights.get("e")).toBe(1.0)
  })

  it("uses current confidence when recoverKeys=true", () => {
    const confs = [makeKC({ key: "e", confidence: 0.3, bestConfidence: 1.2, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null, true)
    expect(weights.get("e")).toBe(4.0)
  })

  it("boundary: confidence exactly 0.4 → weight 2.5", () => {
    const confs = [makeKC({ key: "e", confidence: 0.4, bestConfidence: 0.4, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(2.5)
  })

  it("boundary: confidence exactly 0.7 → weight 1.5", () => {
    const confs = [makeKC({ key: "e", confidence: 0.7, bestConfidence: 0.7, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(1.5)
  })

  it("multiplies focusKey weight by 2.0", () => {
    const confs = [makeKC({ key: "e", confidence: 0.5, bestConfidence: 0.5, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], "e")
    expect(weights.get("e")).toBe(2.5 * 2.0)
  })

  it("focusKey multiplier stacks with confidence bracket", () => {
    const confs = [makeKC({ key: "e", confidence: 0.3, bestConfidence: 0.3, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], "e")
    expect(weights.get("e")).toBe(4.0 * 2.0)
  })

  it("focusKey multiplier for high-confidence key", () => {
    const confs = [makeKC({ key: "e", confidence: 1.0, bestConfidence: 1.0, samples: 20 })]
    const weights = computeKeyWeights(confs, ["e"], "e")
    expect(weights.get("e")).toBe(1.0 * 2.0)
  })

  it("applies new key boost (samples < MIN_SAMPLES_FOR_STABLE_SIGNAL)", () => {
    // confidence >= 1.0 → base weight 1.0, but samples < 15 → max(1.0, 3.0) = 3.0
    const confs = [makeKC({ key: "e", confidence: 1.0, bestConfidence: 1.0, samples: 5 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(3.0)
  })

  it("new key boost does not reduce an already higher weight", () => {
    // confidence < 0.4 → base weight 4.0, samples < 15 → max(4.0, 3.0) = 4.0
    const confs = [makeKC({ key: "e", confidence: 0.1, bestConfidence: 0.1, samples: 5 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(4.0)
  })

  it("new key boost applies after focusKey multiplier", () => {
    // confidence >= 1.0 → 1.0, focusKey → 1.0 * 2.0 = 2.0, samples < 15 → max(2.0, 3.0) = 3.0
    const confs = [makeKC({ key: "e", confidence: 1.0, bestConfidence: 1.0, samples: 5 })]
    const weights = computeKeyWeights(confs, ["e"], "e")
    expect(weights.get("e")).toBe(3.0)
  })

  it("focusKey multiplier + low confidence + new key boost", () => {
    // confidence < 0.4 → 4.0, focusKey → 4.0 * 2.0 = 8.0, samples < 15 → max(8.0, 3.0) = 8.0
    const confs = [makeKC({ key: "e", confidence: 0.1, bestConfidence: 0.1, samples: 2 })]
    const weights = computeKeyWeights(confs, ["e"], "e")
    expect(weights.get("e")).toBe(8.0)
  })

  it("excludes keys not in unlockedKeys", () => {
    const confs = [
      makeKC({ key: "e", confidence: 0.5, bestConfidence: 0.5, samples: 20 }),
      makeKC({ key: "n", confidence: 0.5, bestConfidence: 0.5, samples: 20 }),
    ]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.has("e")).toBe(true)
    expect(weights.has("n")).toBe(false)
  })

  it("returns empty map for empty inputs", () => {
    const weights = computeKeyWeights([], [], null)
    expect(weights.size).toBe(0)
  })

  it("returns empty map when no confidences match unlocked keys", () => {
    const confs = [makeKC({ key: "e", confidence: 0.5, bestConfidence: 0.5 })]
    const weights = computeKeyWeights(confs, ["n"], null)
    expect(weights.size).toBe(0)
  })

  it("handles multiple keys with different brackets", () => {
    const confs = [
      makeKC({ key: "e", confidence: 0.1, bestConfidence: 0.1, samples: 20 }),
      makeKC({ key: "n", confidence: 0.5, bestConfidence: 0.5, samples: 20 }),
      makeKC({ key: "i", confidence: 0.8, bestConfidence: 0.8, samples: 20 }),
      makeKC({ key: "t", confidence: 1.2, bestConfidence: 1.2, samples: 20 }),
    ]
    const weights = computeKeyWeights(confs, ["e", "n", "i", "t"], "e")
    expect(weights.get("e")).toBe(8.0) // 4.0 * 2.0
    expect(weights.get("n")).toBe(2.5)
    expect(weights.get("i")).toBe(1.5)
    expect(weights.get("t")).toBe(1.0)
  })

  it("samples exactly at MIN_SAMPLES_FOR_STABLE_SIGNAL → no new key boost", () => {
    const confs = [makeKC({ key: "e", confidence: 1.0, bestConfidence: 1.0, samples: MIN_SAMPLES_FOR_STABLE_SIGNAL })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(1.0)
  })

  it("samples at MIN_SAMPLES_FOR_STABLE_SIGNAL - 1 → new key boost applies", () => {
    const confs = [makeKC({ key: "e", confidence: 1.0, bestConfidence: 1.0, samples: MIN_SAMPLES_FOR_STABLE_SIGNAL - 1 })]
    const weights = computeKeyWeights(confs, ["e"], null)
    expect(weights.get("e")).toBe(3.0)
  })
})

// ---------------------------------------------------------------------------
// extractBigramMetrics
// ---------------------------------------------------------------------------
describe("extractBigramMetrics", () => {
  it("records one failure for a pending transition, then a delayed success when the target is finally typed", () => {
    const metrics = extractBigramMetrics(
      [
        makeStroke("a", true, 100, 0, 0),
        makeStroke("v", false, 180, 0, 1),
        makeStroke("x", false, 240, 0, 1),
        makeStroke("b", true, 320, 0, 1),
        makeStroke("c", true, 420, 0, 2),
        makeStroke("d", true, 520, 0, 3),
      ],
      "abcd",
    )

    expect(metrics).toEqual({
      "a:b": { successes: 1, failures: 1, latencies: [220] },
      "b:c": { successes: 1, failures: 0, latencies: [100] },
      "c:d": { successes: 1, failures: 0, latencies: [100] },
    })
  })

  it("resets the anchor on spaces so transitions do not cross word boundaries", () => {
    const metrics = extractBigramMetrics(
      [
        makeStroke("a", true, 100, 0, 0),
        makeStroke("b", true, 200, 0, 1),
        makeStroke("x", false, 260, 0, 2),
        makeStroke(" ", true, 320, 0, 2),
        makeStroke("c", true, 420, 1, 0),
        makeStroke("d", true, 520, 1, 1),
      ],
      "ab cd",
    )

    expect(metrics).toEqual({
      "a:b": { successes: 1, failures: 0, latencies: [100] },
      "c:d": { successes: 1, failures: 0, latencies: [100] },
    })
  })

  it("re-arms failure attribution after a correct input advances to the next occurrence", () => {
    const metrics = extractBigramMetrics(
      [
        makeStroke("a", true, 100, 0, 0),
        makeStroke("v", false, 180, 0, 1),
        makeStroke("b", true, 240, 0, 1),
        makeStroke("a", true, 340, 0, 2),
        makeStroke("z", false, 420, 0, 3),
        makeStroke("b", true, 500, 0, 3),
      ],
      "abab",
    )

    expect(metrics).toEqual({
      "a:b": { successes: 2, failures: 2, latencies: [140, 160] },
      "b:a": { successes: 1, failures: 0, latencies: [100] },
    })
  })
})

describe("computeTransitionScore", () => {
  it("reports true success rate from cumulative attempts while keeping decayed accuracy for scoring", () => {
    const stat: BigramStat = {
      id: 1,
      fromKey: "l",
      toKey: "e",
      bigram: "l:e",
      totalAttempts: 4,
      correctAttempts: 4,
      ewmaLatency: 200,
      bestLatency: 180,
      decayedCorrect: 3.8,
      decayedErrors: 0.05,
      lastUpdated: 1,
    }

    const result = computeTransitionScore(stat)

    expect(result.successRate).toBe(1)
    expect(result.correctAttempts).toBe(4)
    expect(result.samples).toBe(4)
    expect(result.accuracyScore).toBeCloseTo(3.8 / 3.85)
  })
})
