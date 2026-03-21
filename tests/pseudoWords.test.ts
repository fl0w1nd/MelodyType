import { describe, it, expect, vi } from "vitest"
import { generateMarkovWord } from "../src/engine/typing/markov/markovModel"
import { generateReinforcementText } from "../src/engine/typing/pseudoWords"
import {
  buildSpecialCharacterToken,
  joinWordsWithMixedBridges,
} from "../src/engine/typing/wordLists"
import { DIGIT_CHARS, PROSE_PUNCTUATION_CHARS } from "../src/lib/keyboardLayout"

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

describe("generateReinforcementText — symbol drills", () => {
  it("injects explicit punctuation drill tokens for symbol weak bigrams", () => {
    const text = generateReinforcementText([
      {
        bigram: "a:?",
        fromKey: "a",
        toKey: "?",
        score: 0.2,
        speedScore: 0.4,
        accuracyScore: 0.5,
        successRate: 0.5,
        correctAttempts: 3,
        samples: 6,
      },
    ], 12, {
      numbers: false,
      punctuation: true,
      specialCharacters: false,
    })

    expect(text).toMatch(/a\?/)
  })

  it("injects explicit special-character drill tokens for symbol weak bigrams", () => {
    const text = generateReinforcementText([
      {
        bigram: "a:=",
        fromKey: "a",
        toKey: "=",
        score: 0.2,
        speedScore: 0.4,
        accuracyScore: 0.5,
        successRate: 0.5,
        correctAttempts: 3,
        samples: 6,
      },
    ], 12, {
      numbers: false,
      punctuation: false,
      specialCharacters: true,
    })

    expect(text).toMatch(/a=/)
  })

  it("keeps special-only reinforcement free from digits and prose punctuation", () => {
    const text = generateReinforcementText([
      {
        bigram: "a:@",
        fromKey: "a",
        toKey: "@",
        score: 0.2,
        speedScore: 0.4,
        accuracyScore: 0.5,
        successRate: 0.5,
        correctAttempts: 3,
        samples: 6,
      },
    ], 12, {
      numbers: false,
      punctuation: false,
      specialCharacters: true,
    })

    for (const char of [...DIGIT_CHARS, ...PROSE_PUNCTUATION_CHARS]) {
      expect(text).not.toContain(char)
    }
  })
})

describe("buildSpecialCharacterToken", () => {
  it("keeps the template stable while varying the letters from nearby words", () => {
    const randomSpy = vi.spyOn(Math, "random")
    randomSpy
      .mockReturnValueOnce(0.11)
      .mockReturnValueOnce(0.11)

    const first = buildSpecialCharacterToken(["alpha", "beta", "gamma"], 0)
    const second = buildSpecialCharacterToken(["alpha", "beta", "gamma"], 1)

    expect(first).toBe("alpha@beta")
    expect(second).toBe("beta@gamma")
    expect(second).not.toBe(first)

    randomSpy.mockRestore()
  })
})

describe("joinWordsWithMixedBridges", () => {
  const sampleWords = ["alpha", "beta", "gamma", "delta", "omega", "theta", "sigma", "kappa"]
  const longWords = [
    "alpha", "beta", "gamma", "delta", "omega", "theta", "sigma", "kappa", "lambda", "tau",
    "river", "paper", "solar", "music", "garden", "planet", "orange", "silver", "forest", "rocket",
    "velvet", "winter", "summer", "marble", "violet", "willow", "meadow", "breeze", "canyon", "harbor",
  ]

  function countSpaces(text: string): number {
    return text.split(" ").length - 1
  }

  it("replaces part of the original spaces with number bridges", () => {
    const text = joinWordsWithMixedBridges(sampleWords, { numbers: true })
    const spaceCount = countSpaces(text)

    expect(spaceCount).toBeLessThan(sampleWords.length - 1)
    expect(text).toMatch(/[A-Za-z][0-9]+[A-Za-z]/)
  })

  it("replaces part of the original spaces with punctuation bridges", () => {
    const text = joinWordsWithMixedBridges(sampleWords, { punctuation: true })
    const spaceCount = countSpaces(text)

    expect(spaceCount).toBeLessThan(sampleWords.length - 1)
    expect(text).toMatch(/[A-Za-z][,.;:!?\-'""][A-Za-z]/)
  })

  it("replaces part of the original spaces with special-character bridges", () => {
    const text = joinWordsWithMixedBridges(sampleWords, { specialCharacters: true })
    const spaceCount = countSpaces(text)

    expect(spaceCount).toBeLessThan(sampleWords.length - 1)
    expect(text).toMatch(/[A-Za-z][@#$%^&*_+=/\\|~<>{}[\]()]+[A-Za-z]/)
  })

  it("replaces more spaces when more mix categories are enabled", () => {
    const singleCategory = joinWordsWithMixedBridges(longWords, { punctuation: true })
    const allCategories = joinWordsWithMixedBridges(longWords, {
      numbers: true,
      punctuation: true,
      specialCharacters: true,
    })

    expect(countSpaces(allCategories)).toBeLessThan(countSpaces(singleCategory))
  })

  it("boosts bridge replacement during reinforcement when symbol pressure is high", () => {
    const adaptiveMix = joinWordsWithMixedBridges(
      longWords,
      { punctuation: true },
      { mode: "adaptive" },
    )
    const reinforcementMix = joinWordsWithMixedBridges(
      longWords,
      { punctuation: true },
      { mode: "reinforcement", symbolTargetRatio: 1 },
    )

    expect(countSpaces(reinforcementMix)).toBeLessThan(countSpaces(adaptiveMix))
  })
})
