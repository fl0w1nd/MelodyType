import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw, Pause } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TextDisplay } from "@/components/practice/TextDisplay"
import { MetricsBar } from "@/components/practice/MetricsBar"
import { VirtualKeyboard } from "@/components/practice/VirtualKeyboard"
import { ModeSelector } from "@/components/practice/ModeSelector"
import { ResultsPanel } from "@/components/practice/ResultsPanel"
import { AdaptiveResultsPanel } from "@/components/practice/AdaptiveResultsPanel"
import { KeyProgressPanel } from "@/components/practice/KeyProgressPanel"
import { useTypingEngine } from "@/engine/typing/useTypingEngine"
import { useMidi } from "@/engine/midi/MidiContext"
import {
  NoteParticles,
  useNoteParticles,
} from "@/components/practice/NoteParticles"
import {
  generateWordText,
  generateTextFromKeys,
  getRandomQuote,
  beginnerLessons,
} from "@/engine/typing/wordLists"
import { generateAdaptiveText } from "@/engine/typing/pseudoWords"
import type { PracticeModeConfig } from "@/engine/typing/types"
import type { AdaptiveState } from "@/engine/typing/adaptiveEngine"
import {
  loadAdaptiveState,
  recomputeAndUnlock,
  updateKeyStatsFromSession,
} from "@/engine/typing/adaptiveEngine"
import { db } from "@/lib/db"
import type { KeystrokeEntry, TypingMetrics, WordState } from "@/engine/typing/types"

const ADAPTIVE_WORD_COUNT = 30
const UNLOCK_TOAST_DURATION_MS = 2500

