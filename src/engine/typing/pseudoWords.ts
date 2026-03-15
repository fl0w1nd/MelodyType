import type { KeyConfidence } from "./adaptiveEngine"
import { computeKeyWeights } from "./adaptiveEngine"

const VOWELS = new Set(["a", "e", "i", "o", "u"])

const BIGRAM_TABLE: Record<string, string[]> = {
  a: ["n", "t", "l", "r", "s", "d", "c", "b", "m", "p", "k", "g", "i", "y"],
  b: ["e", "a", "o", "u", "l", "r", "i", "y"],
  c: ["o", "a", "e", "h", "k", "l", "r", "u", "i", "t"],
  d: ["e", "i", "o", "a", "u", "r", "l"],
  e: ["r", "n", "s", "d", "l", "t", "a", "c", "m", "x", "p"],
  f: ["o", "e", "a", "i", "u", "r", "l"],
  g: ["e", "a", "o", "r", "i", "u", "l", "h"],
  h: ["e", "a", "i", "o", "u"],
  i: ["n", "t", "s", "c", "l", "d", "m", "g", "v", "r", "o", "a"],
  j: ["u", "o", "a", "e", "i"],
  k: ["e", "i", "a", "n", "s"],
  l: ["e", "i", "a", "o", "l", "y", "u", "d"],
  m: ["a", "e", "o", "i", "u", "p"],
  n: ["e", "o", "a", "d", "t", "i", "g", "s", "c"],
  o: ["n", "r", "f", "t", "u", "s", "l", "d", "m", "w", "p", "k"],
  p: ["r", "e", "a", "o", "l", "i", "h", "u"],
  q: ["u"],
  r: ["e", "a", "i", "o", "s", "t", "u", "n"],
  s: ["t", "e", "o", "i", "a", "h", "u", "p", "s", "c", "k"],
  t: ["h", "e", "o", "i", "a", "r", "u", "s"],
  u: ["r", "s", "t", "n", "l", "d", "m", "p", "c"],
  v: ["e", "i", "a", "o"],
  w: ["a", "i", "e", "o", "h"],
  x: ["t", "p", "i", "a"],
  y: ["e", "o", "s", "a"],
  z: ["e", "a", "o", "i"],
}

const COMMON_ENDINGS = ["ed", "er", "le", "ly", "al", "en", "an", "on", "in", "es", "or"]
const COMMON_STARTS = ["th", "sh", "ch", "wh", "st", "sp", "tr", "pr", "cr", "br", "gr", "fr", "fl", "bl", "cl"]

function pickWeighted(options: string[], weights: Map<string, number>): string {
  const filtered = options.filter((o) => weights.has(o))
  if (filtered.length === 0) {
    const available = Array.from(weights.keys())
    return available[Math.floor(Math.random() * available.length)]
  }

  let totalWeight = 0
  for (const o of filtered) {
    totalWeight += weights.get(o) ?? 1
  }

  let r = Math.random() * totalWeight
  for (const o of filtered) {
    r -= weights.get(o) ?? 1
    if (r <= 0) return o
  }

  return filtered[filtered.length - 1]
}

function pickFromPool(options: string[], available: Set<string>): string | null {
  const valid = options.filter((o) =>
    o.split("").every((ch) => available.has(ch))
  )
  if (valid.length === 0) return null
  return valid[Math.floor(Math.random() * valid.length)]
}

function isVowel(ch: string): boolean {
  return VOWELS.has(ch)
}

function generatePseudoWord(
  availableKeys: Set<string>,
  keyWeights: Map<string, number>,
  targetLen: number,
): string {
  let word = ""

  if (targetLen >= 3 && Math.random() < 0.3) {
    const start = pickFromPool(COMMON_STARTS, availableKeys)
    if (start) {
      word = start
    }
  }

  if (word.length === 0) {
    word = pickWeighted(
      Array.from(availableKeys),
      keyWeights,
    )
  }

  while (word.length < targetLen) {
    const lastChar = word[word.length - 1]
    const secondLast = word.length > 1 ? word[word.length - 2] : ""

    const consecutiveConsonants =
      !isVowel(lastChar) && secondLast && !isVowel(secondLast)
    const consecutiveVowels =
      isVowel(lastChar) && secondLast && isVowel(secondLast)

    let candidates = BIGRAM_TABLE[lastChar] || []
    candidates = candidates.filter((c) => availableKeys.has(c))

    if (consecutiveConsonants) {
      const vowelCandidates = candidates.filter(isVowel)
      if (vowelCandidates.length > 0) candidates = vowelCandidates
    } else if (consecutiveVowels) {
      const consonantCandidates = candidates.filter((c) => !isVowel(c))
      if (consonantCandidates.length > 0) candidates = consonantCandidates
    }

    if (candidates.length === 0) {
      const available = Array.from(availableKeys)
      const needed = consecutiveConsonants
        ? available.filter(isVowel)
        : consecutiveVowels
          ? available.filter((c) => !isVowel(c))
          : available
      candidates = needed.length > 0 ? needed : available
    }

    if (word.length === targetLen - 2 && Math.random() < 0.3) {
      const ending = pickFromPool(COMMON_ENDINGS, availableKeys)
      if (ending && word.length + ending.length <= targetLen + 1) {
        word += ending
        break
      }
    }

    word += pickWeighted(candidates, keyWeights)
  }

  return word.slice(0, targetLen)
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

  const words: string[] = []

  for (let i = 0; i < wordCount; i++) {
    const len = Math.floor(Math.random() * 5) + 3
    const word = generatePseudoWord(availableKeys, keyWeights, len)
    words.push(word)
  }

  return words.join(" ")
}
