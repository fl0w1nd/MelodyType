import type { AdaptiveMixOptions, BigramScore, KeyConfidence } from "./adaptiveEngine"
import { computeKeyWeights } from "./adaptiveEngine"
import { getLogicalCharCategory } from "@/lib/keyboardLayout"
import {
  type BridgeMixPlan,
  commonWords,
  injectNumbers,
  applyPunctuation,
  injectSpecialCharacters,
  joinWordsWithMixedBridges,
} from "./wordLists"
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
      if (word.indexOf(focusKey) > 0) {
        score += 1.0
      }
    }
  }

  return score
}

export function generateAdaptiveText(
  keyConfidences: KeyConfidence[],
  unlockedKeys: string[],
  focusKey: string | null,
  wordCount: number = 30,
  recoverKeys: boolean = false,
  options?: AdaptiveMixOptions,
): string {
  const availableKeys = new Set(unlockedKeys.filter((k) => /^[a-z]$/.test(k)))

  if (availableKeys.size === 0) {
    availableKeys.add("e")
    availableKeys.add("t")
    availableKeys.add("a")
  }

  const keyWeights = computeKeyWeights(keyConfidences, unlockedKeys, focusKey, recoverKeys)

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

  return applyAdaptiveMixLayers(words, options)
}

function scoreBigramWord(
  word: string,
  weakBigramWeights: Map<string, number>,
): number {
  let score = 1
  for (let i = 0; i < word.length - 1; i++) {
    const bigram = `${word[i]}:${word[i + 1]}`
    const weakness = weakBigramWeights.get(bigram)
    if (weakness) score += weakness
  }
  return score
}

function applyAdaptiveMixLayers(
  words: string[],
  options?: AdaptiveMixOptions,
  bridgePlan?: BridgeMixPlan,
): string {
  let mixed = [...words]
  if (options?.numbers) {
    mixed = injectNumbers(mixed)
  }
  if (options?.specialCharacters) {
    mixed = injectSpecialCharacters(mixed)
  }
  if (options?.punctuation) {
    mixed = applyPunctuation(mixed)
  }
  return joinWordsWithMixedBridges(mixed, options, bridgePlan)
}

function isWordTargetableBigram(bg: BigramScore): boolean {
  return (
    getLogicalCharCategory(bg.fromKey) === "letter" &&
    getLogicalCharCategory(bg.toKey) === "letter"
  )
}

const SYMBOL_TOKEN_PREFIXES = [
  "",
  "id",
  "dev",
  "tag",
  "tmp",
  "src",
  "home",
  "ref",
  "meta",
]

const SYMBOL_TOKEN_SUFFIXES = [
  "",
  "app",
  "log",
  "file",
  "box",
  "lab",
  "dev",
  "io",
]

function pickOne(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)]
}

function buildSymbolDrillToken(bg: BigramScore): string {
  const pair = `${bg.fromKey}${bg.toKey}`
  const prefix = pickOne(SYMBOL_TOKEN_PREFIXES)
  const suffix = pickOne(SYMBOL_TOKEN_SUFFIXES)
  const firstNonLetter = [bg.fromKey, bg.toKey].find(
    (ch) => getLogicalCharCategory(ch) !== "letter",
  )

  switch (firstNonLetter) {
    case "@":
      return `${prefix}${pair}${suffix}`
    case "#":
      return `#${prefix}${pair}${suffix}`
    case "$":
      return `$${prefix}${pair}${suffix}`
    case "%":
      return `${prefix}${pair}${suffix}%`
    case "/":
      return `${prefix}${pair}${suffix}`
    case "\\":
      return `${prefix}${pair}${suffix}`
    case "[":
      return `${prefix}${pair}${suffix}]`
    case "]":
      return `${prefix}[${pair}${suffix}`
    case "{":
      return `${prefix}${pair}${suffix}}`
    case "}":
      return `${prefix}{${pair}${suffix}`
    case "(":
      return `${prefix}${pair}${suffix})`
    case ")":
      return `${prefix}(${pair}${suffix}`
    case "<":
      return `${prefix}${pair}${suffix}>`
    case ">":
      return `${prefix}<${pair}${suffix}`
    case "`":
      return `\`${prefix}${pair}${suffix}\``
    default:
      return `${prefix}${pair}${suffix}`
  }
}

function generateWeightedWordSequence(
  wordPool: string[],
  wordWeights: Map<string, number>,
  wordCount: number,
): string[] {
  const words: string[] = []
  const recentWords: string[] = []

  for (let i = 0; i < wordCount; i++) {
    let word: string | undefined

    let attempts = 0
    do {
      word = pickWeighted(wordPool, wordWeights)
      attempts++
    } while (recentWords.includes(word) && attempts < 5)

    if (!word) {
      word = wordPool[Math.floor(Math.random() * wordPool.length)]
    }

    words.push(word)
    recentWords.push(word)
    if (recentWords.length > 3) recentWords.shift()
  }

  return words
}

