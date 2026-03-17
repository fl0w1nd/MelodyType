import { useCallback, useEffect, useRef, useState } from "react"
import type * as Tone from "tone"
import type { MidiFrame, SynthType, MidiConfig, MelodyState } from "./types"
import { defaultMidiConfig } from "./types"
import { createSynth, ensureAudioStarted } from "./synthManager"
import { MelodyScheduler } from "./melodyScheduler"
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

function getDefaultSelectedMidi(): SelectedMidiSource | null {
  return presetList[0] ? { type: "preset", id: presetList[0].id } : null
}

export function useMidiTrigger() {
  const [config, setConfig] = useState<MidiConfig>(defaultMidiConfig)
  const [melodyState, setMelodyState] = useState<MelodyState>(defaultMelodyState)
  const [selectedSource, setSelectedSource] = useState<SelectedMidiSource | null>(
    getDefaultSelectedMidi(),
  )
  const [testFrameInfo, setTestFrameInfo] = useState<TestPlaybackPosition>(defaultTestPlaybackPosition)

  const framesRef = useRef<MidiFrame[]>([])
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const configRef = useRef<MidiConfig>(defaultMidiConfig)
  const schedulerRef = useRef<MelodyScheduler>(new MelodyScheduler())
  const testIndexRef = useRef(0)
  const pendingStartCPMRef = useRef<number | null>(null)

  const resetTestPlayback = useCallback((totalFrames: number) => {
    testIndexRef.current = 0
    setTestFrameInfo({
      current: 0,
      total: totalFrames,
    })
  }, [])

  const stopMelody = useCallback(() => {
    schedulerRef.current.stop()
    setMelodyState(defaultMelodyState)
  }, [])

  const startMelody = useCallback(
    async (targetCPM: number) => {
      if (!configRef.current.isEnabled) return
      if (framesRef.current.length === 0) {
        pendingStartCPMRef.current = targetCPM
        return
      }

      pendingStartCPMRef.current = null

      schedulerRef.current.start({
        frames: framesRef.current,
        targetCPM,
        synth: synthRef.current,
        loopMode: configRef.current.loopMode,
        onStateChange: setMelodyState,
      })

      if (!synthRef.current) {
        try {
          await ensureAudioStarted()
          if (!synthRef.current) {
            synthRef.current = createSynth(
              configRef.current.synthType,
              configRef.current.volume,
            )
            schedulerRef.current.updateSynth(synthRef.current)
          }
        } catch { /* AudioContext may not be ready yet — synth will be created lazily */ }
      }
    },
    [],
  )

  const resetMelodySession = useCallback((targetCPM?: number, bridge = false) => {
    schedulerRef.current.resetSession(targetCPM, bridge)
  }, [])

  const applyFrames = useCallback(
    (frames: MidiFrame[]) => {
      framesRef.current = frames
      stopMelody()
      resetTestPlayback(frames.length)

      if (pendingStartCPMRef.current !== null) {
        void startMelody(pendingStartCPMRef.current)
      }
    },
    [resetTestPlayback, startMelody, stopMelody],
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
      schedulerRef.current.stop()
      setMelodyState(defaultMelodyState)
    }
  }, [])

  const initSynth = useCallback(
    async (type?: SynthType, volume?: number) => {
      await ensureAudioStarted()
      if (synthRef.current) {
        synthRef.current.dispose()
      }
      synthRef.current = createSynth(
        type ?? configRef.current.synthType,
        volume ?? configRef.current.volume,
      )
      schedulerRef.current.updateSynth(synthRef.current)
    },
    [],
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
      setSelectedSource(nextSource)
      applyFrames(preset.frames)
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
      const nextSource: SelectedMidiSource = { type: "file", id: fileId }
      setSelectedSource(nextSource)
      applyFrames(frames)
      if (options?.persist !== false) {
        await persistSelectedMidi(nextSource)
      }
      return true
    },
    [applyFrames, persistSelectedMidi],
  )

  const restoreSelectedMidi = useCallback(async () => {
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
    schedulerRef.current.feed(correct)

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
        })
        .catch(() => {})
    }
  }, [])

  const updateTargetCPM = useCallback((targetCPM: number) => {
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
        synthRef.current.dispose()
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
    startMelody,
    resetMelodySession,
    feedKeystroke,
    stopMelody,
    updateTargetCPM,
  }
}
