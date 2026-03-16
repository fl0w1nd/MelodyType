import { db, getSetting, setSetting, type KeyStat, type TypingSession } from "@/lib/db"
import { computeLearningRate, type LearningRateResult } from "./learningRate.ts"

export const LETTER_FREQUENCY_ORDER = [
  "e", "n", "i", "t", "r", "l", "s", "a", "u",
  "o", "d", "y", "c", "h", "g", "m", "p", "b",
  "k", "v", "w", "f", "z", "x", "q", "j",
]

export const INITIAL_UNLOCK_COUNT = 6
export const DEFAULT_TARGET_CPM = 175
export const MIN_TARGET_CPM = 75
export const MAX_TARGET_CPM = 750
export const EWMA_ALPHA = 0.1
export const MIN_HITS_FOR_MASTERY = 10
export const ACCURACY_DECAY = 0.95
export const MIN_RECENT_ACCURACY_FOR_MASTERY = 0.92
export const MIN_LIFETIME_ACCURACY_FOR_MASTERY = 0.85
export const MIN_LATENCY_MS = 50
export const MAX_LATENCY_MS = 3000

export interface AdaptiveSettings {
  targetCpm: number
  recoverKeys: boolean
  alphabetSize: number
}

export interface AdaptiveMetricSummary {
  last: number
  delta: number
  avg: number
}

export interface AdaptiveGlobalSummary {
  count: number
  speed: AdaptiveMetricSummary
  accuracy: AdaptiveMetricSummary
  score: AdaptiveMetricSummary
}

export const DEFAULT_ADAPTIVE_SETTINGS: AdaptiveSettings = {
  targetCpm: DEFAULT_TARGET_CPM,
  recoverKeys: false,
  alphabetSize: 0,
}

export interface KeyConfidence {
  key: string
  confidence: number
  bestConfidence: number
  speed: number
  accuracy: number
  lifetimeAccuracy: number
  samples: number
  unlocked: boolean
  focused: boolean
  forced: boolean
  learningRate: LearningRateResult | null
}

export interface AdaptiveState {
  unlockedKeys: string[]
  focusKey: string | null
  keyConfidences: KeyConfidence[]
  totalSessions: number
  globalSummary: AdaptiveGlobalSummary
  settings: AdaptiveSettings
}

export function computeMastery(ewmaCpm: number | undefined, targetCpm: number = DEFAULT_TARGET_CPM): number {
  if (!ewmaCpm || ewmaCpm <= 0) return 0
  return ewmaCpm / targetCpm
}

function computeAccuracyPercent(correctHits: number, errorHits: number): number {
  const totalHits = correctHits + errorHits
  return totalHits > 0 ? (correctHits / totalHits) * 100 : 100
}

function makeMetricSummary(values: number[]): AdaptiveMetricSummary {
  if (values.length === 0) {
    return { last: 0, delta: 0, avg: 0 }
  }

  const last = values[values.length - 1]
  if (values.length === 1) {
    return { last, delta: last, avg: last }
  }

  const previousValues = values.slice(0, -1)
  const previousAverage =
    previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
  const average = values.reduce((sum, value) => sum + value, 0) / values.length

  return {
    last,
    delta: last - previousAverage,
    avg: average,
  }
}

function parseAdaptiveSessionMeta(session: TypingSession): {
  unlockedKeyCount?: number
} | null {
  try {
    const parsed = JSON.parse(session.modeConfig) as {
      adaptiveMeta?: { unlockedKeyCount?: number }
    }
    return parsed?.adaptiveMeta ?? null
  } catch {
    return null
  }
}

function getAdaptiveAlphabetComplexity(session: TypingSession): number {
  const stored = parseAdaptiveSessionMeta(session)?.unlockedKeyCount
  if (Number.isFinite(stored) && stored != null) {
    return Math.min(
      LETTER_FREQUENCY_ORDER.length,
      Math.max(INITIAL_UNLOCK_COUNT, Math.round(stored)),
    )
  }

  const distinctKeys = new Set(
    session.keystrokes
      .map((entry) => entry.key.toLowerCase())
      .filter((key) => key.length === 1 && key >= "a" && key <= "z"),
  ).size

  return Math.min(
    LETTER_FREQUENCY_ORDER.length,
    Math.max(INITIAL_UNLOCK_COUNT, distinctKeys),
  )
}

function computeAdaptiveScore(session: TypingSession): number {
  const cpm = session.wpm * 5
  const alphabetComplexity = getAdaptiveAlphabetComplexity(session)
  const errors = session.errorChars
  const length = session.totalChars

  if (cpm <= 0 || alphabetComplexity <= 0 || length <= 0) {
    return 0
  }

  return ((cpm * alphabetComplexity) / (errors + 1)) * (length / 50)
}

