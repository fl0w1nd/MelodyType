import { useCallback, useRef, useState } from "react"
import type { MidiFrame } from "./types"

export function useMidiTrigger() {
  const [isEnabled, setIsEnabled] = useState(false)
  const framesRef = useRef<MidiFrame[]>([])
  const indexRef = useRef(0)
  const synthRef = useRef<{ triggerAttackRelease: (notes: string[], duration: string) => void } | null>(null)

  const loadFrames = useCallback((frames: MidiFrame[]) => {
    framesRef.current = frames
    indexRef.current = 0
    setIsEnabled(frames.length > 0)
  }, [])

  const triggerNextFrame = useCallback(() => {
    if (!isEnabled || framesRef.current.length === 0) return
    if (!synthRef.current) return

    const frame = framesRef.current[indexRef.current]
    if (frame) {
      const noteNames = frame.notes.map((n) => n.name)
      if (noteNames.length > 0) {
        try {
          synthRef.current.triggerAttackRelease(noteNames, "8n")
        } catch {
          // audio context not ready
        }
      }
    }

    indexRef.current = (indexRef.current + 1) % framesRef.current.length
  }, [isEnabled])

  const setSynth = useCallback(
    (synth: { triggerAttackRelease: (notes: string[], duration: string) => void } | null) => {
      synthRef.current = synth
    },
    [],
  )

  return {
    isEnabled,
    setIsEnabled,
    loadFrames,
    triggerNextFrame,
    setSynth,
    currentIndex: indexRef.current,
    totalFrames: framesRef.current.length,
  }
}
