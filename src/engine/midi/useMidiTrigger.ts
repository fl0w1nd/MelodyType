import { useCallback, useEffect, useRef, useState } from "react"
import type * as Tone from "tone"
import type { MidiFrame, SynthType, MidiConfig, MelodyState } from "./types"
import { defaultMidiConfig } from "./types"
import { createSynth, ensureAudioStarted } from "./synthManager"
import { MelodyScheduler } from "./melodyScheduler"
import { getSetting, setSetting } from "@/lib/db"

const defaultMelodyState: MelodyState = {
  fuel: 0,
  maxFuel: 0,
  flowState: "idle",
  frameIndex: 0,
  totalFrames: 0,
}

export function useMidiTrigger() {
  const [config, setConfig] = useState<MidiConfig>(defaultMidiConfig)
  const [melodyState, setMelodyState] = useState<MelodyState>(defaultMelodyState)

  const framesRef = useRef<MidiFrame[]>([])
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const configRef = useRef<MidiConfig>(defaultMidiConfig)
  const schedulerRef = useRef<MelodyScheduler>(new MelodyScheduler())

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    getSetting("midiConfig").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as MidiConfig
          setConfig(parsed)
        } catch {
          /* ignore */
        }
      }
    })
  }, [])

  const updateConfig = useCallback((updates: Partial<MidiConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates }
      setSetting("midiConfig", JSON.stringify(next))
      return next
    })
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

  const loadFramesOnly = useCallback((frames: MidiFrame[]) => {
    framesRef.current = frames
  }, [])

  const loadFrames = useCallback(
    async (frames: MidiFrame[]) => {
      framesRef.current = frames
      if (frames.length > 0 && !synthRef.current) {
        await initSynth()
      }
    },
    [initSynth],
  )

  // ── Legacy test-play (used by MidiPage) ────────────────

  const testIndexRef = useRef(0)

  const triggerNextFrame = useCallback(() => {
    if (!configRef.current.isEnabled) return
    if (framesRef.current.length === 0) return

    if (!synthRef.current) {
      ensureAudioStarted()
        .then(() => {
          if (!synthRef.current) {
            synthRef.current = createSynth(
              configRef.current.synthType,
              configRef.current.volume,
            )
          }
        })
        .catch(() => {})
      return
    }

    const frame = framesRef.current[testIndexRef.current]
    if (frame && frame.notes.length > 0) {
      const noteNames = frame.notes.map((n) => n.name)
      try {
        synthRef.current.triggerAttackRelease(noteNames, "8n")
      } catch { /* audio context may not be ready yet */ }
    }

    testIndexRef.current =
      (testIndexRef.current + 1) % framesRef.current.length
  }, [])

  const getFrameInfo = useCallback(() => {
    return { current: testIndexRef.current, total: framesRef.current.length }
  }, [])

  // ── Melody Scheduler API ──────────────────────────────

  const startMelody = useCallback(
    async (targetCPM: number) => {
      if (!configRef.current.isEnabled) return
      if (framesRef.current.length === 0) return

      await ensureAudioStarted()
      if (!synthRef.current) {
        synthRef.current = createSynth(
          configRef.current.synthType,
          configRef.current.volume,
        )
      }

      schedulerRef.current.start({
        frames: framesRef.current,
        targetCPM,
        synth: synthRef.current,
        loopMode: configRef.current.loopMode,
        onStateChange: setMelodyState,
      })
    },
    [],
  )

  const feedKeystroke = useCallback((correct: boolean) => {
    if (!configRef.current.isEnabled) return
    schedulerRef.current.feed(correct)
  }, [])

  const stopMelody = useCallback(() => {
    schedulerRef.current.stop()
    setMelodyState(defaultMelodyState)
  }, [])

  const updateTargetCPM = useCallback((targetCPM: number) => {
    schedulerRef.current.updateTargetCPM(targetCPM)
  }, [])

  // ── Synth switching ───────────────────────────────────

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
    return () => {
      schedulerRef.current.stop()
      if (synthRef.current) {
        synthRef.current.dispose()
        synthRef.current = null
      }
    }
  }, [])

  return {
    config,
    updateConfig,
    loadFrames,
    loadFramesOnly,
    changeSynth,
    changeVolume,
    initSynth,
    // Legacy test-play (MidiPage)
    triggerNextFrame,
    getFrameInfo,
    currentIndex: melodyState.frameIndex,
    totalFrames: melodyState.totalFrames,
    // Melody scheduler
    melodyState,
    startMelody,
    feedKeystroke,
    stopMelody,
    updateTargetCPM,
  }
}
