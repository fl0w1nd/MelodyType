import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Network } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { BigramScore } from "@/engine/typing/adaptiveEngine"

const keyboardLayout = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
]

const ROW_OFFSET_PX = 18

function scoreToColor(score: number): string {
  if (score >= 0.85) return "rgba(34, 197, 94, 0.7)"
  if (score >= 0.65) return "rgba(234, 179, 8, 0.6)"
  if (score >= 0.4) return "rgba(249, 115, 22, 0.6)"
  return "rgba(239, 68, 68, 0.7)"
}

function scoreToKeyBg(score: number): string {
  if (score >= 0.85) return "bg-emerald-400/25 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
  if (score >= 0.65) return "bg-yellow-400/25 border-yellow-500/40 text-yellow-700 dark:text-yellow-400"
  if (score >= 0.4) return "bg-orange-400/25 border-orange-500/40 text-orange-700 dark:text-orange-400"
  return "bg-red-400/25 border-red-500/40 text-red-700 dark:text-red-400"
}

interface TransitionHeatmapProps {
  bigramScores: BigramScore[]
}

export function TransitionHeatmap({ bigramScores }: TransitionHeatmapProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const keyboardAreaRef = useRef<HTMLDivElement>(null)
  const keyElRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [keyPositions, setKeyPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  const measurePositions = useCallback(() => {
    const container = keyboardAreaRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const positions: Record<string, { x: number; y: number }> = {}
    for (const row of keyboardLayout) {
      for (const key of row) {
        const el = keyElRefs.current[key]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        positions[key] = {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        }
      }
    }
    setKeyPositions(positions)
    setSvgSize({
      width: containerRect.width,
      height: containerRect.height,
    })
  }, [])

  useLayoutEffect(() => {
    measurePositions()
  }, [measurePositions, bigramScores])

  useEffect(() => {
    window.addEventListener("resize", measurePositions)
    return () => window.removeEventListener("resize", measurePositions)
  }, [measurePositions])

  const keyAvgScores = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    for (const bg of bigramScores) {
      if (bg.samples < 3) continue
      const entry = map.get(bg.fromKey) ?? { total: 0, count: 0 }
      entry.total += bg.score
      entry.count++
      map.set(bg.fromKey, entry)
    }
    const result = new Map<string, number>()
    for (const [key, { total, count }] of map) {
      result.set(key, total / count)
    }
    return result
  }, [bigramScores])

  const selectedTransitions = useMemo(() => {
    if (!selectedKey) return []
    return bigramScores.filter(
      (bg) => bg.fromKey === selectedKey || bg.toKey === selectedKey,
    )
  }, [bigramScores, selectedKey])

  const getKeyColor = useCallback(
    (key: string) => {
      if (selectedKey === key) {
        return "bg-primary/40 border-primary/60 text-primary-foreground ring-2 ring-primary/30"
      }
      const avg = keyAvgScores.get(key)
      if (avg === undefined) {
        return "bg-secondary/40 text-muted-foreground border-transparent"
      }
      return scoreToKeyBg(avg)
    },
    [keyAvgScores, selectedKey],
  )

  const getTooltipText = useCallback(
    (key: string) => {
      const avg = keyAvgScores.get(key)
      if (avg === undefined) return `${key.toUpperCase()}: No transition data`
      const outgoing = bigramScores.filter((bg) => bg.fromKey === key && bg.samples >= 3)
      const weakest = [...outgoing].sort((a, b) => a.score - b.score)[0]
      const avgPct = (avg * 100).toFixed(0)
      if (weakest) {
        return `${key.toUpperCase()}: avg ${avgPct}%, weakest → ${weakest.toKey.toUpperCase()} (${(weakest.score * 100).toFixed(0)}%)`
      }
      return `${key.toUpperCase()}: avg score ${avgPct}%`
    },
    [bigramScores, keyAvgScores],
  )

  const handleKeyClick = useCallback(
    (key: string) => {
      setSelectedKey((prev) => (prev === key ? null : key))
    },
    [],
  )

  const setKeyRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      keyElRefs.current[key] = el
    },
    [],
  )

  const arcs = useMemo(() => {
    if (!selectedKey || Object.keys(keyPositions).length === 0) return []
    return selectedTransitions
      .filter((bg) => bg.samples >= 3)
      .map((bg) => {
        const isOutgoing = bg.fromKey === selectedKey
        const otherKey = isOutgoing ? bg.toKey : bg.fromKey
        const from = keyPositions[bg.fromKey]
        const to = keyPositions[bg.toKey]
        if (!from || !to) return null

        const dx = to.x - from.x
        const dy = to.y - from.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1) return null

        const curvature = Math.max(dist * 0.35, 25)
        const mx = (from.x + to.x) / 2
        const my = (from.y + to.y) / 2
        const nx = -dy / dist
        const ny = dx / dist
        const cx = mx + nx * curvature
        const cy = my + ny * curvature

        const color = scoreToColor(bg.score)
        const width = Math.max(1.5, Math.min(3.5, bg.samples / 10))
        const opacity = isOutgoing ? 0.85 : 0.3

        return {
          key: bg.bigram,
          otherKey,
          d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
          color,
          width,
          opacity,
          score: bg.score,
          isOutgoing,
          bg,
        }
      })
      .filter(Boolean) as Array<{
        key: string
        otherKey: string
        d: string
        color: string
        width: number
        opacity: number
        score: number
        isOutgoing: boolean
        bg: BigramScore
      }>
  }, [selectedKey, selectedTransitions, keyPositions])

  if (bigramScores.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
        className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
            <Network className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Transition Map</h3>
        </div>
        <div className="px-5 pb-6 pt-2 text-center text-sm text-muted-foreground">
          No transition data yet. Complete more adaptive sessions to see key transition scores.
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
            <Network className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Transition Map</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {selectedKey ? `${selectedKey.toUpperCase()} transitions` : "Click a key"}
        </span>
      </div>

      <div className="px-5 pb-5 pt-2">
        <div className="relative" ref={keyboardAreaRef}>
          {svgSize.width > 0 && (
            <svg
              width={svgSize.width}
              height={svgSize.height}
              className="absolute inset-0 pointer-events-none z-0"
            >
              <AnimatePresence>
                {arcs.map((arc) => (
                  <motion.path
                    key={arc.key}
                    d={arc.d}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={arc.width}
                    strokeLinecap="round"
                    opacity={arc.opacity}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: arc.opacity }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                ))}
              </AnimatePresence>
            </svg>
          )}

          <div className="flex flex-col gap-1.5 items-center relative z-10">
            {keyboardLayout.map((row, ri) => (
              <div key={ri} className="flex gap-1.5" style={{ paddingLeft: `${ri * ROW_OFFSET_PX}px` }}>
                {row.map((key, ki) => (
                  <Tooltip key={key}>
                    <TooltipTrigger>
                      <motion.div
                        ref={setKeyRef(key)}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.2 + ri * 0.06 + ki * 0.02,
                          duration: 0.3,
                          ease: [0.25, 1, 0.5, 1],
                        }}
                        onClick={() => handleKeyClick(key)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-mono font-semibold border transition-all duration-200 cursor-pointer hover:scale-110 select-none",
                          getKeyColor(key),
                        )}
                      >
                        {key.toUpperCase()}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-mono max-w-[240px]">
                      {getTooltipText(key)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedKey && arcs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Transitions from {selectedKey.toUpperCase()}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {arcs
                  .filter((a) => a.isOutgoing)
                  .sort((a, b) => a.score - b.score)
                  .map((arc) => (
                    <div
                      key={arc.key}
                      className="flex items-center gap-1 rounded-md border border-border/30 bg-secondary/20 px-2 py-1"
                    >
                      <span className="text-[10px] font-mono font-medium text-foreground">
                        → {arc.otherKey.toUpperCase()}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: arc.color }}
                      >
                        {(arc.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-4 mt-4">
          <LegendItem color="bg-emerald-400/40" label="Strong" />
          <LegendItem color="bg-yellow-400/40" label="Good" />
          <LegendItem color="bg-orange-400/40" label="Weak" />
          <LegendItem color="bg-red-400/40" label="Poor" />
        </div>
      </div>
    </motion.div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}
