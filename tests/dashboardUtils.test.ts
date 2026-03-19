import { describe, expect, it } from "vitest"
import { buildDashboardKeyStats } from "../src/components/dashboard/dashboardUtils"
import type { TypingSession } from "../src/lib/db"

function makeSession(keys: Array<{ key: string; correct: boolean }>): TypingSession {
  return {
    id: 1,
    timestamp: 1,
    mode: "adaptive",
    modeConfig: "{}",
    wpm: 60,
    rawWpm: 60,
    accuracy: 100,
    duration: 30,
    totalChars: keys.filter((entry) => entry.key !== " ").length,
    correctChars: keys.filter((entry) => entry.correct && entry.key !== " ").length,
    errorChars: keys.filter((entry) => !entry.correct && entry.key !== " ").length,
    keystrokes: keys.map((entry, index) => ({
      key: entry.key,
      correct: entry.correct,
      timestamp: index * 100,
      latency: 0,
    })),
  }
}

describe("buildDashboardKeyStats", () => {
  it("separates target false-presses from actual mis-presses", () => {
    const stats = buildDashboardKeyStats([
      makeSession([
        { key: "l", correct: true },
        { key: "e", correct: true },
        { key: "t", correct: true },
        { key: "t", correct: true },
        { key: "x", correct: false },
        { key: "x", correct: false },
        { key: "e", correct: true },
        { key: "r", correct: true },
      ]),
    ])

    expect(stats.get("x")).toMatchObject({
      totalPresses: 2,
      misPresses: 2,
      successPresses: 0,
      falsePresses: 0,
      occurrences: 0,
      falseRate: null,
      keyAccuracy: null,
    })

    expect(stats.get("e")).toMatchObject({
      totalPresses: 2,
      misPresses: 0,
      successPresses: 1,
      falsePresses: 1,
      occurrences: 2,
    })
    expect(stats.get("e")?.falseRate).toBeCloseTo(0.5)
    expect(stats.get("e")?.keyAccuracy).toBeCloseTo(0.5)
  })

  it("counts only one false-press for repeated misses on the same pending key", () => {
    const stats = buildDashboardKeyStats([
      makeSession([
        { key: "a", correct: true },
        { key: "x", correct: false },
        { key: "z", correct: false },
        { key: "b", correct: true },
      ]),
    ])

    expect(stats.get("b")).toMatchObject({
      successPresses: 0,
      falsePresses: 1,
      occurrences: 1,
    })

    expect(stats.get("x")).toMatchObject({
      totalPresses: 1,
      misPresses: 1,
    })

    expect(stats.get("z")).toMatchObject({
      totalPresses: 1,
      misPresses: 1,
    })
  })
})
