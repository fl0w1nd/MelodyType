import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMidi } from "@/engine/midi/MidiContext"
import { useTypingEngine } from "@/engine/typing/useTypingEngine"
import { generateWordText } from "@/engine/typing/wordLists"
import { getRandomQuoteAsync, preloadQuotes } from "@/engine/typing/quoteLoader"
import { generateAdaptiveText, generateReinforcementText } from "@/engine/typing/pseudoWords"
import { computeWordAccuracyMetrics } from "@/engine/typing/accuracyMetrics"
import type {
  KeystrokeEntry,
  PracticeModeConfig,
  TypingMetrics,
  WordState,
} from "@/engine/typing/types"
import type {
  AdaptiveSettings,
  AdaptiveState,
} from "@/engine/typing/adaptiveEngine"
import {
  DEFAULT_TARGET_CPM,
  forceUnlockKey,
  loadAdaptiveState,
  resolveAdaptiveMixOptions,
} from "@/engine/typing/adaptiveEngine"
import { setAppSetting } from "@/lib/settings"
import {
  TIME_LEVELS,
  getLevelById,
  type LevelRecord,
  type TimeLevel,
} from "@/engine/typing/timeLevels"
import { persistCompletedRound } from "./practicePersistence"

const ADAPTIVE_WORD_COUNT = 30
const UNLOCK_TOAST_DURATION_MS = 2500
const ADAPTIVE_INACTIVITY_TIMEOUT_MS = 10000
const DEFAULT_QUOTE_TARGET_CPM = 200
const TIER_TARGET_CPM: Record<string, number> = {
  beginner: 150,
  intermediate: 250,
  advanced: 350,
  expert: 450,
}

