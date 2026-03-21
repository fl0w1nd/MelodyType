import { PROSE_PUNCTUATION_CHARS } from "@/lib/keyboardLayout"

export const fingerForKey: Record<string, string> = {
  q: "Left Pinky",
  a: "Left Pinky",
  z: "Left Pinky",
  "1": "Left Pinky",
  w: "Left Ring",
  s: "Left Ring",
  x: "Left Ring",
  "2": "Left Ring",
  e: "Left Middle",
  d: "Left Middle",
  c: "Left Middle",
  "3": "Left Middle",
  r: "Left Index",
  f: "Left Index",
  v: "Left Index",
  t: "Left Index",
  g: "Left Index",
  b: "Left Index",
  "4": "Left Index",
  "5": "Left Index",
  y: "Right Index",
  h: "Right Index",
  n: "Right Index",
  u: "Right Index",
  j: "Right Index",
  m: "Right Index",
  "6": "Right Index",
  "7": "Right Index",
  i: "Right Middle",
  k: "Right Middle",
  ",": "Right Middle",
  "8": "Right Middle",
  o: "Right Ring",
  l: "Right Ring",
  ".": "Right Ring",
  "9": "Right Ring",
  p: "Right Pinky",
  ";": "Right Pinky",
  "/": "Right Pinky",
  "0": "Right Pinky",
  "[": "Right Pinky",
  "]": "Right Pinky",
  "'": "Right Pinky",
}

export const commonWords: Record<string, string[]> = {
  easy: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
    "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
    "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
    "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know",
    "take", "come", "could", "than", "look", "day", "did", "ask", "back",
    "use", "way", "may", "well", "also", "play", "run", "move", "live",
    "has", "see", "had", "was", "are", "new", "old", "big", "long",
  ],
  medium: [
    "people", "think", "after", "because", "other", "these", "first",
    "right", "being", "still", "where", "before", "should", "through",
    "great", "every", "world", "between", "never", "place", "same",
    "another", "while", "change", "might", "again", "point", "house",
    "something", "number", "water", "found", "always", "together",
    "important", "family", "system", "country", "follow", "second",
    "under", "problem", "during", "without", "begin", "group", "often",
    "already", "until", "program", "company", "example", "small",
    "large", "better", "question", "really", "different", "around",
    "develop", "interest", "student", "answer", "several", "possible",
    "morning", "evening", "friend", "simple", "letter", "market",
  ],
  hard: [
    "government", "experience", "education", "environment", "information",
    "development", "technology", "understanding", "organization", "particular",
    "international", "significant", "responsibility", "communication",
    "professional", "opportunity", "relationship", "performance", "management",
    "community", "situation", "difference", "knowledge", "individual",
    "political", "certainly", "everything", "especially", "necessary",
    "consequence", "acknowledge", "demonstrate", "approximately",
    "accomplish", "circumstance", "independent", "infrastructure",
    "comprehensive", "sophisticated", "extraordinary", "nevertheless",
    "collaboration", "consciousness", "transformation", "philosophical",
    "unfortunately", "simultaneously", "representative", "recommendation",
  ],
}

const punctuationMarks = [...PROSE_PUNCTUATION_CHARS]
const sentenceEnders = [".", "!", "?"]
const numberBridgeTokens = ["7", "12", "42", "64", "99", "2026"]
const punctuationBridgeTokens = ["-", "-", ":", ";", "'", "\"", ",", ".", "!", "?"]
const specialBridgeTokens = [
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "_",
  "+",
  "=",
  "/",
  "\\",
  "|",
  "~",
  "[]",
  "{}",
  "()",
  "<>",
]

export interface InlineMixOptions {
  punctuation?: boolean
  numbers?: boolean
  specialCharacters?: boolean
}

export interface BridgeMixPlan {
  mode?: "adaptive" | "reinforcement"
  symbolTargetRatio?: number
  categoryWeights?: Partial<Record<keyof InlineMixOptions, number>>
}

type BridgeKind = keyof InlineMixOptions
type SpecialTokenContext = {
  left: string
  right: string
  tag: string
  local: string
  domain: string
}

const specialTokenWordPool = [
  ...commonWords.easy,
  ...commonWords.medium,
  ...commonWords.hard,
].filter((word) => /^[a-z]+$/.test(word))

