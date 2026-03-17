import { db, type KeystrokeRecord } from "@/lib/db"
import type { PracticeModeConfig, KeystrokeEntry, TypingMetrics } from "@/engine/typing/types"
import type { AdaptiveState } from "@/engine/typing/adaptiveEngine"
import {
  INITIAL_UNLOCK_COUNT,
  recomputeAndUnlock,
  updateKeyStatsFromSession,
} from "@/engine/typing/adaptiveEngine"
import { getAppSetting } from "@/lib/settings"

interface PersistCompletedRoundInput {
  config: PracticeModeConfig
  adaptiveState: AdaptiveState | null
  metrics: TypingMetrics
  keystrokeLog: KeystrokeEntry[]
}

export interface PersistCompletedRoundResult {
  nextAdaptiveState: AdaptiveState | null
  newlyUnlocked: string | null
}

function toStoredKeystrokes(keystrokeLog: KeystrokeEntry[]): KeystrokeRecord[] {
  return keystrokeLog.map((entry) => ({
    key: entry.key,
    correct: entry.correct,
    timestamp: entry.timestamp,
    latency: 0,
  }))
}

async function updateClassicKeyStats(roundLog: KeystrokeEntry[]) {
  const keyCounts: Record<string, { hits: number; errors: number }> = {}

  for (const entry of roundLog) {
    if (entry.key.length !== 1 || entry.key === " ") continue
    const lower = entry.key.toLowerCase()
    if (!keyCounts[lower]) keyCounts[lower] = { hits: 0, errors: 0 }
    keyCounts[lower].hits++
    if (!entry.correct) {
      keyCounts[lower].errors++
    }
  }

  await db.transaction("rw", db.keyStats, async () => {
    for (const [key, counts] of Object.entries(keyCounts)) {
      const existing = await db.keyStats.where("key").equals(key).first()
      if (existing) {
        await db.keyStats.update(existing.id!, {
          totalHits: existing.totalHits + counts.hits,
          errors: existing.errors + counts.errors,
          lastUpdated: Date.now(),
        })
      } else {
        await db.keyStats.add({
          key,
          totalHits: counts.hits,
          errors: counts.errors,
          totalLatency: 0,
          avgSpeed: 0,
          lastUpdated: Date.now(),
        })
      }
    }
  })
}

async function updateDailyGoal(metrics: TypingMetrics) {
  const today = new Date().toISOString().split("T")[0]
  const targetMinutes = await getAppSetting("dailyGoalMinutes")

  await db.transaction("rw", db.dailyGoals, async () => {
    const existing = await db.dailyGoals.where("date").equals(today).first()
    const roundMinutes = metrics.elapsedTime / 60

    if (existing) {
      await db.dailyGoals.update(existing.id!, {
        targetMinutes,
        completedMinutes: existing.completedMinutes + roundMinutes,
        sessionsCount: existing.sessionsCount + 1,
        bestWpm: Math.max(existing.bestWpm, metrics.wpm),
        avgAccuracy:
          (existing.avgAccuracy * existing.sessionsCount + metrics.accuracy) /
          (existing.sessionsCount + 1),
      })
      return
    }

    await db.dailyGoals.add({
      date: today,
      targetMinutes,
      completedMinutes: roundMinutes,
      sessionsCount: 1,
      bestWpm: metrics.wpm,
      avgAccuracy: metrics.accuracy,
    })
  })
}

export async function persistCompletedRound({
  config,
  adaptiveState,
  metrics,
  keystrokeLog,
}: PersistCompletedRoundInput): Promise<PersistCompletedRoundResult> {
  const sessionModeConfig =
    config.mode === "adaptive"
      ? JSON.stringify({
          ...config,
          adaptiveMeta: {
            unlockedKeyCount:
              adaptiveState?.unlockedKeys.length ?? INITIAL_UNLOCK_COUNT,
          },
        })
      : JSON.stringify(config)

  await db.sessions.add({
    timestamp: Date.now(),
    mode: config.mode,
    modeConfig: sessionModeConfig,
    wpm: metrics.wpm,
    rawWpm: metrics.rawWpm,
    accuracy: metrics.accuracy,
    duration: metrics.elapsedTime,
    totalChars: metrics.totalChars,
    correctChars: metrics.correctChars,
    errorChars: metrics.incorrectChars,
    keystrokes: toStoredKeystrokes(keystrokeLog),
  })

  let nextAdaptiveState: AdaptiveState | null = null
  let newlyUnlocked: string | null = null

  if (config.mode === "adaptive") {
    const prevUnlocked = adaptiveState?.unlockedKeys ?? []
    await updateKeyStatsFromSession(keystrokeLog)
    nextAdaptiveState = await recomputeAndUnlock()
    const newKeys = nextAdaptiveState.unlockedKeys.filter(
      (key) => !prevUnlocked.includes(key),
    )
    newlyUnlocked = newKeys[0] ?? null
  } else {
    await updateClassicKeyStats(keystrokeLog)
  }

  await updateDailyGoal(metrics)

  return {
    nextAdaptiveState,
    newlyUnlocked,
  }
}
