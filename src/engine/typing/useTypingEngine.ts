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
  const timeLimitRef = useRef<number | null>(null)
  const onFinishRef = useRef<(() => void) | null>(null)

  const loadText = useCallback(
    (text: string, timeLimit?: number, onFinish?: () => void) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(0)
      timeLimitRef.current = timeLimit ?? null
      onFinishRef.current = onFinish ?? null
      setState({
        ...initialState,
        words: textToWords(text),
      })
    },
    [],
  )

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setState((prev) => ({
      ...prev,
      isFinished: true,
      endTime: Date.now(),
    }))
    onFinishRef.current?.()
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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

          timerRef.current = setInterval(() => {
            setElapsed((t) => {
              const newT = t + 1
              if (timeLimitRef.current && newT >= timeLimitRef.current) {
                finish()
              }
              return newT
            })
          }, 1000)
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
          if (next.currentCharIndex > 0) {
            const extraChars = word.chars.filter((c) => c.status === "extra")
            if (extraChars.length > 0 && next.currentCharIndex >= word.chars.length - extraChars.length) {
              word.chars.pop()
            } else {
              next.currentCharIndex--
              word.chars[next.currentCharIndex].status = "pending"
              word.chars[next.currentCharIndex].typedChar = undefined
            }
          }
          return next
        }

        if (e.key === " ") {
          if (next.currentCharIndex > 0) {
            word.completed = true
            if (next.currentWordIndex < next.words.length - 1) {
              next.currentWordIndex++
              next.currentCharIndex = 0
            } else {
              next.isFinished = true
              next.endTime = Date.now()
              if (timerRef.current) clearInterval(timerRef.current)
              onFinishRef.current?.()
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
          } else {
            char.status = "incorrect"
            char.typedChar = e.key
            next.errorKeystrokes++
          }
          next.currentCharIndex++
        } else {
          word.chars.push({
            char: e.key,
            status: "extra",
            typedChar: e.key,
          })
          next.currentCharIndex++
          next.errorKeystrokes++
        }

        next.keystrokeLog = [...prev.keystrokeLog, entry]

        const isLastWord = next.currentWordIndex === next.words.length - 1
        const allCharsTyped = next.currentCharIndex >= word.chars.filter((c) => c.status !== "extra").length
        if (isLastWord && allCharsTyped && word.chars.every((c) => c.status !== "pending")) {
          word.completed = true
          next.isFinished = true
          next.endTime = Date.now()
          if (timerRef.current) clearInterval(timerRef.current)
          onFinishRef.current?.()
        }

        onKeystroke?.()
        return next
      })
    },
    [finish, onKeystroke],
  )

  const getMetrics = useCallback((): TypingMetrics => {
    const timeInMinutes = elapsed > 0 ? elapsed / 60 : 0.001

    let correctChars = 0
    let incorrectChars = 0
    let totalChars = 0

    for (const word of state.words) {
      for (const char of word.chars) {
        if (char.status === "correct") correctChars++
        if (char.status === "incorrect" || char.status === "extra")
          incorrectChars++
        if (char.status !== "pending") totalChars++
      }
    }

    const wpm = timeInMinutes > 0 ? correctChars / 5 / timeInMinutes : 0
    const rawWpm = timeInMinutes > 0 ? totalChars / 5 / timeInMinutes : 0
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100

    const wpmSamples: number[] = []
    const windowSize = 5000
    for (const entry of state.keystrokeLog) {
      if (!state.startTime) break
      const t = (entry.timestamp - state.startTime) / 60000
      if (t > 0) {
        wpmSamples.push(
          state.keystrokeLog.filter(
            (e) =>
              e.timestamp >= entry.timestamp - windowSize &&
              e.timestamp <= entry.timestamp &&
              e.correct,
          ).length /
            5 /
            (windowSize / 60000),
        )
      }
    }

    let consistency = 100
    if (wpmSamples.length > 1) {
      const mean = wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length
      const variance =
        wpmSamples.reduce((a, b) => a + (b - mean) ** 2, 0) /
        wpmSamples.length
      const stdDev = Math.sqrt(variance)
      consistency = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 100
    }

    return {
      wpm: Math.round(wpm * 10) / 10,
      rawWpm: Math.round(rawWpm * 10) / 10,
      accuracy: Math.round(accuracy * 100) / 100,
      correctChars,
      incorrectChars,
      totalChars,
      elapsedTime: elapsed,
      consistency: Math.round(consistency),
    }
  }, [state, elapsed])

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setElapsed(0)
    setState({ ...initialState })
  }, [])

  return {
    state,
    elapsed,
    loadText,
    handleKeyDown,
    getMetrics,
    reset,
    finish,
  }
}