function computeAdaptiveGlobalSummary(
  sessions: TypingSession[],
): AdaptiveGlobalSummary {
  const speeds = sessions.map((session) => session.wpm)
  const accuracies = sessions.map((session) => session.accuracy)
  const scores = sessions.map(computeAdaptiveScore)

  return {
    count: sessions.length,
    speed: makeMetricSummary(speeds),
    accuracy: makeMetricSummary(accuracies),
    score: makeMetricSummary(scores),
  }
}

export function shouldUnlockNextKey(confidences: KeyConfidence[], recoverKeys: boolean = false): boolean {
  const unlockedActive = confidences.filter((k) => k.unlocked && !k.forced)
  if (unlockedActive.length === 0) return true

  return unlockedActive.every((k) => {
    const conf = recoverKeys ? k.confidence : k.bestConfidence
    return (
      conf >= 1.0 &&
      k.samples >= MIN_HITS_FOR_MASTERY &&
      k.accuracy >= MIN_RECENT_ACCURACY_FOR_MASTERY * 100 &&
      k.lifetimeAccuracy >= MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100
    )
  })
}

export function getNextKeyToUnlock(
  unlockedKeys: string[],
): string | null {
  const unlockedSet = new Set(unlockedKeys)
  for (const letter of LETTER_FREQUENCY_ORDER) {
    if (!unlockedSet.has(letter)) {
      return letter
    }
  }
  return null
}

export function getFocusKey(confidences: KeyConfidence[], recoverKeys: boolean = false): string | null {
  const unlocked = confidences.filter((k) => k.unlocked)
  if (unlocked.length === 0) return null

  const confidenceOf = (k: KeyConfidence) => recoverKeys ? k.confidence : k.bestConfidence
  const belowTarget = unlocked.filter((k) => confidenceOf(k) < 1.0)
  if (belowTarget.length === 0) return null

  const sorted = [...belowTarget].sort((a, b) => confidenceOf(a) - confidenceOf(b))
  return sorted[0].key
}

export async function loadAdaptiveSettings(): Promise<AdaptiveSettings> {
  const [targetCpmStr, recoverKeysStr, alphabetSizeStr] = await Promise.all([
    getSetting("adaptive_targetCpm"),
    getSetting("adaptive_recoverKeys"),
    getSetting("adaptive_alphabetSize"),
  ])
  return {
    targetCpm: targetCpmStr ? Number(targetCpmStr) : DEFAULT_TARGET_CPM,
    recoverKeys: recoverKeysStr === "true",
    alphabetSize: alphabetSizeStr ? Number(alphabetSizeStr) : 0,
  }
}

export async function loadAdaptiveState(): Promise<AdaptiveState> {
  const [keyStats, sessions, savedUnlocked, adaptSettings] = await Promise.all([
    db.keyStats.toArray(),
    db.sessions.where("mode").equals("adaptive").sortBy("timestamp"),
    db.settings.where("key").equals("adaptive_unlocked").first(),
    loadAdaptiveSettings(),
  ])

  const statsMap = new Map<string, KeyStat>()
  for (const stat of keyStats) {
    statsMap.set(stat.key, stat)
  }

  let unlockedKeys: string[]
  if (savedUnlocked) {
    unlockedKeys = JSON.parse(savedUnlocked.value)
  } else {
    unlockedKeys = LETTER_FREQUENCY_ORDER.slice(0, INITIAL_UNLOCK_COUNT)
  }

  const unlockedSet = new Set(unlockedKeys)
  const minSize = INITIAL_UNLOCK_COUNT
  const maxSize = minSize + Math.round((LETTER_FREQUENCY_ORDER.length - minSize) * adaptSettings.alphabetSize)

  const keyConfidences: KeyConfidence[] = LETTER_FREQUENCY_ORDER.map((letter, index) => {
    const stat = statsMap.get(letter)
    const isUnlocked = unlockedSet.has(letter)
    const isForced = !isUnlocked && index < maxSize

    const ewmaCpm = stat?.adaptiveEwmaCpm
    const bestCpm = stat?.adaptiveBestCpm
    const correctHits = stat?.adaptiveCorrectHits ?? 0
    const errorHits = stat?.adaptiveErrorHits ?? 0
    const decayedCorrectHits = stat?.adaptiveDecayedCorrectHits ?? correctHits
    const decayedErrorHits = stat?.adaptiveDecayedErrorHits ?? errorHits
    const confidence = computeMastery(ewmaCpm, adaptSettings.targetCpm)
    const bestConfidence = computeMastery(bestCpm, adaptSettings.targetCpm)

    const accuracy = computeAccuracyPercent(
      decayedCorrectHits,
      decayedErrorHits,
    )
    const lifetimeAccuracy = computeAccuracyPercent(correctHits, errorHits)
    const speed = ewmaCpm ? (ewmaCpm / 5) : 0

    const keySamples = stat?.adaptiveSamples ?? []
    const lr = keySamples.length >= 5
      ? computeLearningRate(keySamples, adaptSettings.targetCpm)
      : null

    return {
      key: letter,
      confidence,
      bestConfidence,
      speed,
      accuracy,
      lifetimeAccuracy,
      samples: correctHits,
      unlocked: isUnlocked || isForced,
      focused: false,
      forced: isForced,
      learningRate: lr,
    }
  })

  const focusKey = getFocusKey(keyConfidences, adaptSettings.recoverKeys)
  for (const kc of keyConfidences) {
    kc.focused = kc.key === focusKey
  }

  return {
    unlockedKeys: keyConfidences.filter((k) => k.unlocked).map((k) => k.key),
    focusKey,
    keyConfidences,
    totalSessions: sessions.length,
    globalSummary: computeAdaptiveGlobalSummary(sessions),
    settings: adaptSettings,
  }
}

