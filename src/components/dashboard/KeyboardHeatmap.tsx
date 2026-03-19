import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"
import type { BigramScore } from "@/engine/typing/adaptiveEngine"
import { buildDashboardKeyStats } from "./dashboardUtils"

const fullKeyboardLayout = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
]

const lettersOnlyLayout = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
]

const ROW_OFFSET_PX = 18

type HeatmapTab = "false" | "frequency" | "transitions"

function transitionAccuracyToArcColor(accuracy: number): string {
  if (accuracy >= 0.99) return "rgba(34, 197, 94, 0.7)"
  if (accuracy >= 0.9) return "rgba(234, 179, 8, 0.6)"
  if (accuracy >= 0.75) return "rgba(249, 115, 22, 0.6)"
  return "rgba(239, 68, 68, 0.7)"
}

function transitionAccuracyToKeyBg(accuracy: number): string {
  if (accuracy >= 0.99) return "bg-emerald-400/25 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
  if (accuracy >= 0.9) return "bg-yellow-400/25 border-yellow-500/40 text-yellow-700 dark:text-yellow-400"
  if (accuracy >= 0.75) return "bg-orange-400/25 border-orange-500/40 text-orange-700 dark:text-orange-400"
  return "bg-red-400/25 border-red-500/40 text-red-700 dark:text-red-400"
}

function isLetterKey(key: string) {
  return key.length === 1 && key >= "a" && key <= "z"
}

interface KeyboardHeatmapProps {
  sessions: TypingSession[]
  selectedKey?: string | null
  onKeySelect?: (key: string) => void
  bigramScores?: BigramScore[]
  children?: React.ReactNode
}

