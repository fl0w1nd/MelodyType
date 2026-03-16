import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TextDisplay } from "@/components/practice/TextDisplay"
import { MetricsBar } from "@/components/practice/MetricsBar"
import { VirtualKeyboard } from "@/components/practice/VirtualKeyboard"
import { ModeSelector } from "@/components/practice/ModeSelector"
import { ResultsPanel } from "@/components/practice/ResultsPanel"
import { KeyProgressPanel } from "@/components/practice/KeyProgressPanel"
import { useTypingEngine } from "@/engine/typing/useTypingEngine"
import { useMidi } from "@/engine/midi/MidiContext"
import {
  NoteParticles,
  useNoteParticles,
} from "@/components/practice/NoteParticles"
import {
  generateWordText,
  getRandomQuote,
} from "@/engine/typing/wordLists"
import { generateAdaptiveText } from "@/engine/typing/pseudoWords"
import type { PracticeModeConfig } from "@/engine/typing/types"
import type { AdaptiveSettings, AdaptiveState } from "@/engine/typing/adaptiveEngine"
import {
  DEFAULT_TARGET_CPM,
  INITIAL_UNLOCK_COUNT,
  forceUnlockKey,
  loadAdaptiveState,
  recomputeAndUnlock,
  updateKeyStatsFromSession,
} from "@/engine/typing/adaptiveEngine"
import { db, setSetting } from "@/lib/db"
import type { KeystrokeEntry, TypingMetrics, WordState } from "@/engine/typing/types"