export async function recomputeAndUnlock(): Promise<AdaptiveState> {
  const state = await loadAdaptiveState()
  const { recoverKeys } = state.settings

  const unlockedConfidences = state.keyConfidences.filter((k) => k.unlocked && !k.forced)
  if (shouldUnlockNextKey(unlockedConfidences, recoverKeys)) {
    const autoUnlockedKeys = state.keyConfidences.filter((k) => k.unlocked && !k.forced).map((k) => k.key)
    const nextKey = getNextKeyToUnlock(autoUnlockedKeys)
    if (nextKey) {
      const kc = state.keyConfidences.find((k) => k.key === nextKey)
      if (kc) {
        kc.unlocked = true
        kc.forced = false
      }

      const savedKeys = state.keyConfidences.filter((k) => k.unlocked && !k.forced).map((k) => k.key)
      await saveUnlockedKeys(savedKeys)

      state.unlockedKeys = state.keyConfidences.filter((k) => k.unlocked).map((k) => k.key)
      const newFocus = getFocusKey(state.keyConfidences, recoverKeys)
      for (const kc of state.keyConfidences) {
        kc.focused = kc.key === newFocus
      }
      state.focusKey = newFocus
    }
  }

  return state
}

export async function saveUnlockedKeys(keys: string[]): Promise<void> {
  await setSetting("adaptive_unlocked", JSON.stringify(keys))
}

