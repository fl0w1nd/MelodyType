import { db, setSetting, type KeyStat } from "@/lib/db"

export const LETTER_FREQUENCY_ORDER = [
  "e", "t", "a", "o", "i", "n", "s", "h", "r",
  "d", "l", "c", "u", "m", "w", "f", "g", "y",
  "p", "b", "v", "k", "j", "x", "q", "z",
]

export const INITIAL_UNLOCK_COUNT = 6

export const CONFIDENCE_UNLOCK_THRESHOLD = 0.9
export const TARGET_WPM = 35
export const MIN_SAMPLES_FOR_CONFIDENCE = 5
export const MAX_SAMPLES = 20

export interface KeyConfidence {
  key: string
  confidence: number
  speed: number
  accuracy: number
  samples: number
  unlocked: boolean
  focused: boolean
}

export interface AdaptiveState {
  unlockedKeys: string[]
  focusKey: string | null
  keyConfidences: KeyConfidence[]
  totalSessions: number
}

export function computeKeyConfidence(
  speed: number,
  accuracy: number,
  samples: number,
): number {
  if (samples < MIN_SAMPLES_FOR_CONFIDENCE) {
    return (samples / MIN_SAMPLES_FOR_CONFIDENCE) * 0.3
  }

  const speedScore = Math.min(speed / TARGET_WPM, 1)
  const accuracyScore = accuracy / 100
  const sampleWeight = Math.min(samples / MAX_SAMPLES, 1)

  return speedScore * 0.5 + accuracyScore * 0.4 + sampleWeight * 0.1
}