function interleaveWordsAndDrills(words: string[], drills: string[]): string[] {
  if (drills.length === 0) return words
  if (words.length === 0) return drills

  const result: string[] = []
  let drillIndex = 0
  const spacing = Math.max(2, Math.floor(words.length / drills.length))

  for (let i = 0; i < words.length; i++) {
    result.push(words[i])
    if (
      drillIndex < drills.length &&
      (i % spacing === spacing - 1 || i === words.length - 1)
    ) {
      result.push(drills[drillIndex])
      drillIndex++
    }
  }

  while (drillIndex < drills.length) {
    result.push(drills[drillIndex])
    drillIndex++
  }

  return result
}

function buildBridgePlanForWeakBigrams(
  weakBigrams: BigramScore[],
  symbolTargetBigrams: BigramScore[],
): BridgeMixPlan {
  const symbolTargetRatio =
    weakBigrams.length > 0 ? symbolTargetBigrams.length / weakBigrams.length : 0
  const categoryWeights: Record<"numbers" | "punctuation" | "specialCharacters", number> = {
    numbers: 1,
    punctuation: 1,
    specialCharacters: 1,
  }

  for (const bg of symbolTargetBigrams) {
    const categories = new Set(
      [bg.fromKey, bg.toKey]
        .map((key) => getLogicalCharCategory(key))
        .filter((category) => category === "digit" || category === "punctuation" || category === "special"),
    )
    for (const category of categories) {
      if (category === "digit") {
        categoryWeights.numbers += 1
      } else if (category === "punctuation") {
        categoryWeights.punctuation += 1
      } else if (category === "special") {
        categoryWeights.specialCharacters += 1
      }
    }
  }

  return {
    mode: "reinforcement",
    symbolTargetRatio,
    categoryWeights,
  }
}

export function generateReinforcementText(
  weakBigrams: BigramScore[],
  wordCount: number = 30,
  options?: AdaptiveMixOptions,
): string {
  if (weakBigrams.length === 0) {
    return applyAdaptiveMixLayers(
      ALL_REAL_WORDS.sort(() => Math.random() - 0.5).slice(0, wordCount),
      options,
      { mode: "reinforcement" },
    )
  }

  const wordTargetBigrams = weakBigrams.filter(isWordTargetableBigram)
  const symbolTargetBigrams = weakBigrams.filter((bg) => !isWordTargetableBigram(bg))
  const weakBigramWeights = new Map<string, number>()
  for (const bg of wordTargetBigrams) {
    const weakness = Math.max(0, 1 - bg.score) * 5 + 1
    weakBigramWeights.set(bg.bigram, weakness)
  }

  const targetBigramChars = new Set<string>()
  for (const bg of wordTargetBigrams.slice(0, 10)) {
    targetBigramChars.add(bg.fromKey)
    targetBigramChars.add(bg.toKey)
  }

  const candidateWords = ALL_REAL_WORDS.filter((word) => {
    for (let i = 0; i < word.length - 1; i++) {
      const bigram = `${word[i]}:${word[i + 1]}`
      if (weakBigramWeights.has(bigram)) return true
    }
    return false
  })

  const fallbackWords = ALL_REAL_WORDS.filter((word) =>
    word.split("").some((ch) => targetBigramChars.has(ch)),
  )

  const wordPool = candidateWords.length >= 10 ? candidateWords : fallbackWords
  const symbolDrillCount = symbolTargetBigrams.length > 0
    ? Math.min(Math.max(1, Math.ceil(wordCount * 0.2)), Math.max(3, symbolTargetBigrams.length))
    : 0
  const fillerWordCount = Math.max(wordCount - symbolDrillCount, 0)
  const symbolDrills = Array.from({ length: symbolDrillCount }, (_, index) =>
    buildSymbolDrillToken(symbolTargetBigrams[index % symbolTargetBigrams.length]),
  )

  let weightedWords: string[] = []
  if (wordPool.length > 0 && fillerWordCount > 0) {
    const wordWeights = new Map(
      wordPool.map((word) => [word, scoreBigramWord(word, weakBigramWeights)]),
    )
    weightedWords = generateWeightedWordSequence(wordPool, wordWeights, fillerWordCount)
  } else if (fillerWordCount > 0) {
    weightedWords = ALL_REAL_WORDS.sort(() => Math.random() - 0.5).slice(0, fillerWordCount)
  }

  return applyAdaptiveMixLayers(
    interleaveWordsAndDrills(weightedWords, symbolDrills).slice(0, wordCount),
    options,
    buildBridgePlanForWeakBigrams(weakBigrams, symbolTargetBigrams),
  )
}
