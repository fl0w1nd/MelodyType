import { db, type BigramStat, type KeyStat, type TypingSession } from "@/lib/db"
import { getAppSetting, setAppSetting, type AdaptivePhase } from "@/lib/settings"
import {
  DEFAULT_RECOVER_KEYS,
  DEFAULT_TARGET_CPM,
  INITIAL_UNLOCK_COUNT,
  LETTER_FREQUENCY_ORDER,
} from "./adaptiveConstants"
import {
  analyzeTargetAccuracy,
  computeAccuracyPercent,
  computeStoredSessionAccuracyMetrics,
  isLetterAccuracyKey,
} from "./accuracyMetrics"
import { computeLearningRate, type LearningRateResult } from "./learningRate.ts"

export {
  DEFAULT_RECOVER_KEYS,
  DEFAULT_TARGET_CPM,
  INITIAL_UNLOCK_COUNT,
  LETTER_FREQUENCY_ORDER,
} from "./adaptiveConstants"

export const MIN_TARGET_CPM = 75
export const MAX_TARGET_CPM = 750
export const EWMA_ALPHA = 0.1
export const MIN_HITS_FOR_MASTERY = 10
export const ACCURACY_DECAY = 0.95
export const MIN_RECENT_ACCURACY_FOR_MASTERY = 0.92
export const MIN_LIFETIME_ACCURACY_FOR_MASTERY = 0.85
export const MIN_LATENCY_MS = 50
export const MAX_LATENCY_MS = 3000
export const MIN_BIGRAM_SAMPLES = 5
export const BIGRAM_ACCURACY_EXPONENT = 1.5

export interface AdaptiveSettings {
  targetCpm: number
  recoverKeys: boolean
}

export interface AdaptiveMetricSummary {
  count: number
  last: number
  delta: number
  avg: number
}

export interface AdaptiveGlobalSummary {
  count: number
  speed: AdaptiveMetricSummary
  accuracy: AdaptiveMetricSummary
  integrity: AdaptiveMetricSummary
  score: AdaptiveMetricSummary
  clicks: AdaptiveMetricSummary & { total: number }
  cps: AdaptiveMetricSummary
}

export const DEFAULT_ADAPTIVE_SETTINGS: AdaptiveSettings = {
  targetCpm: DEFAULT_TARGET_CPM,
  recoverKeys: DEFAULT_RECOVER_KEYS,
}

export const ADAPTIVE_TARGET_PRESETS = [
  { label: "Starter", cpm: 125, description: "early practice" },
  { label: "Balanced", cpm: 175, description: "default" },
  { label: "Fluent", cpm: 250, description: "daily typing" },
  { label: "Fast", cpm: 350, description: "speed push" },
  { label: "Elite", cpm: 500, description: "advanced" },
] as const

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

export interface KeyUnlockChecks {
  speed: boolean
  hits: boolean
  recentAccuracy: boolean
  lifetimeAccuracy: boolean
}

export interface BigramScore {
  bigram: string
  fromKey: string
  toKey: string
  score: number
  speedScore: number
  accuracyScore: number
  successRate: number
  correctAttempts: number
  samples: number
}

export interface AdaptiveState {
  unlockedKeys: string[]
  focusKey: string | null
  keyConfidences: KeyConfidence[]
  totalSessions: number
  globalSummary: AdaptiveGlobalSummary
  settings: AdaptiveSettings
  phase: AdaptivePhase
  weakBigrams: BigramScore[]
}

export function computeMastery(ewmaCpm: number | undefined, targetCpm: number = DEFAULT_TARGET_CPM): number {
  if (!ewmaCpm || ewmaCpm <= 0) return 0
  return ewmaCpm / targetCpm
}