export async function updateKeyStatsFromSession(
  keystrokeLog: Array<{ key: string; correct: boolean; timestamp: number }>,
): Promise<void> {
  const keyMetrics: Record<string, {
    hits: number
    correctHits: number
    errors: number
    correctLatencies: number[]
  }> = {}

  for (let i = 0; i < keystrokeLog.length; i++) {
    const entry = keystrokeLog[i]
    if (entry.key.length !== 1 || entry.key === " ") continue
    const lower = entry.key.toLowerCase()

    if (!keyMetrics[lower]) {
      keyMetrics[lower] = { hits: 0, correctHits: 0, errors: 0, correctLatencies: [] }
    }

    keyMetrics[lower].hits++
    if (!entry.correct) {
      keyMetrics[lower].errors++
    } else {
      keyMetrics[lower].correctHits++
      if (i > 0 && keystrokeLog[i - 1].correct) {
        const latency = entry.timestamp - keystrokeLog[i - 1].timestamp
        if (latency >= MIN_LATENCY_MS && latency <= MAX_LATENCY_MS) {
          keyMetrics[lower].correctLatencies.push(latency)
        }
      }
    }
  }

  await db.transaction("rw", db.keyStats, async () => {
    for (const [key, metrics] of Object.entries(keyMetrics)) {
      const avgLatency = metrics.correctLatencies.length > 0
        ? metrics.correctLatencies.reduce((a, b) => a + b, 0) / metrics.correctLatencies.length
        : 0

      const sessionCpm = avgLatency > 0 ? (60000 / avgLatency) : 0
      const sessionWpm = sessionCpm / 5

      const existing = await db.keyStats.where("key").equals(key).first()
      if (existing) {
        const totalHits = existing.totalHits + metrics.hits
        const totalErrors = existing.errors + metrics.errors

        const blendFactor = Math.min(metrics.hits / (metrics.hits + existing.totalHits), 0.4)
        const blendedSpeed = existing.avgSpeed * (1 - blendFactor) + sessionWpm * blendFactor

        const prevEwma = existing.adaptiveEwmaCpm
        const newEwma = sessionCpm > 0
          ? (prevEwma ? prevEwma * (1 - EWMA_ALPHA) + sessionCpm * EWMA_ALPHA : sessionCpm)
          : prevEwma
        const prevBest = existing.adaptiveBestCpm ?? 0
        const newBest = newEwma ? Math.max(prevBest, newEwma) : prevBest
        const newDecayedCorrectHits =
          (existing.adaptiveDecayedCorrectHits ?? existing.adaptiveCorrectHits ?? 0) *
          ACCURACY_DECAY +
          metrics.correctHits
        const newDecayedErrorHits =
          (existing.adaptiveDecayedErrorHits ?? existing.adaptiveErrorHits ?? 0) *
          ACCURACY_DECAY +
          metrics.errors

        const prevSamples = existing.adaptiveSamples ?? []
        const prevIndex = existing.adaptiveSampleIndex ?? prevSamples.length
        const newSample = sessionCpm > 0 ? {
          index: prevIndex,
          timestamp: Date.now(),
          cpm: sessionCpm,
          filteredCpm: newEwma ?? sessionCpm,
        } : null
        const updatedSamples = newSample
          ? [...prevSamples, newSample].slice(-30)
          : prevSamples

        await db.keyStats.update(existing.id!, {
          totalHits,
          errors: totalErrors,
          totalLatency: existing.totalLatency + (avgLatency * metrics.hits),
          avgSpeed: blendedSpeed > 0 ? blendedSpeed : existing.avgSpeed,
          lastUpdated: Date.now(),
          adaptiveEwmaCpm: newEwma ?? existing.adaptiveEwmaCpm,
          adaptiveBestCpm: newBest || existing.adaptiveBestCpm,
          adaptiveCorrectHits: (existing.adaptiveCorrectHits ?? 0) + metrics.correctHits,
          adaptiveErrorHits: (existing.adaptiveErrorHits ?? 0) + metrics.errors,
          adaptiveDecayedCorrectHits: newDecayedCorrectHits,
          adaptiveDecayedErrorHits: newDecayedErrorHits,
          adaptiveSamples: updatedSamples,
          adaptiveSampleIndex: prevIndex + 1,
        })
      } else {
        const newSample = sessionCpm > 0 ? {
          index: 0,
          timestamp: Date.now(),
          cpm: sessionCpm,
          filteredCpm: sessionCpm,
        } : null

        await db.keyStats.add({
          key,
          totalHits: metrics.hits,
          errors: metrics.errors,
          totalLatency: avgLatency * metrics.hits,
          avgSpeed: sessionWpm,
          lastUpdated: Date.now(),
          adaptiveEwmaCpm: sessionCpm > 0 ? sessionCpm : undefined,
          adaptiveBestCpm: sessionCpm > 0 ? sessionCpm : undefined,
          adaptiveCorrectHits: metrics.correctHits,
          adaptiveErrorHits: metrics.errors,
          adaptiveDecayedCorrectHits: metrics.correctHits,
          adaptiveDecayedErrorHits: metrics.errors,
          adaptiveSamples: newSample ? [newSample] : [],
          adaptiveSampleIndex: 1,
        })
      }
    }
  })
}

export function getConfidenceColorClass(confidence: number, unlocked: boolean): string {
  if (!unlocked) return "bg-muted/30 text-muted-foreground/40 border-border/30"
  if (confidence >= 1.0)
    return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
  if (confidence >= 0.7)
    return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40"
  if (confidence >= 0.4)
    return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
  return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40"
}

export function getConfidenceBarColorClass(confidence: number): string {
  if (confidence >= 1.0) return "bg-emerald-500"
  if (confidence >= 0.7) return "bg-blue-500"
  if (confidence >= 0.4) return "bg-amber-500"
  return "bg-red-500"
}

export function getAdaptiveKeyColorClass(kc: KeyConfidence): string {
  if (!kc.unlocked) return "bg-muted/20 border-border/30 text-muted-foreground/30"
  if (kc.confidence >= 1.0)
    return "bg-emerald-500/25 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
  if (kc.confidence >= 0.7)
    return "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400"
  if (kc.confidence >= 0.4)
    return "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-400"
  return "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400"
}

export function computeKeyWeights(
  confidences: KeyConfidence[],
  unlockedKeys: string[],
  focusKey: string | null,
): Map<string, number> {
  const weights = new Map<string, number>()
  const unlockedSet = new Set(unlockedKeys)

  for (const kc of confidences) {
    if (!unlockedSet.has(kc.key)) continue

    let weight = 1.0

    if (kc.confidence < 0.4) {
      weight = 4.0
    } else if (kc.confidence < 0.7) {
      weight = 2.5
    } else if (kc.confidence < 1.0) {
      weight = 1.5
    }

    if (kc.key === focusKey) {
      weight *= 2.0
    }

    // Keep newly introduced keys in heavy rotation until they have enough
    // samples for their confidence and accuracy signals to stabilize.
    if (kc.samples < MIN_HITS_FOR_MASTERY) {
      weight = Math.max(weight, 3.0)
    }

    weights.set(kc.key, weight)
  }

  return weights
}