function computeMetricsForWords(
  words: WordState[],
  keystrokeLog: KeystrokeEntry[],
  elapsedTime: number,
): TypingMetrics {
  const timeInMinutes = elapsedTime > 0 ? elapsedTime / 60 : 0

  let typedChars = 0
  let charsWithError = 0

  for (const word of words) {
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
  if (keystrokeLog.length > 2) {
    const windowSize = 5000
    const wpmSamples: number[] = []
    for (const entry of keystrokeLog) {
      const correctInWindow = keystrokeLog.filter(
        (e) =>
          e.timestamp >= entry.timestamp - windowSize &&
          e.timestamp <= entry.timestamp &&
          e.correct,
      ).length
      const sample = correctInWindow / 5 / (windowSize / 60000)
      if (Number.isFinite(sample)) wpmSamples.push(sample)
    }

    if (wpmSamples.length > 1) {
      const mean = wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length
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
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy * 100) / 100 : 100,
    correctChars,
    incorrectChars: charsWithError,
    totalChars: typedChars,
    elapsedTime,
    consistency: Number.isFinite(consistency) ? Math.round(consistency) : 100,
  }
}

export default function PracticePage() {
  const [config, setConfig] = useState<PracticeModeConfig>({
    mode: "adaptive",
  })
  const [showKeyboard, setShowKeyboard] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null)
  const adaptiveLoaded = useRef(false)

  // Continuous session state for adaptive mode
  const [adaptivePaused, setAdaptivePaused] = useState(false)
  const [roundCount, setRoundCount] = useState(0)
  const roundKeystrokeStartRef = useRef(0)
  const roundStartTimeRef = useRef(0)
  const adaptiveContinuingRef = useRef(false)
  const newlyUnlockedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { triggerNextFrame } = useMidi()
  const { particles, emit: emitNote } = useNoteParticles()
  const onKeystroke = useCallback(() => {
    triggerNextFrame()
    emitNote()
  }, [triggerNextFrame, emitNote])
  const { state, elapsed, loadText, continueWithText, handleKeyDown, getMetrics, reset } =
    useTypingEngine(onKeystroke)

  const metrics = useMemo(() => getMetrics(), [getMetrics, elapsed, state])
  const adaptiveRoundLog = useMemo(
    () => state.keystrokeLog.slice(roundKeystrokeStartRef.current),
    [state.keystrokeLog],
  )
  const adaptiveRoundMetrics = useMemo(() => {
    const roundElapsed = Math.max(elapsed - roundStartTimeRef.current, 0)
    return computeMetricsForWords(state.words, adaptiveRoundLog, roundElapsed)
  }, [state.words, adaptiveRoundLog, elapsed])

  useEffect(() => {
    if (adaptiveLoaded.current) return
    adaptiveLoaded.current = true
    loadAdaptiveState().then((s) => {
      setAdaptiveState(s)
      if (config.mode === "adaptive") {
        const text = generateAdaptiveText(
          s.keyConfidences,
          s.unlockedKeys,
          s.focusKey,
          ADAPTIVE_WORD_COUNT,
        )
        loadText(text)
      }
    })
  }, [config.mode, loadText])

  const generateText = useCallback(
    (cfg: PracticeModeConfig, aState?: AdaptiveState | null): string => {
      switch (cfg.mode) {
        case "adaptive": {
          const st = aState ?? adaptiveState
          if (st) {
            return generateAdaptiveText(
              st.keyConfidences,
              st.unlockedKeys,
              st.focusKey,
              ADAPTIVE_WORD_COUNT,
            )
          }
          return generateWordText("easy", 25)
        }
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
    [adaptiveState],
  )

  const startPractice = useCallback(
    (cfg: PracticeModeConfig, aState?: AdaptiveState | null) => {
      const text = generateText(cfg, aState)
      loadText(text, cfg.mode === "time" ? cfg.timeLimit : undefined)
      setRoundCount(0)
      roundKeystrokeStartRef.current = 0
      roundStartTimeRef.current = 0
      setAdaptivePaused(false)
      adaptiveContinuingRef.current = false
    },
    [generateText, loadText],
  )

  const handleConfigChange = useCallback(
    (newConfig: PracticeModeConfig) => {
      setConfig(newConfig)
      setNewlyUnlocked(null)
      if (newConfig.mode === "adaptive") {
        loadAdaptiveState().then((s) => {
          setAdaptiveState(s)
          startPractice(newConfig, s)
        })
      } else {
        startPractice(newConfig)
      }
    },
    [startPractice],
  )

  const handleRestart = useCallback(() => {
    reset()
    setNewlyUnlocked(null)
    setAdaptivePaused(false)
    adaptiveContinuingRef.current = false
    if (config.mode === "adaptive") {
      loadAdaptiveState().then((s) => {
        setAdaptiveState(s)
        startPractice(config, s)
      })
    } else {
      startPractice(config)
    }
  }, [reset, startPractice, config])

  const handleAdaptivePause = useCallback(() => {
    setAdaptivePaused(true)
  }, [])

  const handleAdaptiveResume = useCallback(() => {
    setAdaptivePaused(false)
    adaptiveContinuingRef.current = false
    if (state.isFinished) {
      loadAdaptiveState().then((s) => {
        setAdaptiveState(s)
        const text = generateAdaptiveText(
          s.keyConfidences,
          s.unlockedKeys,
          s.focusKey,
          ADAPTIVE_WORD_COUNT,
        )
        continueWithText(text)
        roundKeystrokeStartRef.current = state.keystrokeLog.length
        roundStartTimeRef.current = elapsed
      })
    }
  }, [state.isFinished, state.keystrokeLog.length, continueWithText, elapsed])

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
      const isAdaptiveMode = config.mode === "adaptive"

      if (isAdaptiveMode && adaptivePaused) {
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault()
          handleAdaptiveResume()
        }
        if (e.key === "Escape") {
          e.preventDefault()
          handleRestart()
        }
        return
      }

      if (state.isFinished && !isAdaptiveMode) {
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault()
          handleRestart()
        }
        return
      }

      if (e.key === "Tab") {
        e.preventDefault()
        handleRestart()
        return
      }

      if (e.key === "Escape") {
        e.preventDefault()
        if (isAdaptiveMode && state.isStarted) {
          handleAdaptivePause()
        }
        return
      }

      e.preventDefault()
      handleKeyDown(e)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleKeyDown, handleRestart, handleAdaptivePause, handleAdaptiveResume, state.isFinished, state.isStarted, config.mode, adaptivePaused])

  const persistFinishedRound = useCallback(() => {
    if (!state.isFinished || !state.isStarted) return
    if (adaptiveContinuingRef.current) return
    adaptiveContinuingRef.current = true

    const roundLog = state.keystrokeLog.slice(roundKeystrokeStartRef.current)
    const m = getMetrics()

    const roundElapsed =
      config.mode === "adaptive"
        ? Math.max(m.elapsedTime - roundStartTimeRef.current, 0)
        : m.elapsedTime
    const roundMetrics =
      config.mode === "adaptive"
        ? computeMetricsForWords(state.words, roundLog, roundElapsed)
        : m
    const sessionWpm = roundMetrics.wpm
    const sessionRawWpm = roundMetrics.rawWpm
    const sessionAccuracy = roundMetrics.accuracy
    const sessionDuration = roundMetrics.elapsedTime
    const sessionTotalChars = roundMetrics.totalChars
    const sessionCorrectChars = roundMetrics.correctChars
    const sessionErrorChars = roundMetrics.incorrectChars

    void db.sessions.add({
      timestamp: Date.now(),
      mode: config.mode,
      modeConfig: JSON.stringify(config),
      wpm: sessionWpm,
      rawWpm: sessionRawWpm,
      accuracy: sessionAccuracy,
      duration: sessionDuration,
      totalChars: sessionTotalChars,
      correctChars: sessionCorrectChars,
      errorChars: sessionErrorChars,
      keystrokes: roundLog.map((k) => ({
        key: k.key,
        correct: k.correct,
        timestamp: k.timestamp,
        latency: 0,
      })),
    })

    if (config.mode === "adaptive") {
      const prevUnlocked = adaptiveState?.unlockedKeys ?? []
      void updateKeyStatsFromSession(roundLog).then(() =>
        recomputeAndUnlock().then((s) => {
          const newKeys = s.unlockedKeys.filter(
            (k) => !prevUnlocked.includes(k),
          )
          if (newKeys.length > 0) {
            setNewlyUnlocked(newKeys[0])
          }
          setAdaptiveState(s)
          setRoundCount((c) => c + 1)

          if (!adaptivePaused) {
            const text = generateAdaptiveText(
              s.keyConfidences,
              s.unlockedKeys,
              s.focusKey,
              ADAPTIVE_WORD_COUNT,
            )
            continueWithText(text)
            roundKeystrokeStartRef.current = state.keystrokeLog.length
            roundStartTimeRef.current = m.elapsedTime
            adaptiveContinuingRef.current = false
          }
        }),
      )
    } else {
      const keyCounts: Record<string, { hits: number; errors: number }> = {}
      for (const k of roundLog) {
        if (k.key.length !== 1 || k.key === " ") continue
        const lower = k.key.toLowerCase()
        if (!keyCounts[lower]) keyCounts[lower] = { hits: 0, errors: 0 }
        keyCounts[lower].hits++
        if (!k.correct) keyCounts[lower].errors++
      }

      void db.transaction("rw", db.keyStats, async () => {
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

    const today = new Date().toISOString().split("T")[0]
    void db.transaction("rw", db.dailyGoals, async () => {
      const existing = await db.dailyGoals.where("date").equals(today).first()
      const roundMinutes = sessionDuration / 60
      if (existing) {
        await db.dailyGoals.update(existing.id!, {
          completedMinutes: existing.completedMinutes + roundMinutes,
          sessionsCount: existing.sessionsCount + 1,
          bestWpm: Math.max(existing.bestWpm, sessionWpm),
          avgAccuracy:
            (existing.avgAccuracy * existing.sessionsCount + sessionAccuracy) /
            (existing.sessionsCount + 1),
        })
      } else {
        await db.dailyGoals.add({
          date: today,
          targetMinutes: 30,
          completedMinutes: roundMinutes,
          sessionsCount: 1,
          bestWpm: sessionWpm,
          avgAccuracy: sessionAccuracy,
        })
      }
    })
  }, [
    adaptivePaused,
    adaptiveState,
    config,
    continueWithText,
    getMetrics,
    state.isFinished,
    state.isStarted,
    state.keystrokeLog,
    state.words,
  ])

  useEffect(() => {
    persistFinishedRound()
  }, [persistFinishedRound])

  useEffect(() => {
    if (!newlyUnlocked || adaptivePaused) return
    if (newlyUnlockedTimeoutRef.current) {
      clearTimeout(newlyUnlockedTimeoutRef.current)
    }
    newlyUnlockedTimeoutRef.current = setTimeout(() => {
      setNewlyUnlocked(null)
      newlyUnlockedTimeoutRef.current = null
    }, UNLOCK_TOAST_DURATION_MS)
    return () => {
      if (newlyUnlockedTimeoutRef.current) {
        clearTimeout(newlyUnlockedTimeoutRef.current)
        newlyUnlockedTimeoutRef.current = null
      }
    }
  }, [adaptivePaused, newlyUnlocked])

  const activeKeys = useMemo(() => {
    if (config.mode === "adaptive" && adaptiveState) {
      return new Set(adaptiveState.unlockedKeys)
    }
    if (config.mode === "lesson" && config.lessonId) {
      const lesson = beginnerLessons.find((l) => l.id === config.lessonId)
      if (lesson) return new Set(lesson.keys)
    }
    return undefined
  }, [config, adaptiveState])

  const nextKey = useMemo(() => {
    if (state.isFinished || !state.words.length) return undefined
    const word = state.words[state.currentWordIndex]
    if (!word) return undefined
    if (state.currentCharIndex < word.chars.length) {
      return word.chars[state.currentCharIndex].char
    }
    return " "
  }, [state])

  const isAdaptive = config.mode === "adaptive"
  const showAdaptiveResults = isAdaptive && adaptivePaused && adaptiveState
  const showNonAdaptiveResults = !isAdaptive && state.isFinished && state.isStarted
  const showResults = showAdaptiveResults || showNonAdaptiveResults

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-6"
      tabIndex={-1}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight mb-1">
          Practice
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdaptive
            ? "Adaptive practice — focuses on your weakest keys"
            : "Focus on accuracy first, speed will follow"}
        </p>
      </motion.div>

      <ModeSelector onSelect={handleConfigChange} currentConfig={config} />

      {isAdaptive && adaptiveState && !showResults && (
        <KeyProgressPanel
          keyConfidences={adaptiveState.keyConfidences}
          focusKey={adaptiveState.focusKey}
          targetCpm={adaptiveState.settings.targetCpm}
        />
      )}

      {/* New key unlocked toast */}
      <AnimatePresence>
        {isAdaptive && newlyUnlocked && !adaptivePaused && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-sm font-medium text-emerald-700 dark:text-emerald-400 shadow-lg"
          >
            🔓 New key unlocked: <span className="font-mono font-bold text-base">{newlyUnlocked.toUpperCase()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showResults ? (
          showAdaptiveResults ? (
            <AdaptiveResultsPanel
              key="adaptive-results"
              metrics={adaptiveRoundMetrics}
              keystrokeLog={adaptiveRoundLog}
              keyConfidences={adaptiveState.keyConfidences}
              newlyUnlocked={newlyUnlocked}
              onRestart={handleRestart}
              onResume={handleAdaptiveResume}
              roundCount={roundCount}
            />
          ) : (
            <ResultsPanel
              key="results"
              metrics={metrics}
              onRestart={handleRestart}
              onNext={config.mode === "lesson" ? handleNext : undefined}
            />
          )
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

            <div className="relative">
              <TextDisplay
                words={state.words}
                currentWordIndex={state.currentWordIndex}
                currentCharIndex={state.currentCharIndex}
                isFinished={state.isFinished}
              />
              <NoteParticles particles={particles} />
            </div>

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
              {isAdaptive && state.isStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground text-xs"
                  onClick={handleAdaptivePause}
                >
                  <Pause className="h-3.5 w-3.5" />
                  Results
                  <kbd className="ml-1 rounded border border-border/60 bg-secondary/60 px-1 py-0.5 text-[10px] font-mono">
                    Esc
                  </kbd>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs"
                onClick={() => setShowKeyboard((v) => !v)}
              >
                {showKeyboard ? "Hide" : "Show"} Keyboard
              </Button>
            </div>

            {isAdaptive && roundCount > 0 && (
              <div className="text-center text-[10px] text-muted-foreground/60 font-mono">
                Round {roundCount + 1} · continuous session
              </div>
            )}

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
                    keyConfidences={
                      isAdaptive ? adaptiveState?.keyConfidences : undefined
                    }
                    adaptiveMode={isAdaptive}
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
