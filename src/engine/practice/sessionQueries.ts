import { db, type TypingSession } from "@/lib/db"
import type { PracticeModeConfig } from "@/engine/typing/types"
import {
  compareTimeGrades,
  getLevelById,
  getTimeGrade,
  type LevelRecord,
} from "@/engine/typing/timeLevels"
import { computeStoredSessionAccuracyMetrics } from "@/engine/typing/accuracyMetrics"

export function parsePracticeModeConfig(modeConfig: string): PracticeModeConfig | null {
  try {
    return JSON.parse(modeConfig) as PracticeModeConfig
  } catch {
    return null
  }
}

function shouldReplaceBest(
  nextGrade: LevelRecord["bestGrade"],
  nextWpm: number,
  nextAccuracy: number,
  current: LevelRecord,
): boolean {
  const gradeComparison = compareTimeGrades(nextGrade, current.bestGrade)
  if (gradeComparison > 0) return true
  if (gradeComparison < 0) return false
  if (nextWpm > current.bestWpm) return true
  if (nextWpm < current.bestWpm) return false
  return nextAccuracy > current.bestAccuracy
}

export function buildTimeLevelRecords(
  sessions: TypingSession[],
): Record<string, LevelRecord> {
  const map: Record<string, LevelRecord> = {}

  const orderedSessions = [...sessions].sort((left, right) => left.timestamp - right.timestamp)

  for (const session of orderedSessions) {
    const config = parsePracticeModeConfig(session.modeConfig)
    const levelId = config?.levelId
    const level = levelId ? getLevelById(levelId) : null
    if (!levelId || !level) continue

    const accuracy = computeStoredSessionAccuracyMetrics(session).accuracy
    const sessionGrade = getTimeGrade(level, session.wpm, accuracy)

    if (!map[levelId]) {
      map[levelId] = {
        attempts: 0,
        bestWpm: session.wpm,
        bestAccuracy: accuracy,
        bestGrade: sessionGrade,
        lastWpm: session.wpm,
        lastAccuracy: accuracy,
        lastGrade: sessionGrade,
        lastPlayedAt: session.timestamp,
      }
    }

    const record = map[levelId]
    record.attempts += 1
    record.lastWpm = session.wpm
    record.lastAccuracy = accuracy
    record.lastGrade = sessionGrade
    record.lastPlayedAt = session.timestamp

    if (shouldReplaceBest(sessionGrade, session.wpm, accuracy, record)) {
      record.bestWpm = session.wpm
      record.bestAccuracy = accuracy
      record.bestGrade = sessionGrade
    }
  }

  return map
}

export async function getTimeModeSessions(): Promise<TypingSession[]> {
  return db.sessions.where("mode").equals("time").toArray()
}

export async function getTimeLevelRecords(): Promise<Record<string, LevelRecord>> {
  const sessions = await getTimeModeSessions()
  return buildTimeLevelRecords(sessions)
}

export async function getTimeLevelRecord(levelId: string): Promise<LevelRecord | null> {
  const sessions = await getTimeModeSessions()
  return buildTimeLevelRecords(sessions)[levelId] ?? null
}

export async function getLevelPersonalBest(levelId: string): Promise<number | null> {
  const sessions = await getTimeModeSessions()
  const matching = sessions.filter((session) => {
    const config = parsePracticeModeConfig(session.modeConfig)
    return config?.levelId === levelId
  })

  if (matching.length === 0) return null
  return Math.max(...matching.map((session) => session.wpm))
}
