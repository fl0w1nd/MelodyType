import type { CharState, WordState } from "./types"

export interface AccuracyStroke {
  key: string
  correct: boolean
}

export interface TargetAccuracyKeyStat {
  key: string
  successes: number
  falsePresses: number
  occurrences: number
}

export interface TargetAccuracyAnalysis {
  successes: number
  falsePresses: number
  occurrences: number
  accuracy: number | null
  keyStats: Map<string, TargetAccuracyKeyStat>
}

export interface AccuracySummary {
  accuracy: number
  correctChars: number
  incorrectChars: number
  totalChars: number
}

function normalizeAccuracyKey(key: string): string | null {
  if (key === " ") return " "
  if (key.length !== 1) return null
  return key.toLowerCase()
}

export function isLetterAccuracyKey(key: string | null): key is string {
  return key != null && key.length === 1 && key >= "a" && key <= "z"
}

export function isNonSpaceAccuracyKey(key: string | null): key is string {
  return key != null && key !== " "
}

export function computeAccuracyPercent(
  successes: number,
  falsePresses: number,
  emptyValue: number = 100,
): number {
  const total = successes + falsePresses
  return total > 0 ? (successes / total) * 100 : emptyValue
}

export function analyzeTargetAccuracy(
  keystrokes: AccuracyStroke[],
  includeTarget: (key: string) => boolean = isNonSpaceAccuracyKey,
): TargetAccuracyAnalysis {
  const keyStats = new Map<string, TargetAccuracyKeyStat>()
  const correctSequence = keystrokes
    .filter((stroke) => stroke.correct)
    .map((stroke) => normalizeAccuracyKey(stroke.key))
    .filter((key): key is string => key != null)

  let expectedIndex = 0
  let positionAlreadyFailed = false
  let successes = 0
  let falsePresses = 0

  const ensure = (key: string) => {
    const existing = keyStats.get(key)
    if (existing) return existing
    const created: TargetAccuracyKeyStat = {
      key,
      successes: 0,
      falsePresses: 0,
      occurrences: 0,
    }
    keyStats.set(key, created)
    return created
  }

  for (const stroke of keystrokes) {
    const expectedKey = correctSequence[expectedIndex] ?? null

    if (stroke.correct) {
      if (expectedKey != null && includeTarget(expectedKey)) {
        const stat = ensure(expectedKey)
        stat.occurrences += 1
        if (!positionAlreadyFailed) {
          stat.successes += 1
          successes += 1
        }
      }

      if (expectedKey != null) {
        expectedIndex += 1
        positionAlreadyFailed = false
      }
      continue
    }

    if (!positionAlreadyFailed && expectedKey != null && includeTarget(expectedKey)) {
      const stat = ensure(expectedKey)
      stat.falsePresses += 1
      falsePresses += 1
      positionAlreadyFailed = true
    }
  }

  const occurrences = successes + falsePresses
  return {
    successes,
    falsePresses,
    occurrences,
    accuracy: occurrences > 0 ? computeAccuracyPercent(successes, falsePresses) : null,
    keyStats,
  }
}

function isAttemptedChar(char: CharState): boolean {
  return char.status !== "pending" || char.hadError === true
}

export function computeWordAccuracyMetrics(
  words: WordState[],
  includeTarget: (key: string) => boolean = isNonSpaceAccuracyKey,
): AccuracySummary {
  let successes = 0
  let falsePresses = 0

  for (const word of words) {
    for (const char of word.chars) {
      const normalized = normalizeAccuracyKey(char.char)
      if (normalized == null) continue
      if (!includeTarget(normalized)) continue
      if (!isAttemptedChar(char)) continue

      if (char.hadError) {
        falsePresses += 1
      } else if (char.status === "correct") {
        successes += 1
      }
    }
  }

  const totalChars = successes + falsePresses
  return {
    accuracy: computeAccuracyPercent(successes, falsePresses),
    correctChars: successes,
    incorrectChars: falsePresses,
    totalChars,
  }
}

export function computeStoredSessionAccuracyMetrics(
  source: { correctChars: number; errorChars: number },
): AccuracySummary {
  const correctChars = Math.max(0, source.correctChars)
  const incorrectChars = Math.max(0, source.errorChars)
  const totalChars = correctChars + incorrectChars

  return {
    accuracy: computeAccuracyPercent(correctChars, incorrectChars),
    correctChars,
    incorrectChars,
    totalChars,
  }
}

export function computeSessionAccuracyMetrics(keystrokes: AccuracyStroke[]): AccuracySummary {
  const analysis = analyzeTargetAccuracy(keystrokes, isNonSpaceAccuracyKey)

  return {
    accuracy: analysis.accuracy ?? 100,
    correctChars: analysis.successes,
    incorrectChars: analysis.falsePresses,
    totalChars: analysis.occurrences,
  }
}