const specialTokenFactories: Array<(ctx: SpecialTokenContext) => string> = [
  ({ tag }) => `\`${tag}\``,
  ({ tag }) => `~${tag}`,
  ({ local, domain }) => `${local}@${domain}`,
  ({ tag }) => `#${tag}`,
  ({ left, right }) => `${left}$${right}`,
  ({ left, right }) => `${left}%${right}`,
  ({ left, right }) => `${left}^${right}`,
  ({ left, right }) => `${left}&${right}`,
  ({ left, right }) => `${left}*${right}`,
  ({ tag }) => `(${tag})`,
  ({ left, right }) => `${left}_${right}`,
  ({ left, right }) => `${left}=${right}`,
  ({ left, right }) => `${left}+${right}`,
  ({ tag }) => `[${tag}]`,
  ({ tag }) => `{${tag}}`,
  ({ left, right }) => `${left}\\${right}`,
  ({ left, right }) => `${left}|${right}`,
  ({ left, right }) => `${left}/${right}`,
  ({ left, right }) => `${left}<${right}`,
  ({ left, right }) => `${left}>${right}`,
]

function pickOne<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)]
}

function normalizeTokenWord(word: string | undefined, maxLength: number = 8): string {
  const normalized = (word ?? "").toLowerCase().replace(/[^a-z]/g, "")
  if (normalized.length === 0) return ""
  return normalized.slice(0, maxLength)
}

function pickPoolTokenWord(exclude?: string, maxLength: number = 8): string {
  const candidates = specialTokenWordPool
    .map((word) => normalizeTokenWord(word, maxLength))
    .filter((word) => word.length >= 2 && word !== exclude)

  return candidates.length > 0 ? pickOne(candidates) : "tone"
}

function resolveContextWord(
  words: string[],
  index: number,
  offsets: number[],
  maxLength: number = 8,
  exclude?: string,
): string {
  for (const offset of offsets) {
    const candidate = normalizeTokenWord(words[index + offset], maxLength)
    if (candidate.length >= 2 && candidate !== exclude) {
      return candidate
    }
  }
  return pickPoolTokenWord(exclude, maxLength)
}

function buildSpecialTokenContext(words: string[], index: number): SpecialTokenContext {
  const left = resolveContextWord(words, index, [0, -1, 1], 6)
  const right = resolveContextWord(words, index, [1, -1, 2, -2], 6, left)
  const tag = resolveContextWord(words, index, [0, 1, -1], 7)
  const local = resolveContextWord(words, index, [0, -1, 1], 8)
  const domain = resolveContextWord(words, index, [1, 2, -1], 6, local)

  return {
    left,
    right,
    tag,
    local,
    domain,
  }
}

export function buildSpecialCharacterToken(words: string[], index: number): string {
  const context = buildSpecialTokenContext(words, index)
  return pickOne(specialTokenFactories)(context)
}

function capitalizeFirstLetter(word: string): string {
  if (!word || !/^[a-z]/.test(word)) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function takeRandomIndices(length: number, count: number, used: Set<number>): number[] {
  const indices = Array.from({ length }, (_, index) => index).filter((index) => !used.has(index))
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = indices[i]
    indices[i] = indices[j]
    indices[j] = current
  }
  return indices.slice(0, count)
}

function pickWeightedBridgeKind(entries: Array<{ kind: BridgeKind; weight: number }>): BridgeKind {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = Math.random() * totalWeight
  for (const entry of entries) {
    cursor -= entry.weight
    if (cursor <= 0) return entry.kind
  }
  return entries[entries.length - 1].kind
}

function getTargetBridgeRatio(
  enabledKinds: BridgeKind[],
  plan?: BridgeMixPlan,
): number {
  if (enabledKinds.length === 0) return 0

  const baseRatio = enabledKinds.length === 1
    ? 0.12
    : enabledKinds.length === 2
      ? 0.18
      : 0.24
  const reinforcementBoost = plan?.mode === "reinforcement" ? 0.02 : 0
  const symbolPressureBoost = Math.min(Math.max(plan?.symbolTargetRatio ?? 0, 0), 1) * 0.08

  return Math.min(0.33, baseRatio + reinforcementBoost + symbolPressureBoost)
}

function getBridgeCounts(
  separatorCount: number,
  enabledKinds: BridgeKind[],
  plan?: BridgeMixPlan,
): Record<BridgeKind, number> {
  const counts: Record<BridgeKind, number> = {
    numbers: 0,
    punctuation: 0,
    specialCharacters: 0,
  }
  if (separatorCount <= 0 || enabledKinds.length === 0) {
    return counts
  }

  const targetRatio = getTargetBridgeRatio(enabledKinds, plan)
  const totalBridgeCount = Math.min(
    separatorCount,
    Math.max(
      enabledKinds.length,
      Math.round(separatorCount * targetRatio),
    ),
  )

  const weightedKinds = enabledKinds.map((kind) => ({
    kind,
    weight: Math.max(plan?.categoryWeights?.[kind] ?? 1, 0.1),
  }))

  if (totalBridgeCount <= enabledKinds.length) {
    const chosenKinds = [...enabledKinds]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalBridgeCount)
    for (const kind of chosenKinds) {
      counts[kind] += 1
    }
    return counts
  }

  for (const kind of enabledKinds) {
    counts[kind] += 1
  }

  for (let slot = enabledKinds.length; slot < totalBridgeCount; slot++) {
    const kind = pickWeightedBridgeKind(weightedKinds)
    counts[kind] += 1
  }

  return counts
}

