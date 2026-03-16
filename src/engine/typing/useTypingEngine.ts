import { useCallback, useRef, useState } from "react"
import type {
  TypingState,
  TypingMetrics,
  WordState,
  CharState,
  KeystrokeEntry,
} from "./types"

function textToWords(text: string): WordState[] {
  return text.split(" ").map((word) => ({
    chars: word.split("").map(
      (char): CharState => ({
        char,
        status: "pending",
      }),
    ),
    completed: false,
  }))
}

const initialState: TypingState = {
  words: [],
  currentWordIndex: 0,
  currentCharIndex: 0,
  startTime: null,
  endTime: null,
  isStarted: false,
  isFinished: false,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  errorKeystrokes: 0,
  keystrokeLog: [],
}

export function useTypingEngine(onKeystroke?: () => void) {
  const [state, setState] = useState<TypingState>({ ...initialState })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const timeLimitRef = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const onKeystrokeRef = useRef(onKeystroke)
  onKeystrokeRef.current = onKeystroke

  const loadText = useCallback((text: string, timeLimit?: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setElapsed(0)
    elapsedRef.current = 0
    startTimeRef.current = null
    timeLimitRef.current = timeLimit ?? null
    finishedRef.current = false
    setState({
      ...initialState,
      words: textToWords(text),
    })
  }, [])

  const doFinish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState((prev) => ({
      ...prev,
      isFinished: true,
      endTime: Date.now(),
    }))
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      if (secs !== elapsedRef.current) {
        elapsedRef.current = secs
        setElapsed(secs)
      }
      if (timeLimitRef.current && secs >= timeLimitRef.current) {
        doFinish()
      }
    }, 200)
  }, [doFinish])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (finishedRef.current) return

      let didType = false
      let shouldStartTimer = false

      setState((prev) => {
        if (prev.isFinished) return prev
        if (prev.words.length === 0) return prev

        const next = { ...prev }
        next.words = prev.words.map((w) => ({
          ...w,
          chars: w.chars.map((c) => ({ ...c })),
        }))

        if (!next.isStarted && e.key.length === 1) {
          next.isStarted = true
          next.startTime = Date.now()
          shouldStartTimer = true
        }

        if (!next.isStarted) return prev

        const word = next.words[next.currentWordIndex]
        if (!word) return prev

        const entry: KeystrokeEntry = {
          key: e.key,
          correct: false,
          timestamp: Date.now(),
          wordIndex: next.currentWordIndex,
          charIndex: next.currentCharIndex,
        }

        if (e.key === "Backspace") {
          return next
        }

        if (e.key === " ") {
          const allCorrect = word.chars.every((c) => c.status === "correct")
          if (allCorrect && next.currentCharIndex === word.chars.length) {
            entry.correct = true
            next.keystrokeLog = [...prev.keystrokeLog, entry]
            word.completed = true
            didType = true
            if (next.currentWordIndex < next.words.length - 1) {
              next.currentWordIndex++
              next.currentCharIndex = 0
            } else {
              next.isFinished = true
              next.endTime = Date.now()
              finishedRef.current = true
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }
            }
          }
          return next
        }

        if (e.key.length !== 1) return prev

        next.totalKeystrokes++

        if (next.currentCharIndex < word.chars.length) {
          const char = word.chars[next.currentCharIndex]
          if (e.key === char.char) {
            char.status = "correct"
            char.typedChar = e.key
            entry.correct = true
            next.correctKeystrokes++
            next.currentCharIndex++
            didType = true
          } else {
            char.status = "incorrect"
            char.typedChar = e.key
            char.hadError = true
            next.errorKeystrokes++
            didType = true
          }
        }

        next.keystrokeLog = [...prev.keystrokeLog, entry]

        const isLastWord = next.currentWordIndex === next.words.length - 1
        const allDone =
          next.currentCharIndex === word.chars.length &&
          word.chars.every((c) => c.status === "correct")
        if (isLastWord && allDone) {
          word.completed = true
          next.isFinished = true
          next.endTime = Date.now()
          finishedRef.current = true
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }

        return next
      })

      if (shouldStartTimer) {
        startTimer()
      }

      if (didType) {
        queueMicrotask(() => {
          onKeystrokeRef.current?.()
        })
      }
    },
    [doFinish, startTimer],
  )

  const getMetrics = useCallback((): TypingMetrics => {
    const currentElapsed = elapsedRef.current || elapsed
    const timeInMinutes = currentElapsed > 0 ? currentElapsed / 60 : 0

    let typedChars = 0
    let charsWithError = 0

    for (const word of state.words) {
      for (const char of word.chars) {
        if (char.status !== "pending") {
          typedChars++
          if (char.hadError) charsWithError++
        }
      }
    }

    const correctChars = typedChars - charsWithError
    const wpm = timeInMinutes > 0 ? correctChars / 5 / timeInMinutes : 0
    const rawWpm = timeInMinutes > 0 ? typedChars / 5 / timeInMinutes : 0
    const accuracy = typedChars > 0 ? (correctChars / typedChars) * 100 : 100

    let consistency = 100
    if (state.keystrokeLog.length > 2 && state.startTime) {
      const windowSize = 5000
      const wpmSamples: number[] = []
      for (const entry of state.keystrokeLog) {
        const correctInWindow = state.keystrokeLog.filter(
          (e) =>
            e.timestamp >= entry.timestamp - windowSize &&
            e.timestamp <= entry.timestamp &&
            e.correct,
        ).length
        const sample = correctInWindow / 5 / (windowSize / 60000)
        if (Number.isFinite(sample)) wpmSamples.push(sample)
      }

      if (wpmSamples.length > 1) {
        const mean =
          wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length
        if (mean > 0) {
          const variance =
            wpmSamples.reduce((a, b) => a + (b - mean) ** 2, 0) /
            wpmSamples.length
          const stdDev = Math.sqrt(variance)
          consistency = Math.max(0, 100 - (stdDev / mean) * 100)
        }
      }
    }

    return {
      wpm: Number.isFinite(wpm) ? Math.round(wpm * 10) / 10 : 0,
      rawWpm: Number.isFinite(rawWpm) ? Math.round(rawWpm * 10) / 10 : 0,
      accuracy: Number.isFinite(accuracy)
        ? Math.round(accuracy * 100) / 100
        : 100,
      correctChars,
      incorrectChars: charsWithError,
      totalChars: typedChars,
      elapsedTime: currentElapsed,
      consistency: Number.isFinite(consistency) ? Math.round(consistency) : 100,
    }
  }, [state, elapsed])

  const continueWithText = useCallback((text: string) => {
    finishedRef.current = false
    setState((prev) => ({
      ...prev,
      words: textToWords(text),
      currentWordIndex: 0,
      currentCharIndex: 0,
      isFinished: false,
      endTime: null,
    }))
    if (!timerRef.current && startTimeRef.current) {
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
        if (secs !== elapsedRef.current) {
          elapsedRef.current = secs
          setElapsed(secs)
        }
      }, 200)
    }
  }, [])

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    startTimeRef.current = null
    finishedRef.current = false
    elapsedRef.current = 0
    setElapsed(0)
    setState({ ...initialState })
  }, [])

  return {
    state,
    elapsed,
    loadText,
    continueWithText,
    handleKeyDown,
    getMetrics,
    reset,
    finish: doFinish,
  }
}