function makeMetricSummary(values: number[]): AdaptiveMetricSummary {
  if (values.length === 0) {
    return { count: 0, last: 0, delta: 0, avg: 0 }
  }

  const last = values[values.length - 1]
  if (values.length === 1) {
    return { count: 1, last, delta: last, avg: last }
  }

  const previousValues = values.slice(0, -1)
  const previousAverage =
    previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
  const average = values.reduce((sum, value) => sum + value, 0) / values.length

  return {
    count: values.length,
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
  const accuracies = sessions.map(
    (session) => computeStoredSessionAccuracyMetrics(session).accuracy,
  )
  const integrities = sessions
    .map((session) => session.melodyIntegrity)
    .filter((value): value is number => typeof value === "number")
  const scores = sessions.map(computeAdaptiveScore)
  const clicks = sessions.map((session) => session.keystrokes.length)
  const cpsValues = sessions.map((session) =>
    session.duration > 0 ? session.keystrokes.length / session.duration : 0,
  )
  const clicksSummary = makeMetricSummary(clicks)
  const cpsSummary = makeMetricSummary(cpsValues)
  const totalDuration = sessions.reduce((sum, session) => sum + Math.max(session.duration, 0), 0)
  const totalClicks = clicks.reduce((sum, value) => sum + value, 0)

  return {
    count: sessions.length,
    speed: makeMetricSummary(speeds),
    accuracy: makeMetricSummary(accuracies),
    integrity: makeMetricSummary(integrities),
    score: makeMetricSummary(scores),
    clicks: {
      ...clicksSummary,
      total: totalClicks,
    },
    cps: {
      ...cpsSummary,
      avg: totalDuration > 0 ? totalClicks / totalDuration : 0,
    },
  }
}

export function shouldUnlockNextKey(confidences: KeyConfidence[], recoverKeys: boolean = false): boolean {
  const unlockedActive = confidences.filter((k) => k.unlocked && !k.forced)
  if (unlockedActive.length === 0) return true

  return unlockedActive.every((k) => isKeyReadyToUnlock(k, recoverKeys))
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

  const gatedConfidenceOf = (k: KeyConfidence) => recoverKeys ? k.confidence : k.bestConfidence
  const blocked = unlocked.filter((k) => !isKeyReadyToUnlock(k, recoverKeys))
  if (blocked.length === 0) return null

  const sorted = [...blocked].sort((a, b) => {
    const aChecks = getKeyUnlockChecks(a, recoverKeys)
    const bChecks = getKeyUnlockChecks(b, recoverKeys)
    const aPassed = Object.values(aChecks).filter(Boolean).length
    const bPassed = Object.values(bChecks).filter(Boolean).length
    if (aPassed !== bPassed) return aPassed - bPassed
    return gatedConfidenceOf(a) - gatedConfidenceOf(b)
  })
  return sorted[0].key
}

export function getKeyUnlockChecks(
  keyConfidence: KeyConfidence,
  recoverKeys: boolean = false,
): KeyUnlockChecks {
  const gatedConfidence = recoverKeys
    ? keyConfidence.confidence
    : keyConfidence.bestConfidence

  return {
    speed: gatedConfidence >= 1.0,
    hits: keyConfidence.samples >= MIN_HITS_FOR_MASTERY,
    recentAccuracy: keyConfidence.accuracy >= MIN_RECENT_ACCURACY_FOR_MASTERY * 100,
    lifetimeAccuracy:
      keyConfidence.lifetimeAccuracy >= MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100,
  }
}

export function isKeyReadyToUnlock(
  keyConfidence: KeyConfidence,
  recoverKeys: boolean = false,
): boolean {
  const checks = getKeyUnlockChecks(keyConfidence, recoverKeys)
  return Object.values(checks).every(Boolean)
}

export function isKeyStrictlyMastered(keyConfidence: KeyConfidence): boolean {
  return (
    keyConfidence.confidence >= 1.0 &&
    keyConfidence.samples >= MIN_HITS_FOR_MASTERY &&
    keyConfidence.accuracy >= MIN_RECENT_ACCURACY_FOR_MASTERY * 100 &&
    keyConfidence.lifetimeAccuracy >= MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100
  )
}

export type AdaptiveKeyTier = "locked" | "weak" | "learning" | "good" | "mastered"

export function getAdaptiveKeyTier(keyConfidence: KeyConfidence): AdaptiveKeyTier {
  if (!keyConfidence.unlocked) return "locked"
  if (isKeyStrictlyMastered(keyConfidence)) return "mastered"
  if (keyConfidence.bestConfidence >= 1.0) return "good"
  if (keyConfidence.confidence >= 0.4) return "learning"
  return "weak"
}

export async function loadAdaptiveSettings(): Promise<AdaptiveSettings> {
  const [targetCpm, recoverKeys] = await Promise.all([
    getAppSetting("adaptiveTargetCpm"),
    getAppSetting("adaptiveRecoverKeys"),
  ])
  return {
    targetCpm,
    recoverKeys,
  }
}

export async function loadForcedKeys(): Promise<string[]> {
  const parsed = await getAppSetting("adaptiveForcedKeys")
  return parsed.filter((key) => LETTER_FREQUENCY_ORDER.includes(key))
}

export async function saveForcedKeys(keys: string[]): Promise<void> {
  const uniqueKeys = [...new Set(keys)].filter((key) => LETTER_FREQUENCY_ORDER.includes(key))
  await setAppSetting("adaptiveForcedKeys", uniqueKeys)
}

export async function forceUnlockKey(key: string): Promise<void> {
  const normalizedKey = key.toLowerCase()
  if (!LETTER_FREQUENCY_ORDER.includes(normalizedKey)) {
    return
  }

  const [autoUnlocked, forcedKeys] = await Promise.all([
    getAppSetting("adaptiveUnlocked"),
    loadForcedKeys(),
  ])

  if (autoUnlocked.includes(normalizedKey) || forcedKeys.includes(normalizedKey)) {
    return
  }

  await saveForcedKeys([...forcedKeys, normalizedKey])
}

interface AdaptiveKeySessionMetrics {
  hits: number
  actualErrors: number
  successPresses: number
  falsePresses: number
  correctLatencies: number[]
}

interface AdaptiveKeyBackfillState {
  adaptiveEwmaCpm?: number
  adaptiveBestCpm?: number
  adaptiveCorrectHits: number
  adaptiveErrorHits: number
  adaptiveDecayedCorrectHits: number
  adaptiveDecayedErrorHits: number
  adaptiveSamples: Array<{
    index: number
    timestamp: number
    cpm: number
    filteredCpm: number
  }>
  adaptiveSampleIndex: number
  lastUpdated: number
}

let adaptiveAccuracyBackfillPromise: Promise<void> | null = null

function collectAdaptiveSessionKeyMetrics(
  keystrokeLog: Array<{ key: string; correct: boolean; timestamp: number }>,
): Record<string, AdaptiveKeySessionMetrics> {
  const keyMetrics: Record<string, AdaptiveKeySessionMetrics> = {}

  const ensure = (key: string) => {
    if (!keyMetrics[key]) {
      keyMetrics[key] = {
        hits: 0,
        actualErrors: 0,
        successPresses: 0,
        falsePresses: 0,
        correctLatencies: [],
      }
    }
    return keyMetrics[key]
  }

  for (let i = 0; i < keystrokeLog.length; i++) {
    const entry = keystrokeLog[i]
    if (entry.key.length !== 1 || entry.key === " ") continue
    const lower = entry.key.toLowerCase()
    const metrics = ensure(lower)

    metrics.hits += 1
    if (!entry.correct) {
      metrics.actualErrors += 1
      continue
    }

    if (i > 0 && keystrokeLog[i - 1].correct) {
      const latency = entry.timestamp - keystrokeLog[i - 1].timestamp
      if (latency >= MIN_LATENCY_MS && latency <= MAX_LATENCY_MS) {
        metrics.correctLatencies.push(latency)
      }
    }
  }

  const targetAnalysis = analyzeTargetAccuracy(keystrokeLog, isLetterAccuracyKey)
  for (const [key, stats] of targetAnalysis.keyStats) {
    const metrics = ensure(key)
    metrics.successPresses = stats.successes
    metrics.falsePresses = stats.falsePresses
  }

  return keyMetrics
}

async function ensureAdaptiveAccuracyStatsBackfilled(): Promise<void> {
  if (adaptiveAccuracyBackfillPromise) {
    await adaptiveAccuracyBackfillPromise
    return
  }

  adaptiveAccuracyBackfillPromise = (async () => {
    const sessions = await db.sessions.where("mode").equals("adaptive").sortBy("timestamp")
    if (sessions.length === 0) return

    const aggregates = new Map<string, AdaptiveKeyBackfillState>()
    const ensureAggregate = (key: string) => {
      const existing = aggregates.get(key)
      if (existing) return existing
      const created: AdaptiveKeyBackfillState = {
        adaptiveCorrectHits: 0,
        adaptiveErrorHits: 0,
        adaptiveDecayedCorrectHits: 0,
        adaptiveDecayedErrorHits: 0,
        adaptiveSamples: [],
        adaptiveSampleIndex: 0,
        lastUpdated: 0,
      }
      aggregates.set(key, created)
      return created
    }

    for (const session of sessions) {
      const keyMetrics = collectAdaptiveSessionKeyMetrics(session.keystrokes)

      for (const [key, metrics] of Object.entries(keyMetrics)) {
        const aggregate = ensureAggregate(key)
        const avgLatency =
          metrics.correctLatencies.length > 0
            ? metrics.correctLatencies.reduce((sum, latency) => sum + latency, 0) /
              metrics.correctLatencies.length
            : 0
        const sessionCpm = avgLatency > 0 ? 60000 / avgLatency : 0
        const prevEwma = aggregate.adaptiveEwmaCpm
        const newEwma = sessionCpm > 0
          ? (prevEwma ? prevEwma * (1 - EWMA_ALPHA) + sessionCpm * EWMA_ALPHA : sessionCpm)
          : prevEwma

        aggregate.adaptiveEwmaCpm = newEwma
        if (newEwma != null && newEwma > 0) {
          aggregate.adaptiveBestCpm = Math.max(aggregate.adaptiveBestCpm ?? 0, newEwma)
        }
        aggregate.adaptiveCorrectHits += metrics.successPresses
        aggregate.adaptiveErrorHits += metrics.falsePresses
        aggregate.adaptiveDecayedCorrectHits =
          aggregate.adaptiveDecayedCorrectHits * ACCURACY_DECAY + metrics.successPresses
        aggregate.adaptiveDecayedErrorHits =
          aggregate.adaptiveDecayedErrorHits * ACCURACY_DECAY + metrics.falsePresses

        if (sessionCpm > 0) {
          aggregate.adaptiveSamples = [
            ...aggregate.adaptiveSamples,
            {
              index: aggregate.adaptiveSampleIndex,
              timestamp: session.timestamp,
              cpm: sessionCpm,
              filteredCpm: newEwma ?? sessionCpm,
            },
          ].slice(-30)
          aggregate.adaptiveSampleIndex += 1
        }

        aggregate.lastUpdated = Math.max(aggregate.lastUpdated, session.timestamp)
      }
    }

    if (aggregates.size === 0) return

    await db.transaction("rw", db.keyStats, async () => {
      const existingStats = await db.keyStats.toArray()
      const existingMap = new Map(existingStats.map((stat) => [stat.key, stat]))

      for (const [key, aggregate] of aggregates) {
        const existing = existingMap.get(key)
        const adaptiveFields = {
          adaptiveEwmaCpm: aggregate.adaptiveEwmaCpm,
          adaptiveBestCpm: aggregate.adaptiveBestCpm,
          adaptiveCorrectHits: aggregate.adaptiveCorrectHits,
          adaptiveErrorHits: aggregate.adaptiveErrorHits,
          adaptiveDecayedCorrectHits: aggregate.adaptiveDecayedCorrectHits,
          adaptiveDecayedErrorHits: aggregate.adaptiveDecayedErrorHits,
          adaptiveSamples: aggregate.adaptiveSamples,
          adaptiveSampleIndex: aggregate.adaptiveSampleIndex,
        }

        if (existing) {
          await db.keyStats.update(existing.id!, {
            ...adaptiveFields,
            lastUpdated: Math.max(existing.lastUpdated, aggregate.lastUpdated),
          })
        } else {
          await db.keyStats.add({
            key,
            totalHits: 0,
            errors: 0,
            totalLatency: 0,
            avgSpeed: 0,
            lastUpdated: aggregate.lastUpdated || Date.now(),
            ...adaptiveFields,
          })
        }
      }
    })
  })()

  await adaptiveAccuracyBackfillPromise
}

export async function loadAdaptiveState(): Promise<AdaptiveState> {
  await ensureAdaptiveAccuracyStatsBackfilled()

  const [keyStats, sessions, unlockedKeys, forcedKeys, adaptSettings, phase] = await Promise.all([
    db.keyStats.toArray(),
    db.sessions.where("mode").equals("adaptive").sortBy("timestamp"),
    getAppSetting("adaptiveUnlocked"),
    loadForcedKeys(),
    loadAdaptiveSettings(),
    getAppSetting("adaptivePhase"),
  ])

  const statsMap = new Map<string, KeyStat>()
  for (const stat of keyStats) {
    statsMap.set(stat.key, stat)
  }

  const unlockedSet = new Set(unlockedKeys)
  const forcedSet = new Set(
    forcedKeys.filter((key) => LETTER_FREQUENCY_ORDER.includes(key) && !unlockedSet.has(key)),
  )

  const keyConfidences: KeyConfidence[] = LETTER_FREQUENCY_ORDER.map((letter) => {
    const stat = statsMap.get(letter)
    const isUnlocked = unlockedSet.has(letter)
    const isForced = !isUnlocked && forcedSet.has(letter)

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
      0,
    )
    const lifetimeAccuracy = computeAccuracyPercent(correctHits, errorHits, 0)
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
      samples: correctHits + errorHits,
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

  const weakBigrams = phase === "reinforcement"
    ? await loadWeakBigrams(adaptSettings.targetCpm)
    : []

  return {
    unlockedKeys: keyConfidences.filter((k) => k.unlocked).map((k) => k.key),
    focusKey,
    keyConfidences,
    totalSessions: sessions.length,
    globalSummary: computeAdaptiveGlobalSummary(sessions),
    settings: adaptSettings,
    phase,
    weakBigrams,
  }
}

export async function recomputeAndUnlock(): Promise<AdaptiveState> {
  const state = await loadAdaptiveState()
  const { recoverKeys } = state.settings

  if (state.phase === "progressive") {
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
      } else {
        const allMastered = LETTER_FREQUENCY_ORDER.every((key) => {
          const kc = state.keyConfidences.find((k) => k.key === key)
          return kc && isKeyStrictlyMastered(kc)
        })
        if (allMastered) {
          await setAppSetting("adaptivePhase", "reinforcement")
          state.phase = "reinforcement"
          state.weakBigrams = await loadWeakBigrams(state.settings.targetCpm)
        }
      }
    }
  } else {
    state.weakBigrams = await loadWeakBigrams(state.settings.targetCpm)
  }

  return state
}

