import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TextDisplay } from "../src/components/practice/TextDisplay"
import {
  analyzeTargetAccuracy,
  computeStoredSessionAccuracyMetrics,
  computeWordAccuracyMetrics,
  isLetterAccuracyKey,
} from "../src/engine/typing/accuracyMetrics"
import type { WordState } from "../src/engine/typing/types"

describe("analyzeTargetAccuracy", () => {
  it("counts repeated misses on the same target as a single false press", () => {
    const result = analyzeTargetAccuracy(
      [
        { key: "t", correct: true },
        { key: "x", correct: false },
        { key: "x", correct: false },
        { key: "e", correct: true },
        { key: "s", correct: true },
      ],
      isLetterAccuracyKey,
    )

    expect(result.successes).toBe(2)
    expect(result.falsePresses).toBe(1)
    expect(result.occurrences).toBe(3)
    expect(result.accuracy).toBeCloseTo((2 / 3) * 100)
    expect(result.keyStats.get("t")).toMatchObject({ successes: 1, falsePresses: 0 })
    expect(result.keyStats.get("e")).toMatchObject({ successes: 0, falsePresses: 1 })
    expect(result.keyStats.get("s")).toMatchObject({ successes: 1, falsePresses: 0 })
  })

  it("ignores spaces as targets while still advancing the expected sequence", () => {
    const result = analyzeTargetAccuracy(
      [
        { key: "a", correct: true },
        { key: " ", correct: true },
        { key: "x", correct: false },
        { key: "b", correct: true },
      ],
      isLetterAccuracyKey,
    )

    expect(result.successes).toBe(1)
    expect(result.falsePresses).toBe(1)
    expect(result.keyStats.get("a")).toMatchObject({ successes: 1, falsePresses: 0 })
    expect(result.keyStats.get("b")).toMatchObject({ successes: 0, falsePresses: 1 })
  })
})

describe("computeWordAccuracyMetrics", () => {
  it("treats a corrected-after-error target as one false press", () => {
    const words: WordState[] = [
      {
        completed: true,
        chars: [
          { char: "l", status: "correct" },
          { char: "e", status: "correct", hadError: true },
          { char: "t", status: "correct" },
          { char: "t", status: "correct" },
          { char: "e", status: "correct" },
          { char: "r", status: "correct" },
        ],
      },
    ]

    const result = computeWordAccuracyMetrics(words)

    expect(result.correctChars).toBe(5)
    expect(result.incorrectChars).toBe(1)
    expect(result.totalChars).toBe(6)
    expect(result.accuracy).toBeCloseTo((5 / 6) * 100)
  })

  it("counts an unresolved incorrect target as one false press", () => {
    const words: WordState[] = [
      {
        completed: false,
        chars: [{ char: "e", status: "incorrect", hadError: true }],
      },
    ]

    const result = computeWordAccuracyMetrics(words)

    expect(result.correctChars).toBe(0)
    expect(result.incorrectChars).toBe(1)
    expect(result.totalChars).toBe(1)
    expect(result.accuracy).toBe(0)
  })
})

describe("TextDisplay false-key highlighting", () => {
  it("does not mark an unresolved incorrect target as red", () => {
    const words: WordState[] = [
      {
        completed: false,
        chars: [{ char: "e", status: "incorrect", hadError: true }],
      },
    ]

    const html = renderToStaticMarkup(
      createElement(TextDisplay, {
        words,
        currentWordIndex: 0,
        currentCharIndex: 0,
        isFinished: false,
      }),
    )

    expect(html).toContain("text-muted-foreground/60")
    expect(html).not.toContain("text-destructive bg-destructive/10 rounded-sm")
  })

  it("marks a corrected-after-error target as red", () => {
    const words: WordState[] = [
      {
        completed: true,
        chars: [{ char: "e", status: "correct", hadError: true }],
      },
    ]

    const html = renderToStaticMarkup(
      createElement(TextDisplay, {
        words,
        currentWordIndex: 0,
        currentCharIndex: 1,
        isFinished: true,
      }),
    )

    expect(html).toContain("text-destructive bg-destructive/10 rounded-sm")
  })
})

describe("computeStoredSessionAccuracyMetrics", () => {
  it("derives accuracy from success and false-press counts", () => {
    const result = computeStoredSessionAccuracyMetrics({
      correctChars: 33,
      errorChars: 1,
    })

    expect(result.totalChars).toBe(34)
    expect(result.accuracy).toBeCloseTo((33 / 34) * 100)
  })
})
