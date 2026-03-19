import { useCallback, useEffect, useRef, useState } from "react"
import type * as Tone from "tone"
import type { MidiFrame, SynthType, MidiConfig, MelodyState } from "./types"
import { defaultMidiConfig } from "./types"
import { createSynth, disposeSynth, ensureAudioStarted } from "./synthManager"
import { MelodyScheduler, type MelodyCarryoverState } from "./melodyScheduler"
import { parseMidiToFrames } from "./midiParser"
import { presetMelodies, presetList } from "./presets"
import { db } from "@/lib/db"
import type { SelectedMidiSource } from "@/lib/settings"
import { getAppSetting, setAppSetting } from "@/lib/settings"

const defaultMelodyState: MelodyState = {
  fuel: 0,
  maxFuel: 0,
  flowState: "idle",
  frameIndex: 0,
  totalFrames: 0,
}

type TestPlaybackPosition = {
  current: number
  total: number
}

const defaultTestPlaybackPosition: TestPlaybackPosition = {
  current: 0,
  total: 0,
}

const DEFAULT_MELODY_INTEGRITY = 100
const MELODY_INTEGRITY_BREAK_PENALTY = 20
const FLOW_EMPTY_EPSILON = 0.01

function getDefaultSelectedMidi(): SelectedMidiSource | null {
  return presetList[0] ? { type: "preset", id: presetList[0].id } : null
}

function isSameSource(
  left: SelectedMidiSource | null,
  right: SelectedMidiSource | null,
): boolean {
  return left?.type === right?.type && left?.id === right?.id
}

