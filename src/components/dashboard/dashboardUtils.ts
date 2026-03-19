import type { TimeRange } from "./TimeRangeSelector"
import type { TypingSession } from "@/lib/db"
import { computeStoredSessionAccuracyMetrics } from "@/engine/typing/accuracyMetrics"

export function filterSessionsByRange(sessions: TypingSession[], range: TimeRange): TypingSession[] {
  if (range === "recent") {
    return sessions.slice(-50)
  }

  const now = Date.now()
  const cutoff = (() => {
    switch (range) {
      case "day": {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      }
      case "week":
        return now - 7 * 24 * 60 * 60 * 1000
      case "month":
        return now - 30 * 24 * 60 * 60 * 1000
    }
  })()

  return sessions.filter((s) => s.timestamp >= cutoff)
}

export interface AggregatedDataPoint {
  label: string
  tooltipLabel: string
  wpm: number
  accuracy: number
  sessions: number
  date: Date
}

function formatRecentAxisLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRecentTooltipLabel(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function aggregateSessionsByRange(
  sessions: TypingSession[],
  range: TimeRange,
): AggregatedDataPoint[] {
  if (range === "recent") {
    return sessions.slice(-50).map((s) => ({
      label: formatRecentAxisLabel(new Date(s.timestamp)),
      tooltipLabel: formatRecentTooltipLabel(new Date(s.timestamp)),
      wpm: Math.round(s.wpm * 10) / 10,
      accuracy: Math.round(computeStoredSessionAccuracyMetrics(s).accuracy * 100) / 100,
      sessions: 1,
      date: new Date(s.timestamp),
    }))
  }

  const grouped = new Map<string, TypingSession[]>()

  for (const session of sessions) {
    const d = new Date(session.timestamp)
    let key: string
    if (range === "day") {
      const hour = d.getHours()
      key = `${hour.toString().padStart(2, "0")}:00`
    } else if (range === "week") {
      key = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    } else {
      key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    }

    const existing = grouped.get(key) ?? []
    existing.push(session)
    grouped.set(key, existing)
  }

  const sorted = [...grouped.entries()].sort((a, b) => {
    const aTime = Math.min(...a[1].map((s) => s.timestamp))
    const bTime = Math.min(...b[1].map((s) => s.timestamp))
    return aTime - bTime
  })

  return sorted.map(([label, sessions]) => {
    const avgWpm = sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length
    const avgAcc =
      sessions.reduce(
        (sum, session) => sum + computeStoredSessionAccuracyMetrics(session).accuracy,
        0,
      ) / sessions.length
    return {
      label,
      tooltipLabel: label,
      wpm: Math.round(avgWpm * 10) / 10,
      accuracy: Math.round(avgAcc * 100) / 100,
      sessions: sessions.length,
      date: new Date(Math.min(...sessions.map((s) => s.timestamp))),
    }
  })
}

function normalizeStoredKey(key: string): string | null {
  if (key === " ") return " "
  if (key.length !== 1) return null
  return key.toLowerCase()
}

function isLetterKey(key: string | null): key is string {
  return key != null && key.length === 1 && key >= "a" && key <= "z"
}

interface SessionKeyActualStats {
  totalPresses: number
  misPresses: number
}

interface SessionKeyTargetStats {
  successPresses: number
  falsePresses: number
}

interface SessionKeyAnalysis {
  actual: Map<string, SessionKeyActualStats>
  target: Map<string, SessionKeyTargetStats>
}

export interface DashboardKeyStats {
  key: string
  totalPresses: number
  misPresses: number
  successPresses: number
  falsePresses: number
  occurrences: number
  falseRate: number | null
  keyAccuracy: number | null
  recentSamples: { session: number; accuracy: number }[]
  learningRate: number
}

function analyzeSessionKeys(session: TypingSession): SessionKeyAnalysis {
  const actual = new Map<string, SessionKeyActualStats>()
  const target = new Map<string, SessionKeyTargetStats>()
  const correctSequence = session.keystrokes
    .filter((stroke) => stroke.correct)
    .map((stroke) => normalizeStoredKey(stroke.key))
    .filter((key): key is string => key != null)

  let expectedIndex = 0
  let positionAlreadyFailed = false

  const ensureActual = (key: string) => {
    const existing = actual.get(key)
    if (existing) return existing
    const created = { totalPresses: 0, misPresses: 0 }
    actual.set(key, created)
    return created
  }

  const ensureTarget = (key: string) => {
    const existing = target.get(key)
    if (existing) return existing
    const created = { successPresses: 0, falsePresses: 0 }
    target.set(key, created)
    return created
  }

  for (const stroke of session.keystrokes) {
    const actualKey = normalizeStoredKey(stroke.key)
    const expectedKey = correctSequence[expectedIndex] ?? null

    if (stroke.correct) {
      if (isLetterKey(actualKey)) {
        ensureActual(actualKey).totalPresses++
      }

      if (!positionAlreadyFailed && isLetterKey(expectedKey)) {
        ensureTarget(expectedKey).successPresses++
      }

      if (expectedKey != null) {
        expectedIndex++
        positionAlreadyFailed = false
      }
      continue
    }

    if (isLetterKey(actualKey)) {
      const stats = ensureActual(actualKey)
      stats.totalPresses++
      stats.misPresses++
    }

    if (!positionAlreadyFailed) {
      if (isLetterKey(expectedKey)) {
        ensureTarget(expectedKey).falsePresses++
      }
      positionAlreadyFailed = true
    }
  }

  return { actual, target }
}

export function buildDashboardKeyStats(sessions: TypingSession[]): Map<string, DashboardKeyStats> {
  const map = new Map<string, DashboardKeyStats>()

  const ensure = (key: string) => {
    const existing = map.get(key)
    if (existing) return existing
    const created: DashboardKeyStats = {
      key,
      totalPresses: 0,
      misPresses: 0,
      successPresses: 0,
      falsePresses: 0,
      occurrences: 0,
      falseRate: null,
      keyAccuracy: null,
      recentSamples: [],
      learningRate: 0,
    }
    map.set(key, created)
    return created
  }

  for (const session of sessions) {
    const analysis = analyzeSessionKeys(session)

    for (const [key, stats] of analysis.actual) {
      const entry = ensure(key)
      entry.totalPresses += stats.totalPresses
      entry.misPresses += stats.misPresses
    }

    for (const [key, stats] of analysis.target) {
      const entry = ensure(key)
      entry.successPresses += stats.successPresses
      entry.falsePresses += stats.falsePresses
    }
  }

  const recentSessions = sessions.slice(-20)
  for (let sessionIndex = 0; sessionIndex < recentSessions.length; sessionIndex++) {
    const analysis = analyzeSessionKeys(recentSessions[sessionIndex])
    for (const [key, stats] of analysis.target) {
      const entry = ensure(key)
      const occurrences = stats.successPresses + stats.falsePresses
      if (occurrences === 0) continue
      entry.recentSamples.push({
        session: sessionIndex + 1,
        accuracy: Math.round((stats.successPresses / occurrences) * 100),
      })
    }
  }

  for (const entry of map.values()) {
    entry.occurrences = entry.successPresses + entry.falsePresses
    entry.falseRate = entry.occurrences > 0
      ? entry.falsePresses / entry.occurrences
      : null
    entry.keyAccuracy = entry.occurrences > 0
      ? entry.successPresses / entry.occurrences
      : null

    const samples = entry.recentSamples
    if (samples.length >= 3) {
      const firstHalf = samples.slice(0, Math.floor(samples.length / 2))
      const secondHalf = samples.slice(Math.floor(samples.length / 2))
      const avgFirst = firstHalf.reduce((sum, sample) => sum + sample.accuracy, 0) / firstHalf.length
      const avgSecond = secondHalf.reduce((sum, sample) => sum + sample.accuracy, 0) / secondHalf.length
      entry.learningRate = avgSecond - avgFirst
    }
  }

  return map
}
