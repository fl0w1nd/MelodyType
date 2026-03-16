import type { KeyConfidence } from "./adaptiveEngine"
import { computeKeyWeights } from "./adaptiveEngine"
import { commonWords } from "./wordLists"
import { generateMarkovWord } from "./markov/markovModel"

const ALL_REAL_WORDS: string[] = [
  ...commonWords.easy,
  ...commonWords.medium,
  ...commonWords.hard,
]

function pickWeighted(options: string[], weights: Map<string, number>): string {
  const filtered = options.filter((o) => weights.has(o))
  if (filtered.length === 0) {
    const available = Array.from(weights.keys())
    return available[Math.floor(Math.random() * available.length)]
  }

  let totalWeight = 0
  for (const o of filtered) {
    totalWeight += weights.get(o)!
  }

  let r = Math.random() * totalWeight
  for (const o of filtered) {
    r -= weights.get(o)!
    if (r <= 0) return o
  }

  return filtered[filtered.length - 1]
}

function filterRealWords(
  availableKeys: Set<string>,
  focusKey: string | null,
): string[] {
  return ALL_REAL_WORDS.filter((word) => {
    if (!word.split("").every((ch) => availableKeys.has(ch))) return false
    if (focusKey && !word.includes(focusKey)) return false
    return true
  })
}

function scoreRealWord(
  word: string,
  keyWeights: Map<string, number>,
  focusKey: string | null,
): number {
  let score = 1
  const uniqueChars = new Set(word)

  for (const ch of uniqueChars) {
    const weight = keyWeights.get(ch)
    if (weight) {
      score += Math.max(weight - 1, 0)
    }
  }

  if (focusKey) {
    const focusCount = word.split(focusKey).length - 1
    if (focusCount > 0) {
      score += focusCount * 1.5
    }
  }

  return score
}

export function generateAdaptiveText(
  keyConfidences: KeyConfidence[],
  unlockedKeys: string[],
  focusKey: string | null,
  wordCount: number = 30,
): string {
  const availableKeys = new Set(unlockedKeys.filter((k) => /^[a-z]$/.test(k)))

  if (availableKeys.size === 0) {
    availableKeys.add("e")
    availableKeys.add("t")
    availableKeys.add("a")
  }

  const keyWeights = computeKeyWeights(keyConfidences, unlockedKeys, focusKey)

  const realWords = filterRealWords(availableKeys, focusKey)
  const realWordWeights = new Map(
    realWords.map((word) => [word, scoreRealWord(word, keyWeights, focusKey)]),
  )

  const words: string[] = []
  const recentWords: string[] = []

  for (let i = 0; i < wordCount; i++) {
    let word: string | undefined

    if (realWords.length > 0) {
      let attempts = 0
      do {
        word = pickWeighted(realWords, realWordWeights)
        attempts++
      } while (recentWords.includes(word) && attempts < 3)

      if (recentWords.includes(word) && realWords.length < 10) {
        word = undefined
      }
    }

    if (!word) {
      word = generateMarkovWord(availableKeys, focusKey)
    }

    words.push(word)
    recentWords.push(word)
    if (recentWords.length > 3) recentWords.shift()
  }

  return words.join(" ")
}