export function KeyboardHeatmap({
  sessions,
  selectedKey = null,
  onKeySelect,
  bigramScores,
  children,
}: KeyboardHeatmapProps) {
  const [activeTab, setActiveTab] = useState<HeatmapTab>("false")
  const hasTransitions = bigramScores != null && bigramScores.length > 0
  const effectiveTab = activeTab === "transitions" && !hasTransitions ? "false" : activeTab
  const layout = effectiveTab === "transitions" ? lettersOnlyLayout : fullKeyboardLayout

  const keyboardAreaRef = useRef<HTMLDivElement>(null)
  const keyElRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [keyPositions, setKeyPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  const measurePositions = useCallback(() => {
    const container = keyboardAreaRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const positions: Record<string, { x: number; y: number }> = {}
    for (const [key, el] of Object.entries(keyElRefs.current)) {
      if (!el) continue
      const rect = el.getBoundingClientRect()
      positions[key] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      }
    }
    setKeyPositions(positions)
    setSvgSize({ width: containerRect.width, height: containerRect.height })
  }, [])

  useLayoutEffect(() => {
    measurePositions()
  }, [measurePositions, effectiveTab])

  useEffect(() => {
    window.addEventListener("resize", measurePositions)
    return () => window.removeEventListener("resize", measurePositions)
  }, [measurePositions])

  const setKeyRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      keyElRefs.current[key] = el
    },
    [],
  )

  // ── False / Frequency stats ─────────────────────────────────────────

  const keyStatsMap = useMemo(() => buildDashboardKeyStats(sessions), [sessions])

  const maxFalseRate = useMemo(() => {
    const values = [...keyStatsMap.values()]
      .map((entry) => entry.falseRate ?? 0)
    if (values.length === 0) return 0.01
    return Math.max(...values, 0.01)
  }, [keyStatsMap])

  const maxPresses = useMemo(() => {
    const values = [...keyStatsMap.values()]
    if (values.length === 0) return 1
    return Math.max(...values.map((entry) => entry.totalPresses), 1)
  }, [keyStatsMap])

  // ── Transition scores ────────────────────────────────────────────────

  const keyTransitionMetrics = useMemo(() => {
    if (!bigramScores) return new Map<string, { successRate: number; score: number; correct: number; attempts: number }>()
    const map = new Map<string, { correct: number; attempts: number; weightedScoreTotal: number }>()
    for (const bg of bigramScores) {
      if (bg.samples < 1) continue
      const entry = map.get(bg.fromKey) ?? { correct: 0, attempts: 0, weightedScoreTotal: 0 }
      entry.correct += bg.correctAttempts
      entry.attempts += bg.samples
      entry.weightedScoreTotal += bg.score * bg.samples
      map.set(bg.fromKey, entry)
    }
    const result = new Map<string, { successRate: number; score: number; correct: number; attempts: number }>()
    for (const [key, { correct, attempts, weightedScoreTotal }] of map) {
      result.set(key, {
        successRate: attempts > 0 ? correct / attempts : 0,
        score: attempts > 0 ? weightedScoreTotal / attempts : 0,
        correct,
        attempts,
      })
    }
    return result
  }, [bigramScores])

  const selectedTransitions = useMemo(() => {
    if (!selectedKey || !bigramScores) return []
    return bigramScores.filter(
      (bg) => bg.fromKey === selectedKey || bg.toKey === selectedKey,
    )
  }, [bigramScores, selectedKey])

  const arcs = useMemo(() => {
    if (effectiveTab !== "transitions" || !selectedKey || Object.keys(keyPositions).length === 0)
      return []
    return selectedTransitions
      .filter((bg) => bg.samples >= 1)
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

        return {
          key: bg.bigram,
          otherKey,
          d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
          color: transitionAccuracyToArcColor(bg.successRate),
          width: Math.max(1.5, Math.min(3.5, bg.samples / 10)),
          opacity: isOutgoing ? 0.85 : 0.3,
          successRate: bg.successRate,
          correctAttempts: bg.correctAttempts,
          attempts: bg.samples,
          score: bg.score,
          isOutgoing,
        }
      })
      .filter(Boolean) as Array<{
      key: string
      otherKey: string
      d: string
      color: string
      width: number
      opacity: number
      successRate: number
      correctAttempts: number
      attempts: number
      score: number
      isOutgoing: boolean
    }>
  }, [effectiveTab, selectedKey, selectedTransitions, keyPositions])

  // ── Key color ────────────────────────────────────────────────────────

  const getKeyColor = useCallback(
    (key: string) => {
      const isSelected = selectedKey === key
      const ringClass = "ring-2 ring-primary/60"

      if (effectiveTab === "transitions") {
        if (isSelected) return "bg-primary/40 border-primary/60 text-primary-foreground ring-2 ring-primary/30"
        const metrics = keyTransitionMetrics.get(key)
        if (!metrics) return "bg-secondary/40 text-muted-foreground border-transparent"
        return transitionAccuracyToKeyBg(metrics.successRate)
      }

      if (effectiveTab === "false") {
        const stat = keyStatsMap.get(key)
        if (!stat || stat.falseRate == null)
          return cn("bg-secondary/40 text-muted-foreground border-transparent", isSelected && ringClass)
        const intensity = stat.falseRate / maxFalseRate
        const bg =
          intensity > 0.6
            ? "bg-red-500/60 text-white border-red-500/30"
            : intensity > 0.3
              ? "bg-orange-400/50 text-foreground border-orange-400/30"
              : intensity > 0.1
                ? "bg-yellow-400/30 text-foreground border-yellow-400/20"
                : "bg-emerald-400/30 text-foreground border-emerald-400/20"
        return cn(bg, isSelected && ringClass)
      }

      // frequency
      const stat = keyStatsMap.get(key)
      if (!stat || stat.totalPresses === 0)
        return cn("bg-secondary/40 text-muted-foreground border-transparent", isSelected && ringClass)
      const intensity = stat.totalPresses / maxPresses
      const bg =
        intensity > 0.7
          ? "bg-primary/50 text-primary-foreground border-primary/30"
          : intensity > 0.4
            ? "bg-primary/30 text-foreground border-primary/20"
            : intensity > 0.1
              ? "bg-primary/15 text-foreground border-primary/10"
              : "bg-secondary/40 text-muted-foreground border-transparent"
      return cn(bg, isSelected && ringClass)
    },
    [effectiveTab, selectedKey, keyStatsMap, maxFalseRate, maxPresses, keyTransitionMetrics],
  )

  // ── Tooltip ──────────────────────────────────────────────────────────

  const getTooltipText = useCallback(
    (key: string) => {
      if (effectiveTab === "transitions") {
        const metrics = keyTransitionMetrics.get(key)
        if (!metrics) return `${key.toUpperCase()}: No transition data`
        const outgoing = (bigramScores ?? []).filter((bg) => bg.fromKey === key && bg.samples >= 1)
        const weakest = [...outgoing].sort((a, b) => a.successRate - b.successRate)[0]
        const avgAccuracyPct = (metrics.successRate * 100).toFixed(0)
        const avgScorePct = (metrics.score * 100).toFixed(0)
        if (weakest) {
          return `${key.toUpperCase()}: success ${avgAccuracyPct}% (${metrics.correct}/${metrics.attempts}), score ${avgScorePct}%, weakest → ${weakest.toKey.toUpperCase()} (success ${(weakest.successRate * 100).toFixed(0)}%, ${weakest.correctAttempts}/${weakest.samples}, score ${(weakest.score * 100).toFixed(0)}%)`
        }
        return `${key.toUpperCase()}: success ${avgAccuracyPct}% (${metrics.correct}/${metrics.attempts}), score ${avgScorePct}%`
      }

      if (effectiveTab === "false") {
        const stat = keyStatsMap.get(key)
        if (!stat || stat.falseRate == null) return `${key.toUpperCase()}: No false data`
        return `${key.toUpperCase()}: ${stat.occurrences} occurrences, ${stat.falsePresses} false (${(stat.falseRate * 100).toFixed(1)}%)`
      }

      const stat = keyStatsMap.get(key)
      if (!stat || stat.totalPresses === 0) return `${key.toUpperCase()}: No data`
      return `${key.toUpperCase()}: ${stat.totalPresses} total presses, ${stat.misPresses} mis-presses`
    },
    [effectiveTab, keyStatsMap, keyTransitionMetrics, bigramScores],
  )

  const handleKeyClick = useCallback(
    (key: string) => {
      if (!isLetterKey(key)) return
      onKeySelect?.(key)
    },
    [onKeySelect],
  )

  // ── Tab list ─────────────────────────────────────────────────────────

  const tabs: { id: HeatmapTab; label: string }[] = useMemo(
    () => [
      { id: "false", label: "False Rate" },
      { id: "frequency", label: "Frequency" },
      ...(hasTransitions ? [{ id: "transitions" as const, label: "Transitions" }] : []),
    ],
    [hasTransitions],
  )

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
            <Flame className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Keyboard Heatmap</h3>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-xs h-7 px-3 rounded-lg font-medium transition-all duration-200",
                effectiveTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <div
          className={cn("relative", effectiveTab === "transitions" && "pt-12 pb-2")}
          ref={keyboardAreaRef}
        >
          {effectiveTab === "transitions" && svgSize.width > 0 && (
            <svg
              width={svgSize.width}
              height={svgSize.height}
              overflow="visible"
              className="absolute inset-0 pointer-events-none z-0 overflow-visible"
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
            {layout.map((row, ri) => (
              <div key={ri} className="flex gap-1.5" style={{ paddingLeft: `${ri * ROW_OFFSET_PX}px` }}>
                {row.map((key, ki) => {
                  const letter = isLetterKey(key)
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger>
                        <motion.div
                          ref={letter ? setKeyRef(key) : undefined}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.2 + ri * 0.06 + ki * 0.02,
                            duration: 0.3,
                            ease: [0.25, 1, 0.5, 1],
                          }}
                          onClick={() => handleKeyClick(key)}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-mono font-semibold border transition-all duration-200 select-none",
                            letter ? "cursor-pointer hover:scale-110" : "cursor-default",
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
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {effectiveTab === "transitions" && selectedKey && arcs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Transitions from {selectedKey.toUpperCase()}
              </div>
              <div className="mb-2 text-[10px] text-muted-foreground/70">
                Arc color reflects hit rate. Score stays secondary so the transition read stays unambiguous.
              </div>
              <div className="flex flex-wrap gap-2">
                {arcs
                  .filter((a) => a.isOutgoing)
                  .sort((a, b) => a.successRate - b.successRate)
                  .map((arc) => (
                    <div
                      key={arc.key}
                      className="min-w-[172px] rounded-xl border border-border/40 bg-background/80 px-3 py-2 shadow-sm shadow-black/5 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-foreground">
                          <span className="text-muted-foreground">→</span>
                          <span>{arc.otherKey.toUpperCase()}</span>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-base leading-none font-mono font-bold tabular-nums"
                            style={{ color: arc.color }}
                          >
                            {(arc.successRate * 100).toFixed(0)}%
                          </div>
                          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                            Hit Rate
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="rounded-full border border-border/40 bg-secondary/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {arc.correctAttempts}/{arc.attempts}
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            Score
                          </div>
                          <div className="text-[11px] font-mono font-semibold text-foreground/80">
                            {(arc.score * 100).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-4 mt-4">
          {effectiveTab === "false" && (
            <>
              <LegendItem color="bg-emerald-400/30" label="Low" />
              <LegendItem color="bg-yellow-400/30" label="Some" />
              <LegendItem color="bg-orange-400/50" label="Many" />
              <LegendItem color="bg-red-500/60" label="High" />
            </>
          )}
          {effectiveTab === "frequency" && (
            <>
              <LegendItem color="bg-secondary/40" label="Rare" />
              <LegendItem color="bg-primary/30" label="Often" />
              <LegendItem color="bg-primary/50" label="Most" />
            </>
          )}
          {effectiveTab === "transitions" && (
            <>
              <LegendItem color="bg-emerald-400/40" label="Clean" />
              <LegendItem color="bg-yellow-400/40" label="Minor" />
              <LegendItem color="bg-orange-400/40" label="Risky" />
              <LegendItem color="bg-red-400/40" label="Error-prone" />
            </>
          )}
        </div>
      </div>

      {children && (
        <div className="border-t border-border/20 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
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
