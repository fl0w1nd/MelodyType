/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, type ReactNode } from "react"
import { useMidiTrigger } from "./useMidiTrigger"

type MidiContextType = ReturnType<typeof useMidiTrigger>

const MidiContext = createContext<MidiContextType | null>(null)

export function MidiProvider({ children }: { children: ReactNode }) {
  const midi = useMidiTrigger()

  return <MidiContext.Provider value={midi}>{children}</MidiContext.Provider>
}

export function useMidi() {
  const ctx = useContext(MidiContext)
  if (!ctx) throw new Error("useMidi must be used within MidiProvider")
  return ctx
}