export async function saveUnlockedKeys(keys: string[]): Promise<void> {
  await setAppSetting("adaptiveUnlocked", keys)
}

export async function updateKeyStatsFromSession(
  keystrokeLog: Array<{ key: string; correct: boolean; timestamp: number }>,
): Promise<void> {
  const keyMetrics = collectAdaptiveSessionKeyMetrics(keystrokeLog)

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
        const totalErrors = existing.errors + metrics.actualErrors

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
          metrics.successPresses
        const newDecayedErrorHits =
          (existing.adaptiveDecayedErrorHits ?? existing.adaptiveErrorHits ?? 0) *
          ACCURACY_DECAY +
          metrics.falsePresses

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
          adaptiveCorrectHits: (existing.adaptiveCorrectHits ?? 0) + metrics.successPresses,
          adaptiveErrorHits: (existing.adaptiveErrorHits ?? 0) + metrics.falsePresses,
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
          errors: metrics.actualErrors,
          totalLatency: avgLatency * metrics.hits,
          avgSpeed: sessionWpm,
          lastUpdated: Date.now(),
          adaptiveEwmaCpm: sessionCpm > 0 ? sessionCpm : undefined,
          adaptiveBestCpm: sessionCpm > 0 ? sessionCpm : undefined,
          adaptiveCorrectHits: metrics.successPresses,
          adaptiveErrorHits: metrics.falsePresses,
          adaptiveDecayedCorrectHits: metrics.successPresses,
          adaptiveDecayedErrorHits: metrics.falsePresses,
          adaptiveSamples: newSample ? [newSample] : [],
          adaptiveSampleIndex: 1,
        })
      }
    }
  })
}

