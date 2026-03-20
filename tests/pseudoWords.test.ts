import { describe, it, expect } from "vitest"
import { generateMarkovWord } from "../src/engine/typing/markov/markovModel"

const FULL_ALPHABET = new Set("abcdefghijklmnopqrstuvwxyz".split(""))
const SMALL_POOL = new Set(["e", "t", "a", "o", "n", "i", "s"])

describe("generateMarkovWord — focus key position diversity", () => {
  it("places focusKey at non-initial position >= 50% of the time (full alphabet)", () => {
    const focusKey = "i"
    let nonInitial = 0
    const total = 200

    for (let i = 0; i < total; i++) {
      const word = generateMarkovWord(FULL_ALPHABET, focusKey)
      expect(word.length).toBeGreaterThanOrEqual(1)
      if (word.includes(focusKey) && word.indexOf(focusKey) > 0) {
        nonInitial++
      }
    }

    expect(nonInitial / total).toBeGreaterThanOrEqual(0.5)
  })

  it("places focusKey at non-initial position >= 50% of the time (small key pool)", () => {
    const focusKey = "i"
    let nonInitial = 0
    const total = 200

    for (let i = 0; i < total; i++) {
      const word = generateMarkovWord(SMALL_POOL, focusKey)
      expect(word.length).toBeGreaterThanOrEqual(1)
      if (word.includes(focusKey) && word.indexOf(focusKey) > 0) {
        nonInitial++
      }
    }

    expect(nonInitial / total).toBeGreaterThanOrEqual(0.5)
  })

  it("generates valid words without focusKey (no regression)", () => {
    for (let i = 0; i < 50; i++) {
      const word = generateMarkovWord(FULL_ALPHABET, null)
      expect(word.length).toBeGreaterThanOrEqual(1)
      expect(word).toMatch(/^[a-z]+$/)
    }
  })

  it("always includes focusKey somewhere in the word", () => {
    const focusKey = "i"
    for (let i = 0; i < 100; i++) {
      const word = generateMarkovWord(FULL_ALPHABET, focusKey)
      expect(word).toContain(focusKey)
    }
  })
})
