import { useCallback, useEffect, useRef, useState } from "react"
import type * as Tone from "tone"
import type { MidiFrame, SynthType, MidiConfig } from "./types"
import { defaultMidiConfig } from "./types"
import { createSynth, ensureAudioStarted } from "./synthManager"
import { getSetting, setSetting } from "@/lib/db"

export function useMidiTrigger() {
  const [config, setConfig] = useState<MidiConfig>(defaultMidiConfig)
  const [frameInfo, setFrameInfo] = useState({ current: 0, total: 0 })

  const framesRef = useRef<MidiFrame[]>([])
  const indexRef = useRef(0)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const configRef = useRef<MidiConfig>(defaultMidiConfig)
  const initingRef = useRef(false)

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
    },
    [],
  )

  const loadFramesOnly = useCallback((frames: MidiFrame[]) => {
    framesRef.current = frames
    indexRef.current = 0
    setFrameInfo({ current: 0, total: frames.length })
  }, [])

  const loadFrames = useCallback(
    async (frames: MidiFrame[]) => {
      framesRef.current = frames
      indexRef.current = 0
      setFrameInfo({ current: 0, total: frames.length })

      if (frames.length > 0 && !synthRef.current) {
        await initSynth()
      }
    },
    [initSynth],
  )

  const triggerNextFrame = useCallback(() => {
    if (!configRef.current.isEnabled) return
    if (framesRef.current.length === 0) return

    if (!synthRef.current) {
      if (initingRef.current) return
      initingRef.current = true
      ensureAudioStarted()
        .then(() => {
          if (!synthRef.current) {
            synthRef.current = createSynth(
              configRef.current.synthType,
              configRef.current.volume,
            )
          }
          initingRef.current = false
        })
        .catch(() => {
          initingRef.current = false
        })
      return
    }

    const frame = framesRef.current[indexRef.current]
    if (frame && frame.notes.length > 0) {
      const noteNames = frame.notes.map((n) => n.name)
      try {
        synthRef.current.triggerAttackRelease(noteNames, "8n")
      } catch {
        /* audio context may not be ready yet */
      }
    }

    const loopMode = configRef.current.loopMode
    if (loopMode === "random") {
      indexRef.current = Math.floor(
        Math.random() * framesRef.current.length,
      )
    } else if (loopMode === "loop") {
      indexRef.current =
        (indexRef.current + 1) % framesRef.current.length
    } else {
      if (indexRef.current < framesRef.current.length - 1) {
        indexRef.current++
      }
    }
  }, [])

  const getFrameInfo = useCallback(() => {
    return { current: indexRef.current, total: framesRef.current.length }
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
    return () => {
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
    triggerNextFrame,
    changeSynth,
    changeVolume,
    currentIndex: frameInfo.current,
    totalFrames: frameInfo.total,
    getFrameInfo,
    initSynth,
  }
}
