import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TextDisplay } from "@/components/practice/TextDisplay"
import { MetricsBar } from "@/components/practice/MetricsBar"
import { VirtualKeyboard } from "@/components/practice/VirtualKeyboard"
import { ModeSelector } from "@/components/practice/ModeSelector"
import { ResultsPanel } from "@/components/practice/ResultsPanel"
import { useTypingEngine } from "@/engine/typing/useTypingEngine"
import { useMidi } from "@/engine/midi/MidiContext"
import {
  generateWordText,
  generateTextFromKeys,
  getRandomQuote,
  beginnerLessons,
} from "@/engine/typing/wordLists"
import type { PracticeModeConfig } from "@/engine/typing/types"
import { db } from "@/lib/db"

export default function PracticePage() {
  const [config, setConfig] = useState<PracticeModeConfig>({
    mode: "time",
    timeLimit: 30,
    difficulty: "easy",
  })
  const [showKeyboard, setShowKeyboard] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const { triggerNextFrame } = useMidi()
  const { state, elapsed, loadText, handleKeyDown, getMetrics, reset } =
    useTypingEngine(triggerNextFrame)

  const metrics = useMemo(() => getMetrics(), [getMetrics, elapsed, state])

  const generateText = useCallback(
    (cfg: PracticeModeConfig): string => {
      switch (cfg.mode) {
        case "time":
          return generateWordText(cfg.difficulty ?? "easy", 200)
        case "words":
          return generateWordText(cfg.difficulty ?? "easy", cfg.wordCount ?? 25)
        case "quote":
          return getRandomQuote()
        case "lesson": {
          const lesson = beginnerLessons.find((l) => l.id === cfg.lessonId)
          if (lesson) return generateTextFromKeys(lesson.keys, 30)
          return generateWordText("easy", 25)
        }
        case "free":
          return generateWordText("easy", 500)
        default:
          return generateWordText("easy", 25)
      }
    },
    [],
  )

  const startPractice = useCallback(
    (cfg: PracticeModeConfig) => {
      const text = generateText(cfg)
      loadText(text, cfg.mode === "time" ? cfg.timeLimit : undefined)
    },
    [generateText, loadText],
  )

  useEffect(() => {
    startPractice(config)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfigChange = useCallback(
    (newConfig: PracticeModeConfig) => {
      setConfig(newConfig)
      startPractice(newConfig)
    },
    [startPractice],
  )

  const handleRestart = useCallback(() => {
    reset()
    startPractice(config)
  }, [reset, startPractice, config])

  const handleNext = useCallback(() => {
    if (config.mode === "lesson" && config.lessonId) {
      const currentIdx = beginnerLessons.findIndex(
        (l) => l.id === config.lessonId,
      )
      if (currentIdx < beginnerLessons.length - 1) {
        const next = beginnerLessons[currentIdx + 1]
        const newConfig = { ...config, lessonId: next.id }
        setConfig(newConfig)
        reset()
        startPractice(newConfig)
        return
      }
    }
    handleRestart()
  }, [config, reset, startPractice, handleRestart])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state.isFinished) {
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault()
          handleRestart()
        }
        return
      }

      if (
        e.key === "Tab" ||
        e.key === "Escape"
      ) {
        e.preventDefault()
        if (e.key === "Tab") handleRestart()
        return
      }

      handleKeyDown(e)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleKeyDown, handleRestart, state.isFinished])

  useEffect(() => {
    if (state.isFinished && state.isStarted) {
      const m = getMetrics()
      db.sessions.add({
        timestamp: Date.now(),
        mode: config.mode,
        modeConfig: JSON.stringify(config),
        wpm: m.wpm,
        rawWpm: m.rawWpm,
        accuracy: m.accuracy,
        duration: m.elapsedTime,
        totalChars: m.totalChars,
        correctChars: m.correctChars,
        errorChars: m.incorrectChars,
        keystrokes: state.keystrokeLog.map((k) => ({
          key: k.key,
          correct: k.correct,
          timestamp: k.timestamp,
          latency: 0,
        })),
      })

      const keyCounts: Record<string, { hits: number; errors: number; latency: number }> = {}
      for (const k of state.keystrokeLog) {
        if (k.key.length !== 1) continue
        const lower = k.key.toLowerCase()
        if (!keyCounts[lower]) keyCounts[lower] = { hits: 0, errors: 0, latency: 0 }
        keyCounts[lower].hits++
        if (!k.correct) keyCounts[lower].errors++
      }

      for (const [key, counts] of Object.entries(keyCounts)) {
        db.keyStats
          .where("key")
          .equals(key)
          .first()
          .then((existing) => {
            if (existing) {
              db.keyStats.update(existing.id!, {
                totalHits: existing.totalHits + counts.hits,
                errors: existing.errors + counts.errors,
                avgSpeed: 0,
                lastUpdated: Date.now(),
              })
            } else {
              db.keyStats.add({
                key,
                totalHits: counts.hits,
                errors: counts.errors,
                totalLatency: 0,
                avgSpeed: 0,
                lastUpdated: Date.now(),
              })
            }
          })
      }

      const today = new Date().toISOString().split("T")[0]
      db.dailyGoals
        .where("date")
        .equals(today)
        .first()
        .then((existing) => {
          const sessionMinutes = m.elapsedTime / 60
          if (existing) {
            db.dailyGoals.update(existing.id!, {
              completedMinutes: existing.completedMinutes + sessionMinutes,
              sessionsCount: existing.sessionsCount + 1,
              bestWpm: Math.max(existing.bestWpm, m.wpm),
              avgAccuracy:
                (existing.avgAccuracy * existing.sessionsCount + m.accuracy) /
                (existing.sessionsCount + 1),
            })
          } else {
            db.dailyGoals.add({
              date: today,
              targetMinutes: 30,
              completedMinutes: sessionMinutes,
              sessionsCount: 1,
              bestWpm: m.wpm,
              avgAccuracy: m.accuracy,
            })
          }
        })
    }
  }, [state.isFinished]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeKeys = useMemo(() => {
    if (config.mode === "lesson" && config.lessonId) {
      const lesson = beginnerLessons.find((l) => l.id === config.lessonId)
      if (lesson) return new Set(lesson.keys)
    }
    return undefined
  }, [config])

  const nextKey = useMemo(() => {
    if (state.isFinished || !state.words.length) return undefined
    const word = state.words[state.currentWordIndex]
    if (!word) return undefined
    if (state.currentCharIndex < word.chars.length) {
      return word.chars[state.currentCharIndex].char
    }
    return " "
  }, [state])

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6" tabIndex={-1}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight mb-1">
          Practice
        </h1>
        <p className="text-sm text-muted-foreground">
          Focus on accuracy first, speed will follow
        </p>
      </motion.div>

      <ModeSelector onSelect={handleConfigChange} currentConfig={config} />

      <AnimatePresence mode="wait">
        {state.isFinished && state.isStarted ? (
          <ResultsPanel
            key="results"
            metrics={metrics}
            onRestart={handleRestart}
            onNext={config.mode === "lesson" ? handleNext : undefined}
          />
        ) : (
          <motion.div
            key="practice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col gap-4"
          >
            <MetricsBar
              metrics={metrics}
              isStarted={state.isStarted}
              timeLimit={config.mode === "time" ? config.timeLimit : undefined}
            />

            <TextDisplay
              words={state.words}
              currentWordIndex={state.currentWordIndex}
              currentCharIndex={state.currentCharIndex}
              isFinished={state.isFinished}
            />

            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs"
                onClick={handleRestart}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart
                <kbd className="ml-1 rounded border border-border/60 bg-secondary/60 px-1 py-0.5 text-[10px] font-mono">
                  Tab
                </kbd>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs"
                onClick={() => setShowKeyboard((v) => !v)}
              >
                {showKeyboard ? "Hide" : "Show"} Keyboard
              </Button>
            </div>

            <AnimatePresence>
              {showKeyboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <VirtualKeyboard
                    activeKeys={activeKeys}
                    nextKey={nextKey}
                    showFingerHints={config.mode === "lesson"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