function computeMetricsForWords(
  words: WordState[],
  keystrokeLog: KeystrokeEntry[],
  elapsedTime: number,
  melodyIntegrity: number,
): TypingMetrics {
  const timeInMinutes = elapsedTime > 0 ? elapsedTime / 60 : 0

  const accuracyMetrics = computeWordAccuracyMetrics(words)
  const correctChars = accuracyMetrics.correctChars
  const typedChars = accuracyMetrics.totalChars
  const wpm = timeInMinutes > 0 ? correctChars / 5 / timeInMinutes : 0
  const rawWpm = timeInMinutes > 0 ? typedChars / 5 / timeInMinutes : 0

  let consistency = 100
  if (keystrokeLog.length > 2) {
    const windowSize = 5000
    const wpmSamples: number[] = []
    for (const entry of keystrokeLog) {
      const correctInWindow = keystrokeLog.filter(
        (event) =>
          event.timestamp >= entry.timestamp - windowSize &&
          event.timestamp <= entry.timestamp &&
          event.correct,
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
    melodyIntegrity,
    accuracy: Math.round(accuracyMetrics.accuracy * 100) / 100,
    correctChars,
    incorrectChars: accuracyMetrics.incorrectChars,
    totalChars: typedChars,
    elapsedTime,
    consistency: Number.isFinite(consistency) ? Math.round(consistency) : 100,
  }
}

interface UsePracticeSessionControllerOptions {
  onCorrectInput?: () => void
}

interface TimeResultSummary {
  isNewPersonalBest: boolean
  levelRecord: LevelRecord | null
}

export function usePracticeSessionController({
  onCorrectInput,
}: UsePracticeSessionControllerOptions = {}) {
  const [config, setConfig] = useState<PracticeModeConfig>({
    mode: "adaptive",
  })
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null)
  const [roundCount, setRoundCount] = useState(0)
  const [quoteAuthor, setQuoteAuthor] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<TimeLevel | null>(null)
  const [timeLevelKey, setTimeLevelKey] = useState(0)
  const [completedMetrics, setCompletedMetrics] = useState<TypingMetrics | null>(null)
  const [timeResultSummary, setTimeResultSummary] =
    useState<TimeResultSummary | null>(null)

  const adaptiveLoaded = useRef(false)
  const adaptiveContinuingRef = useRef(false)
  const newlyUnlockedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    feedKeystroke,
    startMelody,
    resetMelodySession,
    melodyState,
    melodyIntegrity,
  } = useMidi()

  const onSuccessfulKeystroke = useCallback(() => {
    feedKeystroke(true)
    onCorrectInput?.()
  }, [feedKeystroke, onCorrectInput])

  const { state, elapsed, loadText, handleKeyDown, getMetrics, reset } =
    useTypingEngine(onSuccessfulKeystroke)

  const metrics = useMemo(
    () => ({
      ...getMetrics(),
      melodyIntegrity,
    }),
    [getMetrics, melodyIntegrity],
  )
  const adaptivePersistMetrics = useMemo(
    () => computeMetricsForWords(state.words, state.keystrokeLog, elapsed, melodyIntegrity),
    [elapsed, melodyIntegrity, state.keystrokeLog, state.words],
  )
  const adaptiveDisplayMetrics = useMemo(
    () =>
      computeMetricsForWords(
        state.words,
        state.keystrokeLog,
        state.isFinished ? 0 : elapsed,
        melodyIntegrity,
      ),
    [elapsed, melodyIntegrity, state.isFinished, state.keystrokeLog, state.words],
  )

  const getTargetCPM = useCallback(
    (nextConfig: PracticeModeConfig, nextAdaptiveState?: AdaptiveState | null) => {
      if (nextConfig.mode === "adaptive") {
        return (nextAdaptiveState ?? adaptiveState)?.settings.targetCpm ?? DEFAULT_TARGET_CPM
      }
      if (nextConfig.mode === "time" && nextConfig.levelId) {
        const level = getLevelById(nextConfig.levelId)
        return level
          ? (TIER_TARGET_CPM[level.tier] ?? DEFAULT_QUOTE_TARGET_CPM)
          : DEFAULT_QUOTE_TARGET_CPM
      }
      return DEFAULT_QUOTE_TARGET_CPM
    },
    [adaptiveState],
  )

  useEffect(() => {
    if (adaptiveLoaded.current) return
    adaptiveLoaded.current = true
    void loadAdaptiveState().then((nextState) => {
      setAdaptiveState(nextState)
      const mixOpts = resolveAdaptiveMixOptions(nextState.phase, nextState.settings)
      const text = nextState.phase === "reinforcement"
        ? generateReinforcementText(nextState.weakBigrams, ADAPTIVE_WORD_COUNT, mixOpts)
        : generateAdaptiveText(
            nextState.keyConfidences,
            nextState.unlockedKeys,
            nextState.focusKey,
            ADAPTIVE_WORD_COUNT,
            nextState.settings.recoverKeys,
            mixOpts,
          )
      loadText(text)
      void startMelody(getTargetCPM({ mode: "adaptive" }, nextState))
    })
  }, [getTargetCPM, loadText, startMelody])

  useEffect(() => {
    preloadQuotes()
  }, [])

  const generateText = useCallback(
    async (nextConfig: PracticeModeConfig, nextAdaptiveState?: AdaptiveState | null) => {
      switch (nextConfig.mode) {
        case "adaptive": {
          const resolvedAdaptiveState = nextAdaptiveState ?? adaptiveState
          if (resolvedAdaptiveState) {
            const mixOpts = resolveAdaptiveMixOptions(
              resolvedAdaptiveState.phase,
              resolvedAdaptiveState.settings,
            )
            if (resolvedAdaptiveState.phase === "reinforcement") {
              return generateReinforcementText(
                resolvedAdaptiveState.weakBigrams,
                ADAPTIVE_WORD_COUNT,
                mixOpts,
              )
            }
            return generateAdaptiveText(
              resolvedAdaptiveState.keyConfidences,
              resolvedAdaptiveState.unlockedKeys,
              resolvedAdaptiveState.focusKey,
              ADAPTIVE_WORD_COUNT,
              resolvedAdaptiveState.settings.recoverKeys,
              mixOpts,
            )
          }
          return generateWordText("easy", 25)
        }
        case "time": {
          const level = nextConfig.levelId ? getLevelById(nextConfig.levelId) : null
          if (level) {
            return generateWordText(level.difficulty, level.wordCount, {
              punctuation: level.punctuation,
              numbers: level.numbers,
            })
          }
          return generateWordText(nextConfig.difficulty ?? "easy", 200, {
            punctuation: nextConfig.punctuation,
            numbers: nextConfig.numbers,
          })
        }
        case "quote": {
          const quote = await getRandomQuoteAsync()
          setQuoteAuthor(quote.author)
          return quote.text
        }
        default:
          return generateWordText("easy", 25)
      }
    },
    [adaptiveState],
  )

  const startPractice = useCallback(
    async (nextConfig: PracticeModeConfig, nextAdaptiveState?: AdaptiveState | null) => {
      if (nextConfig.mode !== "quote") setQuoteAuthor(null)
      setCompletedMetrics(null)
      setTimeResultSummary(null)
      const text = await generateText(nextConfig, nextAdaptiveState)
      loadText(text, nextConfig.mode === "time" ? nextConfig.timeLimit : undefined)
      setRoundCount(0)
      adaptiveContinuingRef.current = false
      resetMelodySession(getTargetCPM(nextConfig, nextAdaptiveState))
    },
    [generateText, getTargetCPM, loadText, resetMelodySession],
  )

  const handleBackToLevels = useCallback(() => {
    reset()
    resetMelodySession()
    setActiveLevel(null)
    setCompletedMetrics(null)
    setTimeResultSummary(null)
    setTimeLevelKey((value) => value + 1)
  }, [reset, resetMelodySession])

  const handleSelectLevel = useCallback(
    (level: TimeLevel) => {
      setActiveLevel(level)
      const nextConfig: PracticeModeConfig = {
        mode: "time",
        timeLimit: level.timeLimit,
        difficulty: level.difficulty,
        punctuation: level.punctuation,
        numbers: level.numbers,
        levelId: level.id,
      }
      setConfig(nextConfig)
      void startPractice(nextConfig)
    },
    [startPractice],
  )

  const handleConfigChange = useCallback(
    (nextConfig: PracticeModeConfig) => {
      setConfig(nextConfig)
      setNewlyUnlocked(null)
      setActiveLevel(null)
      setCompletedMetrics(null)
      setTimeResultSummary(null)

      if (nextConfig.mode === "time") {
        reset()
        resetMelodySession()
        return
      }

      if (nextConfig.mode === "adaptive") {
        void loadAdaptiveState().then((nextState) => {
          setAdaptiveState(nextState)
          void startPractice(nextConfig, nextState)
        })
        return
      }

      void startPractice(nextConfig)
    },
    [reset, resetMelodySession, startPractice],
  )

  const handleRestart = useCallback(() => {
    reset()
    setNewlyUnlocked(null)
    setCompletedMetrics(null)
    adaptiveContinuingRef.current = false

    if (config.mode === "adaptive") {
      void loadAdaptiveState().then((nextState) => {
        setAdaptiveState(nextState)
        void startPractice(config, nextState)
      })
      return
    }

    void startPractice(config)
  }, [config, reset, startPractice])

  const discardAdaptiveSession = useCallback(() => {
    if (config.mode !== "adaptive" || state.isFinished) return

    reset()
    setNewlyUnlocked(null)
    setCompletedMetrics(null)
    adaptiveContinuingRef.current = false

    void loadAdaptiveState().then((nextState) => {
      setAdaptiveState(nextState)
      void startPractice(config, nextState)
    })
  }, [config, reset, startPractice, state.isFinished])

  const handleNextLevel = useCallback(() => {
    if (!activeLevel) return
    const index = TIME_LEVELS.findIndex((level) => level.id === activeLevel.id)
    const nextLevel =
      index >= 0 && index < TIME_LEVELS.length - 1 ? TIME_LEVELS[index + 1] : null
    if (nextLevel) {
      handleSelectLevel(nextLevel)
      return
    }
    handleBackToLevels()
  }, [activeLevel, handleBackToLevels, handleSelectLevel])

  const updateAdaptiveSettings = useCallback(
    async (updates: Partial<AdaptiveSettings>) => {
      const nextTarget =
        updates.targetCpm ?? adaptiveState?.settings.targetCpm ?? DEFAULT_TARGET_CPM
      const nextRecover =
        updates.recoverKeys ?? adaptiveState?.settings.recoverKeys ?? false
      const nextNumbers =
        updates.includeNumbers ?? adaptiveState?.settings.includeNumbers ?? false
      const nextPunctuation =
        updates.includePunctuation ?? adaptiveState?.settings.includePunctuation ?? false
      const nextSpecialCharacters =
        updates.includeSpecialCharacters
        ?? adaptiveState?.settings.includeSpecialCharacters
        ?? false

      await Promise.all([
        setAppSetting("adaptiveTargetCpm", nextTarget),
        setAppSetting("adaptiveRecoverKeys", nextRecover),
        setAppSetting("adaptiveIncludeNumbers", nextNumbers),
        setAppSetting("adaptiveIncludePunctuation", nextPunctuation),
        setAppSetting("adaptiveIncludeSpecialCharacters", nextSpecialCharacters),
      ])

      reset()
      adaptiveContinuingRef.current = false
      const nextState = await loadAdaptiveState()
      setAdaptiveState(nextState)
      await startPractice(config, nextState)
    },
    [adaptiveState, config, reset, startPractice],
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
      await startPractice(config, nextState)
    },
    [config, reset, startPractice],
  )

  const startAdaptiveNextRound = useCallback(
    (nextAdaptiveState: AdaptiveState) => {
      const mixOpts = resolveAdaptiveMixOptions(
        nextAdaptiveState.phase,
        nextAdaptiveState.settings,
      )
      const text = nextAdaptiveState.phase === "reinforcement"
        ? generateReinforcementText(nextAdaptiveState.weakBigrams, ADAPTIVE_WORD_COUNT, mixOpts)
        : generateAdaptiveText(
            nextAdaptiveState.keyConfidences,
            nextAdaptiveState.unlockedKeys,
            nextAdaptiveState.focusKey,
            ADAPTIVE_WORD_COUNT,
            nextAdaptiveState.settings.recoverKeys,
            mixOpts,
          )
      loadText(text)
      setAdaptiveState(nextAdaptiveState)
      setRoundCount((value) => value + 1)
      adaptiveContinuingRef.current = false
      // Adaptive mode chains rounds into one continuous music session: we
      // refresh the text while asking MIDI to bridge the current playback state.
      resetMelodySession(getTargetCPM(config, nextAdaptiveState), true)
    },
    [config, getTargetCPM, loadText, resetMelodySession],
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isAdaptiveMode = config.mode === "adaptive"
      const isTimeLevelSelect = config.mode === "time" && !activeLevel
      if (isTimeLevelSelect) return

      if (state.isFinished && !isAdaptiveMode) {
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault()
          handleRestart()
        }
        return
      }

      if (event.key === "Tab") {
        event.preventDefault()
        handleRestart()
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        if (isAdaptiveMode && state.isStarted && !state.isFinished) {
          discardAdaptiveSession()
        }
        if (config.mode === "time" && activeLevel) {
          handleBackToLevels()
        }
        return
      }

      event.preventDefault()
      handleKeyDown(event)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    activeLevel,
    config.mode,
    discardAdaptiveSession,
    handleBackToLevels,
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

  useEffect(() => {
    if (!state.isFinished || !state.isStarted) return
    if (adaptiveContinuingRef.current) return

    adaptiveContinuingRef.current = true

    const roundMetrics =
      config.mode === "adaptive" ? adaptivePersistMetrics : metrics
    queueMicrotask(() => {
      setCompletedMetrics((previous) => previous ?? roundMetrics)
    })

    void (async () => {
      try {
        const expectedChars: string[] = []
        for (let wi = 0; wi < state.words.length; wi++) {
          if (wi > 0) expectedChars.push(" ")
          for (const ch of state.words[wi].chars) {
            expectedChars.push(ch.char)
          }
        }
        const expectedText = expectedChars.join("")

        const result = await persistCompletedRound({
          config,
          adaptiveState,
          metrics: roundMetrics,
          keystrokeLog: state.keystrokeLog,
          expectedText,
        })

        if (config.mode === "time") {
          setTimeResultSummary({
            isNewPersonalBest: result.isNewPersonalBest,
            levelRecord: result.timeLevelRecord,
          })
        }

        if (config.mode === "adaptive" && result.nextAdaptiveState) {
          if (result.newlyUnlocked) {
            setNewlyUnlocked(result.newlyUnlocked)
          }
          startAdaptiveNextRound(result.nextAdaptiveState)
        }
      } catch (error) {
        adaptiveContinuingRef.current = false
        console.error("Failed to persist completed round", error)
      }
    })()
  }, [
    adaptivePersistMetrics,
    adaptiveState,
    config,
    metrics,
    startAdaptiveNextRound,
    state.isFinished,
    state.isStarted,
    state.keystrokeLog,
    state.words,
  ])

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
    if (state.isFinished || state.words.length === 0) return undefined
    const word = state.words[state.currentWordIndex]
    if (!word) return undefined
    if (state.currentCharIndex < word.chars.length) {
      return word.chars[state.currentCharIndex].char
    }
    return " "
  }, [state])

  const isAdaptive = config.mode === "adaptive"
  const isTimeLevelSelect = config.mode === "time" && !activeLevel
  const showResults =
    !isAdaptive && !isTimeLevelSelect && state.isFinished && state.isStarted

  return {
    config,
    state,
    metrics,
    completedMetrics,
    adaptiveState,
    adaptiveDisplayMetrics,
    melodyState,
    activeLevel,
    quoteAuthor,
    newlyUnlocked,
    roundCount,
    timeResultSummary,
    timeLevelKey,
    nextKey,
    isAdaptive,
    isTimeLevelSelect,
    showResults,
    actions: {
      handleConfigChange,
      handleSelectLevel,
      handleBackToLevels,
      handleRestart,
      handleNextLevel,
      handleManualUnlock,
      updateAdaptiveSettings,
    },
  }
}
