import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useMidiTrigger } from "./useMidiTrigger"
import { presetMelodies } from "./presets"
import { getSetting } from "@/lib/db"

type MidiContextType = ReturnType<typeof useMidiTrigger>

const MidiContext = createContext<MidiContextType | null>(null)

export function MidiProvider({ children }: { children: ReactNode }) {
  const midi = useMidiTrigger()

  useEffect(() => {
    const defaultPreset = Object.keys(presetMelodies)[0]
    if (defaultPreset) {
      midi.loadFramesOnly(presetMelodies[defaultPreset].frames)
    }

    getSetting("selectedMidi").then(async (val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as
            | { type: "preset"; id: string }
            | { type: "file"; id: number }
          if (parsed.type === "preset" && presetMelodies[parsed.id]) {
            midi.loadFramesOnly(presetMelodies[parsed.id].frames)
          }
        } catch {
          /* ignore */
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