const ADAPTIVE_WORD_COUNT = 30
const UNLOCK_TOAST_DURATION_MS = 2500
const ADAPTIVE_INACTIVITY_TIMEOUT_MS = 10000

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

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null)
  const adaptiveLoaded = useRef(false)

  // Continuous session state for adaptive mode
  const [roundCount, setRoundCount] = useState(0)
  const adaptiveContinuingRef = useRef(false)
  const newlyUnlockedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { triggerNextFrame } = useMidi()
  const { particles, emit: emitNote } = useNoteParticles()
  const onKeystroke = useCallback(() => {
    triggerNextFrame()
    emitNote()
  }, [triggerNextFrame, emitNote])
  const { state, elapsed, loadText, handleKeyDown, getMetrics, reset } =
    useTypingEngine(onKeystroke)

  const metrics = useMemo(() => getMetrics(), [getMetrics])
  const adaptivePersistMetrics = useMemo(
    () => computeMetricsForWords(state.words, state.keystrokeLog, elapsed),
    [elapsed, state.keystrokeLog, state.words],
  )
  const adaptiveDisplayMetrics = useMemo(
    () => computeMetricsForWords(
      state.words,
      state.keystrokeLog,
      state.isFinished ? 0 : elapsed,
    ),
    [elapsed, state.isFinished, state.keystrokeLog, state.words],
  )

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
          return generateWordText(cfg.difficulty ?? "easy", 200, {
            punctuation: cfg.punctuation,
            numbers: cfg.numbers,
          })
        case "quote":
          return getRandomQuote()
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

  const discardAdaptiveSession = useCallback(() => {
    if (config.mode !== "adaptive") return
    if (state.isFinished) return

    reset()
    setNewlyUnlocked(null)
    adaptiveContinuingRef.current = false
    loadAdaptiveState().then((s) => {
      setAdaptiveState(s)
      startPractice(config, s)
    })
  }, [config, reset, startPractice, state.isFinished])

  const updateAdaptiveSettings = useCallback(
    async (updates: Partial<AdaptiveSettings>) => {
      const nextTarget =
        updates.targetCpm ?? adaptiveState?.settings.targetCpm ?? DEFAULT_TARGET_CPM
      const nextRecover =
        updates.recoverKeys ?? adaptiveState?.settings.recoverKeys ?? false

      await Promise.all([
        setSetting("adaptive_targetCpm", String(nextTarget)),
        setSetting("adaptive_recoverKeys", String(nextRecover)),
      ])

      const nextState = await loadAdaptiveState()
      setAdaptiveState(nextState)
    },
    [adaptiveState],
  )

  const handleManualUnlock = useCallback(
    async (key: string) => {
      if (config.mode !== "adaptive") return

      await forceUnlockKey(key)
      setNewlyUnlocked(key)
      reset()
      adaptiveContinuingRef.current = false
      const nextState = await loadAdaptiveState()
      setAdaptiveState(nextState)
      startPractice(config, nextState)
    },
    [config, reset, startPractice],
  )

  const startAdaptiveNextRound = useCallback((nextState: AdaptiveState) => {
    const text = generateAdaptiveText(
      nextState.keyConfidences,
      nextState.unlockedKeys,
      nextState.focusKey,
      ADAPTIVE_WORD_COUNT,
    )
    loadText(text)
    setAdaptiveState(nextState)
    setRoundCount((count) => count + 1)
    adaptiveContinuingRef.current = false
  }, [loadText])

  const handleAdaptiveRoundAdvance = useCallback(
    async (roundLog: KeystrokeEntry[]) => {
      if (config.mode !== "adaptive") return

      const prevUnlocked = adaptiveState?.unlockedKeys ?? []
      await updateKeyStatsFromSession(roundLog)
      const nextState = await recomputeAndUnlock()
      const newKeys = nextState.unlockedKeys.filter((key) => !prevUnlocked.includes(key))
      if (newKeys.length > 0) {
        setNewlyUnlocked(newKeys[0])
      }
      startAdaptiveNextRound(nextState)
    },
    [adaptiveState, config.mode, startAdaptiveNextRound],
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isAdaptiveMode = config.mode === "adaptive"

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
        if (isAdaptiveMode && state.isStarted && !state.isFinished) {
          discardAdaptiveSession()
        }
        return
      }

      e.preventDefault()
      handleKeyDown(e)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    config.mode,
    discardAdaptiveSession,
    handleKeyDown,
    handleRestart,
    state.isFinished,
    state.isStarted,
  ])

  useEffect(() => {
    if (config.mode !== "adaptive") return

    const onBlur = () => {
      if (state.isStarted && !state.isFinished) {
        discardAdaptiveSession()
      }
    }
    const onVisibilityChange = () => {
      if (document.hidden && state.isStarted && !state.isFinished) {
        discardAdaptiveSession()
      }
    }

    window.addEventListener("blur", onBlur)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.removeEventListener("blur", onBlur)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [config.mode, discardAdaptiveSession, state.isFinished, state.isStarted])

  const persistFinishedRound = useCallback(() => {
    if (!state.isFinished || !state.isStarted) return
    if (adaptiveContinuingRef.current) return
    adaptiveContinuingRef.current = true

    const roundLog = state.keystrokeLog
    const roundMetrics =
      config.mode === "adaptive" ? adaptivePersistMetrics : metrics
    const sessionWpm = roundMetrics.wpm
    const sessionRawWpm = roundMetrics.rawWpm
    const sessionAccuracy = roundMetrics.accuracy
    const sessionDuration = roundMetrics.elapsedTime
    const sessionTotalChars = roundMetrics.totalChars
    const sessionCorrectChars = roundMetrics.correctChars
    const sessionErrorChars = roundMetrics.incorrectChars
    const sessionModeConfig =
      config.mode === "adaptive"
        ? JSON.stringify({
            ...config,
            adaptiveMeta: {
              unlockedKeyCount:
                adaptiveState?.unlockedKeys.length ?? INITIAL_UNLOCK_COUNT,
            },
          })
        : JSON.stringify(config)

    void (async () => {
      try {
        await db.sessions.add({
          timestamp: Date.now(),
          mode: config.mode,
          modeConfig: sessionModeConfig,
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
          await handleAdaptiveRoundAdvance(roundLog)
        } else {
          const keyCounts: Record<string, { hits: number; errors: number }> = {}
          for (const k of roundLog) {
            if (k.key.length !== 1 || k.key === " ") continue
            const lower = k.key.toLowerCase()
            if (!keyCounts[lower]) keyCounts[lower] = { hits: 0, errors: 0 }
            keyCounts[lower].hits++
            if (!k.correct) keyCounts[lower].errors++
          }

          await db.transaction("rw", db.keyStats, async () => {
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
        await db.transaction("rw", db.dailyGoals, async () => {
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
      } catch (error) {
        adaptiveContinuingRef.current = false
        console.error("Failed to persist completed round", error)
      }
    })()
  }, [
    adaptivePersistMetrics,
    adaptiveState,
    config,
    handleAdaptiveRoundAdvance,
    metrics,
    state.isFinished,
    state.isStarted,
    state.keystrokeLog,
  ])

  useEffect(() => {
    persistFinishedRound()
  }, [persistFinishedRound])

  useEffect(() => {
    if (!newlyUnlocked) return
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
  }, [newlyUnlocked])

  useEffect(() => {
    if (config.mode !== "adaptive" || !state.isStarted || state.isFinished) {
      return
    }

    const timeoutId = setTimeout(() => {
      discardAdaptiveSession()
    }, ADAPTIVE_INACTIVITY_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [
    config.mode,
    discardAdaptiveSession,
    state.isFinished,
    state.isStarted,
    state.keystrokeLog.length,
  ])

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
  const showResults = !isAdaptive && state.isFinished && state.isStarted

  return (
    <div className="flex flex-col items-center gap-6">
      <ModeSelector onSelect={handleConfigChange} currentConfig={config} />

      {isAdaptive && adaptiveState && (
        <KeyProgressPanel
          keyConfidences={adaptiveState.keyConfidences}
          focusKey={adaptiveState.focusKey}
          globalSummary={adaptiveState.globalSummary}
          targetCpm={adaptiveState.settings.targetCpm}
          recoverKeys={adaptiveState.settings.recoverKeys}
          totalSessions={adaptiveState.totalSessions}
          roundNumber={roundCount + 1}
          onUnlockKey={handleManualUnlock}
          onTargetChange={(targetCpm) => {
            void updateAdaptiveSettings({ targetCpm })
          }}
          onRecoverChange={(recoverKeys) => {
            void updateAdaptiveSettings({ recoverKeys })
          }}
        />
      )}

      {/* New key unlocked toast */}
      <AnimatePresence>
        {isAdaptive && newlyUnlocked && (
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
          <ResultsPanel
            key="results"
            metrics={metrics}
            onRestart={handleRestart}
            modeConfig={config}
            keystrokeLog={state.keystrokeLog}
            wordsCompleted={state.words.filter((w) => w.completed).length}
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
              metrics={isAdaptive ? adaptiveDisplayMetrics : metrics}
              isStarted={isAdaptive ? state.isStarted && !state.isFinished : state.isStarted}
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
                Round {roundCount + 1} · current session · Esc resets
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
                    nextKey={nextKey}
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