export function useMidiTrigger() {
  const [config, setConfig] = useState<MidiConfig>(defaultMidiConfig)
  const [melodyState, setMelodyState] = useState<MelodyState>(defaultMelodyState)
  const [melodyIntegrity, setMelodyIntegrity] = useState(DEFAULT_MELODY_INTEGRITY)
  const [selectedSource, setSelectedSource] = useState<SelectedMidiSource | null>(
    getDefaultSelectedMidi(),
  )
  const [testFrameInfo, setTestFrameInfo] = useState<TestPlaybackPosition>(defaultTestPlaybackPosition)

  const framesRef = useRef<MidiFrame[]>([])
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const configRef = useRef<MidiConfig>(defaultMidiConfig)
  const schedulerRef = useRef<MelodyScheduler>(new MelodyScheduler())
  const melodyStateRef = useRef<MelodyState>(defaultMelodyState)
  const melodyIntegrityRef = useRef(DEFAULT_MELODY_INTEGRITY)
  const testIndexRef = useRef(0)
  const selectedSourceRef = useRef<SelectedMidiSource | null>(getDefaultSelectedMidi())
  const currentTargetCPMRef = useRef<number | null>(null)
  const pendingStartCPMRef = useRef<number | null>(null)
  const synthInitPromiseRef = useRef<Promise<boolean> | null>(null)
  const pendingCarryoverStateRef = useRef<MelodyCarryoverState | null>(null)
  const trackTransitionInFlightRef = useRef(false)
  const expectedFlowResetDepthRef = useRef(0)
  const onTrackCompleteRef = useRef<
    ((carryoverState: MelodyCarryoverState | null) => void) | null
  >(null)
  const onPlaybackCompleteRef = useRef<(() => void) | null>(null)

  const beginExpectedFlowReset = useCallback(() => {
    expectedFlowResetDepthRef.current += 1
  }, [])

  const endExpectedFlowReset = useCallback(() => {
    expectedFlowResetDepthRef.current = Math.max(0, expectedFlowResetDepthRef.current - 1)
  }, [])

  const resetMelodyIntegrity = useCallback(() => {
    melodyIntegrityRef.current = DEFAULT_MELODY_INTEGRITY
    setMelodyIntegrity(DEFAULT_MELODY_INTEGRITY)
  }, [])

  const commitMelodyState = useCallback((nextState: MelodyState) => {
    const previousState = melodyStateRef.current
    const shouldPenalizeIntegrity =
      expectedFlowResetDepthRef.current === 0 &&
      previousState.maxFuel > 0 &&
      previousState.fuel > FLOW_EMPTY_EPSILON &&
      nextState.fuel <= FLOW_EMPTY_EPSILON

    melodyStateRef.current = nextState
    setMelodyState(nextState)

    if (!shouldPenalizeIntegrity) {
      return
    }

    const nextIntegrity = Math.max(
      0,
      melodyIntegrityRef.current - MELODY_INTEGRITY_BREAK_PENALTY,
    )
    melodyIntegrityRef.current = nextIntegrity
    setMelodyIntegrity(nextIntegrity)
  }, [])

  const resetTestPlayback = useCallback((totalFrames: number) => {
    testIndexRef.current = 0
    setTestFrameInfo({
      current: 0,
      total: totalFrames,
    })
  }, [])

  const stopMelody = useCallback(() => {
    pendingCarryoverStateRef.current = null
    // Some resets are expected control-flow transitions, not playback failures.
    // Guard them so Melody Integrity only tracks accidental drops to zero.
    beginExpectedFlowReset()
    try {
      schedulerRef.current.stop()
      commitMelodyState(defaultMelodyState)
    } finally {
      endExpectedFlowReset()
    }
  }, [beginExpectedFlowReset, commitMelodyState, endExpectedFlowReset])

  const startScheduler = useCallback((targetCPM: number) => {
    if (!configRef.current.isEnabled || !synthRef.current) return false
    if (framesRef.current.length === 0) return false

    currentTargetCPMRef.current = targetCPM
    pendingStartCPMRef.current = null

    schedulerRef.current.start({
      frames: framesRef.current,
      targetCPM,
      synth: synthRef.current,
      loopMode: configRef.current.loopMode,
      onStateChange: commitMelodyState,
      onTrackComplete: (carryoverState) => {
        onTrackCompleteRef.current?.(carryoverState)
      },
      onPlaybackComplete: () => {
        onPlaybackCompleteRef.current?.()
      },
    })

    return true
  }, [commitMelodyState])

  const resumePendingMelodyStart = useCallback(() => {
    const pendingTargetCPM = pendingStartCPMRef.current
    if (pendingTargetCPM == null) return false
    return startScheduler(pendingTargetCPM)
  }, [startScheduler])

  const ensureSynthReady = useCallback(async (): Promise<boolean> => {
    if (synthRef.current) return true

    if (!synthInitPromiseRef.current) {
      synthInitPromiseRef.current = (async () => {
        try {
          await ensureAudioStarted()
          if (!synthRef.current) {
            synthRef.current = createSynth(
              configRef.current.synthType,
              configRef.current.volume,
            )
            schedulerRef.current.updateSynth(synthRef.current)
          }
          return true
        } catch {
          return false
        } finally {
          synthInitPromiseRef.current = null
        }
      })()
    }

    return synthInitPromiseRef.current
  }, [])

  const startMelody = useCallback(
    async (targetCPM: number) => {
      currentTargetCPMRef.current = targetCPM
      if (!configRef.current.isEnabled) return
      pendingStartCPMRef.current = targetCPM
      if (framesRef.current.length === 0) {
        return
      }

      const isReady = await ensureSynthReady()
      if (!isReady) return
      startScheduler(targetCPM)
    },
    [ensureSynthReady, startScheduler],
  )

  const resetMelodySession = useCallback((targetCPM?: number, bridge = false) => {
    beginExpectedFlowReset()
    resetMelodyIntegrity()
    if (targetCPM != null) {
      currentTargetCPMRef.current = targetCPM
      if (pendingStartCPMRef.current != null) {
        pendingStartCPMRef.current = targetCPM
      }
    }
    try {
      schedulerRef.current.resetSession(targetCPM, bridge)
    } finally {
      endExpectedFlowReset()
    }
  }, [beginExpectedFlowReset, endExpectedFlowReset, resetMelodyIntegrity])

  const applyFrames = useCallback(
    (
      frames: MidiFrame[],
      options?: { preserveFlow?: boolean; carryoverState?: MelodyCarryoverState | null },
    ) => {
      framesRef.current = frames
      resetTestPlayback(frames.length)

      const nextTargetCPM =
        pendingStartCPMRef.current ?? currentTargetCPMRef.current
      const preserveFlow =
        options?.preserveFlow === true &&
        synthRef.current != null &&
        nextTargetCPM != null

      if (preserveFlow) {
        pendingCarryoverStateRef.current =
          options?.carryoverState ?? schedulerRef.current.captureCarryoverState()
        schedulerRef.current.switchTrack({
          frames,
          targetCPM: nextTargetCPM,
          synth: synthRef.current,
          loopMode: configRef.current.loopMode,
          carryoverState: pendingCarryoverStateRef.current,
          onStateChange: commitMelodyState,
          onTrackComplete: (carryoverState) => {
            onTrackCompleteRef.current?.(carryoverState)
          },
          onPlaybackComplete: () => {
            onPlaybackCompleteRef.current?.()
          },
        })
        pendingCarryoverStateRef.current = null
        return
      }

      stopMelody()

      if (pendingStartCPMRef.current !== null) {
        void startMelody(pendingStartCPMRef.current)
      }
    },
    [commitMelodyState, resetTestPlayback, startMelody, stopMelody],
  )

  useEffect(() => {
    configRef.current = config
  }, [config])

  const updateConfig = useCallback((updates: Partial<MidiConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))

    const next = { ...configRef.current, ...updates }
    configRef.current = next
    void setAppSetting("midiConfig", next)

    if (updates.loopMode) {
      schedulerRef.current.updateLoopMode(updates.loopMode)
    }
    if (updates.isEnabled === false) {
      stopMelody()
    }
  }, [stopMelody])

  const initSynth = useCallback(
    async (type?: SynthType, volume?: number) => {
      await ensureAudioStarted()
      if (synthRef.current) {
        disposeSynth(synthRef.current)
      }
      synthRef.current = createSynth(
        type ?? configRef.current.synthType,
        volume ?? configRef.current.volume,
      )
      schedulerRef.current.updateSynth(synthRef.current)
      resumePendingMelodyStart()
    },
    [resumePendingMelodyStart],
  )

  const loadFramesOnly = useCallback(
    (frames: MidiFrame[]) => {
      applyFrames(frames)
    },
    [applyFrames],
  )

  const loadFrames = useCallback(
    async (frames: MidiFrame[]) => {
      applyFrames(frames)
      if (frames.length > 0 && !synthRef.current) {
        await initSynth()
      }
    },
    [applyFrames, initSynth],
  )

  const persistSelectedMidi = useCallback(async (source: SelectedMidiSource | null) => {
    await setAppSetting("selectedMidi", source)
  }, [])

  const selectPreset = useCallback(
    async (presetId: string, options?: { persist?: boolean }) => {
      const preset = presetMelodies[presetId]
      if (!preset) return false

      const nextSource: SelectedMidiSource = { type: "preset", id: presetId }
      selectedSourceRef.current = nextSource
      setSelectedSource(nextSource)
      applyFrames(preset.frames, {
        preserveFlow: schedulerRef.current.getState().maxFuel > 0,
        carryoverState: pendingCarryoverStateRef.current,
      })
      if (options?.persist !== false) {
        await persistSelectedMidi(nextSource)
      }
      return true
    },
    [applyFrames, persistSelectedMidi],
  )

  const selectMidiFile = useCallback(
    async (fileId: number, options?: { persist?: boolean }) => {
      const file = await db.midiFiles.get(fileId)
      if (!file) return false

      const frames = parseMidiToFrames(file.data)
      if (frames.length === 0) return false

      const nextSource: SelectedMidiSource = { type: "file", id: fileId }
      selectedSourceRef.current = nextSource
      setSelectedSource(nextSource)
      applyFrames(frames, {
        preserveFlow: schedulerRef.current.getState().maxFuel > 0,
        carryoverState: pendingCarryoverStateRef.current,
      })
      if (options?.persist !== false) {
        await persistSelectedMidi(nextSource)
      }
      return true
    },
    [applyFrames, persistSelectedMidi],
  )

  const playRandomNextTrack = useCallback(async (carryoverState: MelodyCarryoverState | null) => {
    if (!configRef.current.isEnabled || configRef.current.loopMode !== "random") {
      return
    }

    trackTransitionInFlightRef.current = true

    try {
      const userMidiFiles = await db.midiFiles.toArray()
      const availableSources: SelectedMidiSource[] = [
        ...presetList.map((preset) => ({ type: "preset" as const, id: preset.id })),
        ...userMidiFiles
          .filter((file) => file.id != null)
          .map((file) => ({ type: "file" as const, id: file.id! })),
      ]

      if (availableSources.length === 0) {
        stopMelody()
        return
      }

      const currentSource = selectedSourceRef.current
      const candidateSources =
        currentSource && availableSources.length > 1
          ? availableSources.filter((source) => !isSameSource(source, currentSource))
          : availableSources
      const nextSource =
        candidateSources[Math.floor(Math.random() * candidateSources.length)] ??
        availableSources[0]
      const targetCPM = currentTargetCPMRef.current ?? pendingStartCPMRef.current

      if (targetCPM != null) {
        pendingStartCPMRef.current = targetCPM
      }

      pendingCarryoverStateRef.current = carryoverState

      if (nextSource.type === "preset") {
        await selectPreset(nextSource.id, { persist: false })
        return
      }

      await selectMidiFile(nextSource.id, { persist: false })
    } finally {
      trackTransitionInFlightRef.current = false
    }
  }, [selectMidiFile, selectPreset, stopMelody])

  useEffect(() => {
    onTrackCompleteRef.current = (carryoverState) => {
      void playRandomNextTrack(carryoverState)
    }
  }, [playRandomNextTrack])

  useEffect(() => {
    onPlaybackCompleteRef.current = () => {
      beginExpectedFlowReset()
      queueMicrotask(() => {
        endExpectedFlowReset()
      })
    }
  }, [beginExpectedFlowReset, endExpectedFlowReset])

  const restoreSelectedMidi = useCallback(async () => {
    // Restore settings first so practice and the MIDI page read the same source
    // and playback mode after a reload.
    const savedConfig = await getAppSetting("midiConfig")
    setConfig(savedConfig)
    configRef.current = savedConfig
    schedulerRef.current.updateLoopMode(savedConfig.loopMode)

    const savedSource = await getAppSetting("selectedMidi")
    if (savedSource?.type === "preset") {
      const restored = await selectPreset(savedSource.id, { persist: false })
      if (restored) return
    }

    if (savedSource?.type === "file") {
      const restored = await selectMidiFile(savedSource.id, { persist: false })
      if (restored) return
    }

    const fallback = getDefaultSelectedMidi()
    selectedSourceRef.current = fallback
    setSelectedSource(fallback)
    if (fallback?.type === "preset") {
      await selectPreset(fallback.id)
      return
    }

    applyFrames([])
    await persistSelectedMidi(null)
  }, [applyFrames, persistSelectedMidi, selectMidiFile, selectPreset])

  const resetMidiState = useCallback(async () => {
    stopMelody()
    resetTestPlayback(0)
    await restoreSelectedMidi()
  }, [resetTestPlayback, restoreSelectedMidi, stopMelody])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void restoreSelectedMidi()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [restoreSelectedMidi])

  useEffect(() => {
    if (config.isEnabled) return
    const timeoutId = window.setTimeout(() => {
      stopMelody()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [config.isEnabled, stopMelody])

  const playFrame = useCallback((frame: MidiFrame | undefined) => {
    if (!frame || frame.notes.length === 0 || !synthRef.current) return

    const noteNames = frame.notes.map((note) => note.name)
    try {
      synthRef.current.triggerAttackRelease(noteNames, "8n")
    } catch {
      /* audio context may not be ready yet */
    }
  }, [])

  const triggerNextFrame = useCallback(() => {
    if (!configRef.current.isEnabled) return
    if (framesRef.current.length === 0) return

    const frame = framesRef.current[testIndexRef.current]
    const currentIndex = testIndexRef.current
    const nextIndex = (currentIndex + 1) % framesRef.current.length

    const commitFrameAdvance = () => {
      testIndexRef.current = nextIndex
      setTestFrameInfo({
        current: nextIndex,
        total: framesRef.current.length,
      })
    }

    if (!synthRef.current) {
      ensureAudioStarted()
        .then(() => {
          if (!synthRef.current) {
            synthRef.current = createSynth(
              configRef.current.synthType,
              configRef.current.volume,
            )
            schedulerRef.current.updateSynth(synthRef.current)
          }
          playFrame(frame)
        })
        .catch(() => {})
      commitFrameAdvance()
      return
    }

    playFrame(frame)
    commitFrameAdvance()
  }, [playFrame])

  const getFrameInfo = useCallback(() => {
    return {
      current: testIndexRef.current,
      total: framesRef.current.length,
    }
  }, [])

  const getCurrentTestFrame = useCallback(() => {
    return framesRef.current[testIndexRef.current] ?? null
  }, [])

  const feedKeystroke = useCallback((correct: boolean) => {
    if (!configRef.current.isEnabled) return

    const resumeTargetCPM = currentTargetCPMRef.current
    const shouldAutoResume =
      resumeTargetCPM != null &&
      framesRef.current.length > 0 &&
      !schedulerRef.current.isActive &&
      (
        configRef.current.loopMode === "loop" ||
        (configRef.current.loopMode === "random" && !trackTransitionInFlightRef.current)
      )

    if (shouldAutoResume && !synthRef.current) {
      void ensureSynthReady()
        .then((isReady) => {
          if (!isReady || resumeTargetCPM == null) return
          startScheduler(resumeTargetCPM)
          schedulerRef.current.feed(correct)
        })
        .catch(() => {})
      return
    }

    if (shouldAutoResume && resumeTargetCPM != null) {
      startScheduler(resumeTargetCPM)
    }

    schedulerRef.current.feed(correct)

    if (!synthRef.current) {
      void ensureSynthReady()
        .then(() => {
          resumePendingMelodyStart()
        })
        .catch(() => {})
    } else {
      void ensureAudioStarted().catch(() => {})
    }
  }, [ensureSynthReady, resumePendingMelodyStart, startScheduler])

  const updateTargetCPM = useCallback((targetCPM: number) => {
    currentTargetCPMRef.current = targetCPM
    schedulerRef.current.updateTargetCPM(targetCPM)
  }, [])

  const changeSynth = useCallback(
    async (type: SynthType) => {
      updateConfig({ synthType: type })
      await initSynth(type)
    },
    [initSynth, updateConfig],
  )

  const changeVolume = useCallback(
    async (volume: number) => {
      updateConfig({ volume })
      await initSynth(undefined, volume)
    },
    [initSynth, updateConfig],
  )

  useEffect(() => {
    const scheduler = schedulerRef.current
    return () => {
      scheduler.stop()
      if (synthRef.current) {
        disposeSynth(synthRef.current)
        synthRef.current = null
      }
    }
  }, [])

  return {
    config,
    updateConfig,
    selectedSource,
    testFrameInfo,
    loadFrames,
    loadFramesOnly,
    selectPreset,
    selectMidiFile,
    restoreSelectedMidi,
    resetMidiState,
    changeSynth,
    changeVolume,
    initSynth,
    triggerNextFrame,
    getFrameInfo,
    getCurrentTestFrame,
    currentIndex: testFrameInfo.current,
    totalFrames: testFrameInfo.total,
    melodyState,
    melodyIntegrity,
    startMelody,
    resetMelodySession,
    feedKeystroke,
    stopMelody,
    updateTargetCPM,
  }
}