export function getAdaptiveKeyToneClass(keyConfidence: KeyConfidence): string {
  switch (getAdaptiveKeyTier(keyConfidence)) {
    case "mastered":
      return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
    case "good":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40"
    case "learning":
      return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
    case "weak":
      return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40"
    case "locked":
    default:
      return "bg-muted/30 text-muted-foreground/40 border-border/30"
  }
}

export function getAdaptiveKeyBarClass(keyConfidence: KeyConfidence): string {
  switch (getAdaptiveKeyTier(keyConfidence)) {
    case "mastered":
      return "bg-emerald-500"
    case "good":
      return "bg-blue-500"
    case "learning":
      return "bg-amber-500"
    case "weak":
    case "locked":
    default:
      return "bg-red-500"
  }
}

export function getAdaptiveKeyColorClass(kc: KeyConfidence): string {
  if (!kc.unlocked) return "bg-muted/20 border-border/30 text-muted-foreground/30"
  switch (getAdaptiveKeyTier(kc)) {
    case "mastered":
      return "bg-emerald-500/25 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
    case "good":
      return "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400"
    case "learning":
      return "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-400"
    case "weak":
    default:
      return "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400"
  }
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

// ── Bigram / Transition tracking ────────────────────────

interface BigramMetricEntry {
  successes: number
  failures: number
  latencies: number[]
}

/**
 * Extract bigram transition metrics from a completed session.
 *
 * Attribution rules:
 * - An "anchor" is the last correctly typed character.
 * - On correct input: record a successful transition from anchor -> current,
 *   then move anchor to current.
 * - On first incorrect input after anchor: record a single failure for
 *   anchor -> expected. Subsequent errors for the same pending position are
 *   ignored until that position is typed correctly.
 * - Spaces break the transition chain (anchor resets to null).
 */
export function extractBigramMetrics(
  keystrokeLog: Array<{ key: string; correct: boolean; timestamp: number; wordIndex: number; charIndex: number }>,
  expectedText: string,
): Record<string, BigramMetricEntry> {
  const metrics: Record<string, BigramMetricEntry> = {}
  const expectedWords = expectedText.split(" ")
  let anchor: { key: string; timestamp: number } | null = null
  let failedPositionKey: string | null = null

  const ensure = (bigram: string) => {
    if (!metrics[bigram]) {
      metrics[bigram] = { successes: 0, failures: 0, latencies: [] }
    }
  }

  for (const entry of keystrokeLog) {
    if (entry.key === " ") {
      if (entry.correct) {
        anchor = null
        failedPositionKey = null
      }
      continue
    }

    const entryLower = entry.key.length === 1 ? entry.key.toLowerCase() : null
    if (!entryLower) continue
    const expectedChar = expectedWords[entry.wordIndex]?.[entry.charIndex]
    if (!expectedChar) continue
    const expectedLower = expectedChar.toLowerCase()
    const positionKey = `${entry.wordIndex}:${entry.charIndex}`

    if (entry.correct) {
      if (anchor) {
        const bigram = `${anchor.key}:${entryLower}`
        ensure(bigram)
        metrics[bigram].successes++
        const latency = entry.timestamp - anchor.timestamp
        if (latency >= MIN_LATENCY_MS && latency <= MAX_LATENCY_MS) {
          metrics[bigram].latencies.push(latency)
        }
      }
      anchor = { key: entryLower, timestamp: entry.timestamp }
      failedPositionKey = null
    } else {
      if (anchor && failedPositionKey !== positionKey) {
        const bigram = `${anchor.key}:${expectedLower}`
        ensure(bigram)
        metrics[bigram].failures++
        failedPositionKey = positionKey
      }
    }
  }
  return metrics
}

export async function updateBigramStatsFromSession(
  keystrokeLog: Array<{ key: string; correct: boolean; timestamp: number; wordIndex: number; charIndex: number }>,
  expectedText: string,
): Promise<void> {
  const sessionMetrics = extractBigramMetrics(keystrokeLog, expectedText)

  await db.transaction("rw", db.bigramStats, async () => {
    for (const [bigramKey, m] of Object.entries(sessionMetrics)) {
      const [fromKey, toKey] = bigramKey.split(":")
      if (!fromKey || !toKey) continue

      const avgLatency = m.latencies.length > 0
        ? m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length
        : 0

      const existing = await db.bigramStats.where("bigram").equals(bigramKey).first()
      if (existing) {
        const newDecayedCorrect = existing.decayedCorrect * ACCURACY_DECAY + m.successes
        const newDecayedErrors = existing.decayedErrors * ACCURACY_DECAY + m.failures

        const newEwmaLatency = avgLatency > 0
          ? (existing.ewmaLatency > 0
            ? existing.ewmaLatency * (1 - EWMA_ALPHA) + avgLatency * EWMA_ALPHA
            : avgLatency)
          : existing.ewmaLatency

        const newBestLatency = avgLatency > 0
          ? (existing.bestLatency > 0
            ? Math.min(existing.bestLatency, avgLatency)
            : avgLatency)
          : existing.bestLatency

        await db.bigramStats.update(existing.id!, {
          totalAttempts: existing.totalAttempts + m.successes + m.failures,
          correctAttempts: existing.correctAttempts + m.successes,
          ewmaLatency: newEwmaLatency,
          bestLatency: newBestLatency,
          decayedCorrect: newDecayedCorrect,
          decayedErrors: newDecayedErrors,
          lastUpdated: Date.now(),
        })
      } else {
        await db.bigramStats.add({
          fromKey,
          toKey,
          bigram: bigramKey,
          totalAttempts: m.successes + m.failures,
          correctAttempts: m.successes,
          ewmaLatency: avgLatency,
          bestLatency: avgLatency,
          decayedCorrect: m.successes,
          decayedErrors: m.failures,
          lastUpdated: Date.now(),
        })
      }
    }
  })
}

export function computeTransitionScore(
  stat: BigramStat,
  targetCpm: number = DEFAULT_TARGET_CPM,
): BigramScore {
  const targetLatency = 60000 / targetCpm
  const speedScore = stat.ewmaLatency > 0
    ? Math.min(1, targetLatency / stat.ewmaLatency)
    : 0
  const total = stat.decayedCorrect + stat.decayedErrors
  const accuracyScore = total > 0 ? stat.decayedCorrect / total : 0
  const score = speedScore * Math.pow(accuracyScore, BIGRAM_ACCURACY_EXPONENT)
  const successRate = stat.totalAttempts > 0
    ? stat.correctAttempts / stat.totalAttempts
    : 0

  return {
    bigram: stat.bigram,
    fromKey: stat.fromKey,
    toKey: stat.toKey,
    score,
    speedScore,
    accuracyScore,
    successRate,
    correctAttempts: stat.correctAttempts,
    samples: stat.totalAttempts,
  }
}

export function isBigramMastered(
  stat: BigramStat,
  targetCpm: number = DEFAULT_TARGET_CPM,
): boolean {
  const targetLatency = 60000 / targetCpm
  const speedScore = stat.ewmaLatency > 0
    ? Math.min(1, targetLatency / stat.ewmaLatency)
    : 0
  const total = stat.decayedCorrect + stat.decayedErrors
  const accuracyScore = total > 0 ? stat.decayedCorrect / total : 0
  return (
    speedScore >= 1.0 &&
    accuracyScore >= 0.90 &&
    stat.totalAttempts >= MIN_BIGRAM_SAMPLES
  )
}

export async function loadWeakBigrams(
  targetCpm: number = DEFAULT_TARGET_CPM,
  limit: number = 20,
): Promise<BigramScore[]> {
  const allStats = await db.bigramStats.toArray()
  const scored = allStats
    .filter((s) => s.totalAttempts >= MIN_BIGRAM_SAMPLES)
    .map((s) => computeTransitionScore(s, targetCpm))
    .sort((a, b) => a.score - b.score)
  return scored.slice(0, limit)
}

export async function loadAllBigramScores(
  targetCpm: number = DEFAULT_TARGET_CPM,
): Promise<BigramScore[]> {
  const allStats = await db.bigramStats.toArray()
  return allStats.map((s) => computeTransitionScore(s, targetCpm))
}

/**
 * One-time backfill: compute approximate bigram stats from historical sessions.
 * Since historical sessions don't store expectedText, we can only track
 * transitions between consecutive correct keystrokes (no failure attribution).
 */
export async function backfillBigramStatsFromHistory(): Promise<number> {
  const existingCount = await db.bigramStats.count()
  if (existingCount > 0) return 0

  const sessions = await db.sessions
    .where("mode")
    .equals("adaptive")
    .toArray()

  if (sessions.length === 0) return 0

  const aggregated: Record<string, {
    successes: number
    latencies: number[]
  }> = {}

  for (const session of sessions) {
    let prevCorrect: { key: string; timestamp: number } | null = null
    for (const stroke of session.keystrokes) {
      if (stroke.key.length !== 1 || stroke.key === " ") {
        if (stroke.correct) prevCorrect = null
        continue
      }
      const lower = stroke.key.toLowerCase()
      if (!stroke.correct) {
        prevCorrect = null
        continue
      }
      if (prevCorrect) {
        const bigramKey = `${prevCorrect.key}:${lower}`
        if (!aggregated[bigramKey]) {
          aggregated[bigramKey] = { successes: 0, latencies: [] }
        }
        aggregated[bigramKey].successes++
        const latency = stroke.timestamp - prevCorrect.timestamp
        if (latency >= MIN_LATENCY_MS && latency <= MAX_LATENCY_MS) {
          aggregated[bigramKey].latencies.push(latency)
        }
      }
      prevCorrect = { key: lower, timestamp: stroke.timestamp }
    }
  }

  const entries = Object.entries(aggregated)
  if (entries.length === 0) return 0

  await db.transaction("rw", db.bigramStats, async () => {
    for (const [bigramKey, m] of entries) {
      const [fromKey, toKey] = bigramKey.split(":")
      if (!fromKey || !toKey) continue
      const avgLatency = m.latencies.length > 0
        ? m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length
        : 0
      await db.bigramStats.add({
        fromKey,
        toKey,
        bigram: bigramKey,
        totalAttempts: m.successes,
        correctAttempts: m.successes,
        ewmaLatency: avgLatency,
        bestLatency: avgLatency,
        decayedCorrect: m.successes,
        decayedErrors: 0,
        lastUpdated: Date.now(),
      })
    }
  })

  return entries.length
}
