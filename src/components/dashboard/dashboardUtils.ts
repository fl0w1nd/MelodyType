import type { TimeRange } from "./TimeRangeSelector"
import type { TypingSession } from "@/lib/db"

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
      accuracy: Math.round(s.accuracy * 100) / 100,
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
    const avgAcc = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
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
