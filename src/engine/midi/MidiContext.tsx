import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useMidiTrigger } from "./useMidiTrigger"
import { presetMelodies } from "./presets"
import { getSetting } from "@/lib/db"

type MidiContextType = ReturnType<typeof useMidiTrigger>

const MidiContext = createContext<MidiContextType | null>(null)

export function MidiProvider({ children }: { children: ReactNode }) {
  const midi = useMidiTrigger()

  useEffect(() => {
    getSetting("selectedMidi").then(async (val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as { type: "preset"; id: string } | { type: "file"; id: number }
          if (parsed.type === "preset" && presetMelodies[parsed.id]) {
            await midi.initSynth()
            await midi.loadFrames(presetMelodies[parsed.id].frames)
          }
        } catch { /* ignore */ }
      } else {
        const defaultPreset = Object.keys(presetMelodies)[0]
        if (defaultPreset) {
          await midi.initSynth()
          await midi.loadFrames(presetMelodies[defaultPreset].frames)
        }
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <MidiContext.Provider value={midi}>{children}</MidiContext.Provider>
}

export function useMidi() {
  const ctx = useContext(MidiContext)
  if (!ctx) throw new Error("useMidi must be used within MidiProvider")
  return ctx
}