export function joinWordsWithMixedBridges(
  words: string[],
  options?: InlineMixOptions,
  plan?: BridgeMixPlan,
): string {
  if (words.length === 0) return ""
  if (words.length === 1) return words[0]

  const stitchedWords = [...words]
  const separators = Array.from({ length: stitchedWords.length - 1 }, () => " ")
  const usedIndices = new Set<number>()
  const enabledKinds = ([
    options?.numbers && "numbers",
    options?.punctuation && "punctuation",
    options?.specialCharacters && "specialCharacters",
  ].filter(Boolean) as BridgeKind[])
  const bridgeCounts = getBridgeCounts(separators.length, enabledKinds, plan)

  const applyBridgeLayer = (
    count: number,
    fragments: readonly string[],
    onApply?: (index: number, fragment: string) => void,
  ) => {
    if (count <= 0) return
    const indices = takeRandomIndices(separators.length, count, usedIndices)
    for (const index of indices) {
      const fragment = pickOne(fragments)
      separators[index] = fragment
      usedIndices.add(index)
      onApply?.(index, fragment)
    }
  }

  applyBridgeLayer(bridgeCounts.numbers, numberBridgeTokens)
  applyBridgeLayer(bridgeCounts.specialCharacters, specialBridgeTokens)
  applyBridgeLayer(bridgeCounts.punctuation, punctuationBridgeTokens, (index, fragment) => {
    if (sentenceEnders.includes(fragment)) {
      stitchedWords[index + 1] = capitalizeFirstLetter(stitchedWords[index + 1])
    }
  })

  let text = stitchedWords[0]
  for (let index = 0; index < separators.length; index++) {
    text += separators[index] + stitchedWords[index + 1]
  }

  return text
}

export function applyPunctuation(words: string[]): string[] {
  const result = [...words]
  let sentenceLen = 0
  const targetSentenceLen = () => 5 + Math.floor(Math.random() * 8)
  let nextEnd = targetSentenceLen()

  for (let i = 0; i < result.length; i++) {
    sentenceLen++

    if (sentenceLen >= nextEnd && i < result.length - 1) {
      const ender = sentenceEnders[Math.floor(Math.random() * sentenceEnders.length)]
      result[i] = result[i] + ender
      if (i + 1 < result.length) {
        result[i + 1] = capitalizeFirstLetter(result[i + 1])
      }
      sentenceLen = 0
      nextEnd = targetSentenceLen()
    } else if (Math.random() < 0.08 && sentenceLen > 2) {
      const mid = punctuationMarks[1 + Math.floor(Math.random() * 2)]
      result[i] = result[i] + mid
    }
  }

  if (result.length > 0) {
    result[0] = capitalizeFirstLetter(result[0])
  }

  return result
}

export function injectNumbers(words: string[]): string[] {
  const result = [...words]
  const numCount = Math.max(1, Math.floor(words.length * 0.08))

  for (let n = 0; n < numCount; n++) {
    const idx = Math.floor(Math.random() * result.length)
    const style = Math.random()
    if (style < 0.4) {
      result[idx] = String(Math.floor(Math.random() * 1000))
    } else if (style < 0.7) {
      result[idx] = String(Math.floor(Math.random() * 100)) + result[idx]
    } else {
      result[idx] = result[idx] + String(Math.floor(Math.random() * 100))
    }
  }

  return result
}

export function injectSpecialCharacters(words: string[]): string[] {
  const result = [...words]
  const sourceWords = [...words]
  const tokenCount = Math.max(1, Math.floor(words.length * 0.08))
  const usedTokens = new Set<string>()

  for (let n = 0; n < tokenCount; n++) {
    const idx = Math.floor(Math.random() * result.length)
    let token = buildSpecialCharacterToken(sourceWords, idx)

    let attempts = 0
    while (usedTokens.has(token) && attempts < 4) {
      token = buildSpecialCharacterToken(sourceWords, idx)
      attempts++
    }

    usedTokens.add(token)
    result[idx] = token
  }

  return result
}

export function generateWordText(
  difficulty: "easy" | "medium" | "hard",
  wordCount: number,
  options?: { punctuation?: boolean; numbers?: boolean },
): string {
  const pool = commonWords[difficulty]
  let words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)])
  }

  if (options?.numbers) {
    words = injectNumbers(words)
  }

  if (options?.punctuation) {
    words = applyPunctuation(words)
  }

  return words.join(" ")
}
