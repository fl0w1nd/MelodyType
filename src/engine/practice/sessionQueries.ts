import { db, type TypingSession } from "@/lib/db"
import type { PracticeModeConfig } from "@/engine/typing/types"
import { getStars, type LevelRecord } from "@/engine/typing/timeLevels"

export function parsePracticeModeConfig(modeConfig: string): PracticeModeConfig | null {
  try {
    return JSON.parse(modeConfig) as PracticeModeConfig
  } catch {
    return null
  }
}

export function buildTimeLevelRecords(
  sessions: TypingSession[],
): Record<string, LevelRecord> {
  const map: Record<string, LevelRecord> = {}

  for (const session of sessions) {
    const config = parsePracticeModeConfig(session.modeConfig)
    const levelId = config?.levelId
    if (!levelId) continue

    if (!map[levelId]) {
      map[levelId] = { bestWpm: 0, bestAccuracy: 0, attempts: 0 }
    }

    map[levelId].attempts++
    const currentStars = getStars(map[levelId])
    const candidate: LevelRecord = {
      bestWpm: session.wpm,
      bestAccuracy: session.accuracy,
      attempts: map[levelId].attempts,
    }
    const candidateStars = getStars(candidate)

    if (
      candidateStars > currentStars ||
      (candidateStars === currentStars && session.wpm > map[levelId].bestWpm)
    ) {
      map[levelId].bestWpm = session.wpm
      map[levelId].bestAccuracy = session.accuracy
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

export async function getLevelPersonalBest(levelId: string): Promise<number | null> {
  const sessions = await getTimeModeSessions()
  const matching = sessions.filter((session) => {
    const config = parsePracticeModeConfig(session.modeConfig)
    return config?.levelId === levelId
  })

  if (matching.length === 0) return null
  return Math.max(...matching.map((session) => session.wpm))
}
