/* eslint-disable react-refresh/only-export-components */

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Particle {
  id: number
  x: number
  note: string
}

let nextId = 0

export function useNoteParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const emit = useCallback((note?: string) => {
    const id = nextId++
    const x = 20 + Math.random() * 60

    setParticles((prev) => [...prev.slice(-6), { id, x, note: note ?? "♪" }])

    if (cleanupRef.current) clearTimeout(cleanupRef.current)
    cleanupRef.current = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id > id - 6))
    }, 1200)
  }, [])

  useEffect(() => {
    return () => {
      if (cleanupRef.current) clearTimeout(cleanupRef.current)
    }
  }, [])

  return { particles, emit }
}

export function NoteParticles({ particles }: { particles: Particle[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.8, y: 0, x: `${p.x}%`, scale: 0.8 }}
            animate={{
              opacity: 0,
              y: -60,
              scale: 1.2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute bottom-0 text-primary/40 font-serif text-lg select-none"
          >
            {p.note}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
