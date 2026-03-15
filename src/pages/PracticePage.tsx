import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
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
  updateKeyStatsFromSession,
  saveUnlockedKeys,
  shouldUnlockNextKey,
  getNextKeyToUnlock,
  getFocusKey,
} from "@/engine/typing/adaptiveEngine"
import { db } from "@/lib/db"

export default function PracticePage() {
  const [config, setConfig] = useState<PracticeModeConfig>({
    mode: "adaptive",
  })
  const [showKeyboard, setShowKeyboard] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null)
  const adaptiveLoaded = useRef(false)

  const { triggerNextFrame } = useMidi()
  const { particles, emit: emitNote } = useNoteParticles()
  const onKeystroke = useCallback(() => {
    triggerNextFrame()
    emitNote()
  }, [triggerNextFrame, emitNote])
  const { state, elapsed, loadText, handleKeyDown, getMetrics, reset } =
    useTypingEngine(onKeystroke)

  const metrics = useMemo(() => getMetrics(), [getMetrics, elapsed, state])

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
          30,
        )
        loadText(text)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
              30,
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
    if (config.mode === "adaptive") {
      loadAdaptiveState().then((s) => {
        setAdaptiveState(s)
        startPractice(config, s)
      })
    } else {
      startPractice(config)
    }
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

      if (e.key === "Tab" || e.key === "Escape") {
        e.preventDefault()
        if (e.key === "Tab") handleRestart()
        return
      }

      e.preventDefault()
      handleKeyDown(e)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleKeyDown, handleRestart, state.isFinished])

  useEffect(() => {
    if (!state.isFinished || !state.isStarted) return

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

    if (config.mode === "adaptive") {
      updateKeyStatsFromSession(state.keystrokeLog).then(() => {
        loadAdaptiveState().then((s) => {
          const prevUnlocked = adaptiveState?.unlockedKeys ?? []
          const newKeys = s.unlockedKeys.filter(
            (k) => !prevUnlocked.includes(k),
          )

          if (shouldUnlockNextKey(s.keyConfidences.filter((k) => k.unlocked))) {
            const nextKey = getNextKeyToUnlock(s.unlockedKeys)
            if (nextKey && !s.unlockedKeys.includes(nextKey)) {
              s.unlockedKeys = [...s.unlockedKeys, nextKey]
              const kc = s.keyConfidences.find((k) => k.key === nextKey)
              if (kc) kc.unlocked = true
              saveUnlockedKeys(s.unlockedKeys)
              setNewlyUnlocked(nextKey)
            } else if (newKeys.length > 0) {
              setNewlyUnlocked(newKeys[0])
            }
          } else if (newKeys.length > 0) {
            setNewlyUnlocked(newKeys[0])
          }

          const focusKey = getFocusKey(s.keyConfidences)
          for (const kc of s.keyConfidences) {
            kc.focused = kc.key === focusKey
          }
          s.focusKey = focusKey

          setAdaptiveState(s)
        })
      })
    } else {
      const keyCounts: Record<string, { hits: number; errors: number }> = {}
      for (const k of state.keystrokeLog) {
        if (k.key.length !== 1) continue
        const lower = k.key.toLowerCase()
        if (!keyCounts[lower]) keyCounts[lower] = { hits: 0, errors: 0 }
        keyCounts[lower].hits++
        if (!k.correct) keyCounts[lower].errors++
      }

      db.transaction("rw", db.keyStats, async () => {
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
    db.transaction("rw", db.dailyGoals, async () => {
      const existing = await db.dailyGoals.where("date").equals(today).first()
      const sessionMinutes = m.elapsedTime / 60
      if (existing) {
        await db.dailyGoals.update(existing.id!, {
          completedMinutes: existing.completedMinutes + sessionMinutes,
          sessionsCount: existing.sessionsCount + 1,
          bestWpm: Math.max(existing.bestWpm, m.wpm),
          avgAccuracy:
            (existing.avgAccuracy * existing.sessionsCount + m.accuracy) /
            (existing.sessionsCount + 1),
        })
      } else {
        await db.dailyGoals.add({
          date: today,
          targetMinutes: 30,
          completedMinutes: sessionMinutes,
          sessionsCount: 1,
          bestWpm: m.wpm,
          avgAccuracy: m.accuracy,
        })
      }
    })
  }, [state.isFinished]) // eslint-disable-line react-hooks/exhaustive-deps

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

      {isAdaptive && adaptiveState && !state.isFinished && (
        <KeyProgressPanel
          keyConfidences={adaptiveState.keyConfidences}
          focusKey={adaptiveState.focusKey}
        />
      )}

      <AnimatePresence mode="wait">
        {state.isFinished && state.isStarted ? (
          isAdaptive && adaptiveState ? (
            <AdaptiveResultsPanel
              key="adaptive-results"
              metrics={metrics}
              keystrokeLog={state.keystrokeLog}
              keyConfidences={adaptiveState.keyConfidences}
              newlyUnlocked={newlyUnlocked}
              onRestart={handleRestart}
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