export function shouldUnlockNextKey(confidences: KeyConfidence[]): boolean {
  const unlockedActive = confidences.filter((k) => k.unlocked)
  if (unlockedActive.length === 0) return true

  return unlockedActive.every((k) => k.confidence >= CONFIDENCE_UNLOCK_THRESHOLD)
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

export function getFocusKey(confidences: KeyConfidence[]): string | null {
  const unlocked = confidences.filter((k) => k.unlocked && k.samples > 0)
  if (unlocked.length === 0) return null

  const sorted = [...unlocked].sort((a, b) => a.confidence - b.confidence)
  return sorted[0].key
}

export async function loadAdaptiveState(): Promise<AdaptiveState> {
  const keyStats = await db.keyStats.toArray()
  const sessions = await db.sessions.where("mode").equals("adaptive").count()

  const statsMap = new Map<string, KeyStat>()
  for (const stat of keyStats) {
    statsMap.set(stat.key, stat)
  }

  const savedUnlocked = await db.settings.where("key").equals("adaptive_unlocked").first()
  let unlockedKeys: string[]

  if (savedUnlocked) {
    unlockedKeys = JSON.parse(savedUnlocked.value)
  } else {
    unlockedKeys = LETTER_FREQUENCY_ORDER.slice(0, INITIAL_UNLOCK_COUNT)
  }

  const keyConfidences: KeyConfidence[] = LETTER_FREQUENCY_ORDER.map((letter) => {
    const stat = statsMap.get(letter)
    const isUnlocked = unlockedKeys.includes(letter)

    if (!stat || stat.totalHits === 0) {
      return {
        key: letter,
        confidence: 0,
        speed: 0,
        accuracy: 100,
        samples: 0,
        unlocked: isUnlocked,
        focused: false,
      }
    }

    const accuracy = stat.totalHits > 0
      ? ((stat.totalHits - stat.errors) / stat.totalHits) * 100
      : 100
    const speed = stat.avgSpeed || 0

    return {
      key: letter,
      confidence: computeKeyConfidence(speed, accuracy, stat.totalHits),
      speed,
      accuracy,
      samples: stat.totalHits,
      unlocked: isUnlocked,
      focused: false,
    }
  })

  if (shouldUnlockNextKey(keyConfidences.filter((k) => k.unlocked))) {
    const nextKey = getNextKeyToUnlock(unlockedKeys)
    if (nextKey) {
      unlockedKeys = [...unlockedKeys, nextKey]
      const kc = keyConfidences.find((k) => k.key === nextKey)
      if (kc) kc.unlocked = true

      await saveUnlockedKeys(unlockedKeys)
    }
  }

  const focusKey = getFocusKey(keyConfidences)
  for (const kc of keyConfidences) {
    kc.focused = kc.key === focusKey
  }

  return {
    unlockedKeys,
    focusKey,
    keyConfidences,
    totalSessions: sessions,
  }
}

export async function saveUnlockedKeys(keys: string[]): Promise<void> {
  await setSetting("adaptive_unlocked", JSON.stringify(keys))
}

export async function updateKeyStatsFromSession(
  keystrokeLog: Array<{ key: string; correct: boolean; timestamp: number }>,
): Promise<void> {
  const keyMetrics: Record<string, {
    hits: number
    errors: number
    latencies: number[]
  }> = {}

  for (let i = 0; i < keystrokeLog.length; i++) {
    const entry = keystrokeLog[i]
    if (entry.key.length !== 1) continue
    const lower = entry.key.toLowerCase()

    if (!keyMetrics[lower]) {
      keyMetrics[lower] = { hits: 0, errors: 0, latencies: [] }
    }

    keyMetrics[lower].hits++
    if (!entry.correct) keyMetrics[lower].errors++

    if (i > 0) {
      const latency = entry.timestamp - keystrokeLog[i - 1].timestamp
      if (latency > 0 && latency < 5000) {
        keyMetrics[lower].latencies.push(latency)
      }
    }
  }

  await db.transaction("rw", db.keyStats, async () => {
    for (const [key, metrics] of Object.entries(keyMetrics)) {
      const avgLatency = metrics.latencies.length > 0
        ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
        : 0

      const charPerMin = avgLatency > 0 ? (60000 / avgLatency) : 0
      const wpm = charPerMin / 5

      const existing = await db.keyStats.where("key").equals(key).first()
      if (existing) {
        const totalHits = existing.totalHits + metrics.hits
        const totalErrors = existing.errors + metrics.errors
        const blendFactor = Math.min(metrics.hits / (metrics.hits + existing.totalHits), 0.4)
        const blendedSpeed = existing.avgSpeed * (1 - blendFactor) + wpm * blendFactor

        await db.keyStats.update(existing.id!, {
          totalHits,
          errors: totalErrors,
          totalLatency: existing.totalLatency + (avgLatency * metrics.hits),
          avgSpeed: blendedSpeed > 0 ? blendedSpeed : existing.avgSpeed,
          lastUpdated: Date.now(),
        })
      } else {
        await db.keyStats.add({
          key,
          totalHits: metrics.hits,
          errors: metrics.errors,
          totalLatency: avgLatency * metrics.hits,
          avgSpeed: wpm,
          lastUpdated: Date.now(),
        })
      }
    }
  })
}

export function getConfidenceColorClass(confidence: number, unlocked: boolean): string {
  if (!unlocked) return "bg-muted/30 text-muted-foreground/40 border-border/30"
  if (confidence >= CONFIDENCE_UNLOCK_THRESHOLD)
    return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
  if (confidence >= 0.6)
    return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40"
  if (confidence >= 0.3)
    return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
  return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40"
}

export function getConfidenceBarColorClass(confidence: number): string {
  if (confidence >= CONFIDENCE_UNLOCK_THRESHOLD) return "bg-emerald-500"
  if (confidence >= 0.6) return "bg-blue-500"
  if (confidence >= 0.3) return "bg-amber-500"
  return "bg-red-500"
}

export function getAdaptiveKeyColorClass(kc: KeyConfidence): string {
  if (!kc.unlocked) return "bg-muted/20 border-border/30 text-muted-foreground/30"
  if (kc.confidence >= CONFIDENCE_UNLOCK_THRESHOLD)
    return "bg-emerald-500/25 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
  if (kc.confidence >= 0.6)
    return "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400"
  if (kc.confidence >= 0.3)
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

    if (kc.confidence < 0.3) {
      weight = 4.0
    } else if (kc.confidence < 0.6) {
      weight = 2.5
    } else if (kc.confidence < CONFIDENCE_UNLOCK_THRESHOLD) {
      weight = 1.5
    }

    if (kc.key === focusKey) {
      weight *= 2.0
    }

    if (kc.samples < MIN_SAMPLES_FOR_CONFIDENCE) {
      weight = Math.max(weight, 3.0)
    }

    weights.set(kc.key, weight)
  }

  return weights
}
