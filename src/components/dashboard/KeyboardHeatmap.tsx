import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"
import type { BigramScore } from "@/engine/typing/adaptiveEngine"
import {
  aggregateDashboardPhysicalKeyStats,
  buildDashboardKeyStats,
  type DashboardKeyStats,
  type DashboardPhysicalKeyStats,
} from "./dashboardUtils"
import {
  PRINTABLE_KEY_ROWS,
  getLogicalCandidatesForPhysicalKey,
  getPhysicalKeyDisplay,
  getPhysicalKeyForLogicalChar,
  isAmbiguousPhysicalKey,
} from "@/lib/keyboardLayout"

const ROW_OFFSET_PX = 18

export type HeatmapTab = "false" | "frequency" | "transitions"

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

interface KeyboardHeatmapProps {
  sessions: TypingSession[]
  selectedLogicalKey?: string | null
  selectedPhysicalKey?: string | null
  onLogicalKeySelect?: (key: string) => void
  activeTab?: HeatmapTab
  onActiveTabChange?: (tab: HeatmapTab) => void
  bigramScores?: BigramScore[]
  keyStatsMap?: Map<string, DashboardKeyStats>
  children?: React.ReactNode
}

export function KeyboardHeatmap({
  sessions,
  selectedLogicalKey = null,
  selectedPhysicalKey = null,
  onLogicalKeySelect,
  activeTab: activeTabProp,
  onActiveTabChange,
  bigramScores,
  keyStatsMap: keyStatsMapProp,
  children,
}: KeyboardHeatmapProps) {
  const { t } = useTranslation()
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState<HeatmapTab>("false")
  const [pendingPhysicalKey, setPendingPhysicalKey] = useState<string | null>(null)
  const hasTransitions = bigramScores != null && bigramScores.length > 0
  const activeTab = activeTabProp ?? uncontrolledActiveTab
  const effectiveTab = activeTab === "transitions" && !hasTransitions ? "false" : activeTab
  const layout = PRINTABLE_KEY_ROWS
  const selectedTransitionPhysicalKey =
    selectedLogicalKey != null
      ? getPhysicalKeyForLogicalChar(selectedLogicalKey)?.physicalKey ?? selectedLogicalKey
      : null
  const activeSelectedPhysicalKey =
    effectiveTab === "transitions"
      ? selectedTransitionPhysicalKey
      : selectedPhysicalKey

  const keyboardAreaRef = useRef<HTMLDivElement>(null)
  const keyElRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [keyPositions, setKeyPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    const container = keyboardAreaRef.current
    if (!container) return

    const debouncedMeasure = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(measurePositions, 100)
    }

    const observer = new ResizeObserver(debouncedMeasure)
    observer.observe(container)

    window.addEventListener("resize", debouncedMeasure)
    return () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      observer.disconnect()
      window.removeEventListener("resize", debouncedMeasure)
    }
  }, [measurePositions, effectiveTab])

  const setKeyRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      keyElRefs.current[key] = el
    },
    [],
  )

  // ── False / Frequency stats ─────────────────────────────────────────

  const keyStatsMapLocal = useMemo(
    () => keyStatsMapProp ?? buildDashboardKeyStats(sessions),
    [keyStatsMapProp, sessions],
  )
  const keyStatsMap = keyStatsMapLocal
  const physicalKeyStatsMap = useMemo(() => {
    const map = new Map<string, DashboardPhysicalKeyStats>()
    for (const physicalKey of layout.flat()) {
      map.set(physicalKey, aggregateDashboardPhysicalKeyStats(keyStatsMap, physicalKey))
    }
    return map
  }, [keyStatsMap, layout])

  const maxFalseRate = useMemo(() => {
    const values = [...physicalKeyStatsMap.values()]
      .map((entry) => entry.falseRate ?? 0)
    if (values.length === 0) return 0.01
    return Math.max(...values, 0.01)
  }, [physicalKeyStatsMap])

  const maxLogicalFalseRate = useMemo(() => {
    const values = [...keyStatsMap.values()]
      .map((entry) => entry.falseRate ?? 0)
    if (values.length === 0) return 0.01
    return Math.max(...values, 0.01)
  }, [keyStatsMap])

  const maxPresses = useMemo(() => {
    const values = [...physicalKeyStatsMap.values()]
    if (values.length === 0) return 1
    return Math.max(...values.map((entry) => entry.totalPresses), 1)
  }, [physicalKeyStatsMap])

  const maxLogicalPresses = useMemo(() => {
    const values = [...keyStatsMap.values()]
    if (values.length === 0) return 1
    return Math.max(...values.map((entry) => entry.totalPresses), 1)
  }, [keyStatsMap])

  // ── Transition scores ────────────────────────────────────────────────

  const keyTransitionMetrics = useMemo(() => {
    if (!bigramScores) {
      return new Map<string, { successRate: number; score: number; correct: number; attempts: number }>()
    }
    const map = new Map<string, { correct: number; attempts: number; weightedScoreTotal: number }>()
    for (const bg of bigramScores) {
      if (bg.samples < 1) continue
      const physicalKey = getPhysicalKeyForLogicalChar(bg.fromKey)?.physicalKey ?? bg.fromKey
      const entry = map.get(physicalKey) ?? { correct: 0, attempts: 0, weightedScoreTotal: 0 }
      entry.correct += bg.correctAttempts
      entry.attempts += bg.samples
      entry.weightedScoreTotal += bg.score * bg.samples
      map.set(physicalKey, entry)
    }
    const result = new Map<string, { successRate: number; score: number; correct: number; attempts: number }>()
    for (const [physicalKey, { correct, attempts, weightedScoreTotal }] of map) {
      result.set(physicalKey, {
        successRate: attempts > 0 ? correct / attempts : 0,
        score: attempts > 0 ? weightedScoreTotal / attempts : 0,
        correct,
        attempts,
      })
    }
    return result
  }, [bigramScores])

  const selectedTransitions = useMemo(() => {
    if (!selectedLogicalKey || !bigramScores) return []
    return bigramScores.filter(
      (bg) => bg.fromKey === selectedLogicalKey || bg.toKey === selectedLogicalKey,
    )
  }, [bigramScores, selectedLogicalKey])

  const arcs = useMemo(() => {
    if (effectiveTab !== "transitions" || !selectedLogicalKey || Object.keys(keyPositions).length === 0)
      return []
    return selectedTransitions
      .filter((bg) => bg.samples >= 1)
      .map((bg) => {
        const isOutgoing = bg.fromKey === selectedLogicalKey
        const otherKey = isOutgoing ? bg.toKey : bg.fromKey
        const fromPhysical = getPhysicalKeyForLogicalChar(bg.fromKey)?.physicalKey ?? bg.fromKey
        const toPhysical = getPhysicalKeyForLogicalChar(bg.toKey)?.physicalKey ?? bg.toKey
        const from = keyPositions[fromPhysical]
        const to = keyPositions[toPhysical]
        if (!from || !to) return null

        if (fromPhysical === toPhysical) {
          const loopWidth = 11
          const loopLift = 24
          return {
            key: bg.bigram,
            otherKey,
            d: `M ${from.x - loopWidth} ${from.y - 6} C ${from.x - 18} ${from.y - loopLift}, ${from.x + 18} ${from.y - loopLift}, ${from.x + loopWidth} ${from.y - 6}`,
            color: transitionAccuracyToArcColor(bg.successRate),
            width: Math.max(1.5, Math.min(3.5, bg.samples / 10)),
            opacity: isOutgoing ? 0.85 : 0.3,
            successRate: bg.successRate,
            correctAttempts: bg.correctAttempts,
            attempts: bg.samples,
            score: bg.score,
            isOutgoing,
          }
        }

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
  }, [effectiveTab, selectedLogicalKey, selectedTransitions, keyPositions])

  // ── Key color ────────────────────────────────────────────────────────

  const getKeyColor = useCallback(
    (physicalKey: string) => {
      const selectionMatch = activeSelectedPhysicalKey === physicalKey
      const ringClass = "ring-2 ring-primary/60"

      if (effectiveTab === "transitions") {
        if (selectionMatch) return "bg-primary/40 border-primary/60 text-primary-foreground ring-2 ring-primary/30"
        const metrics = keyTransitionMetrics.get(physicalKey)
        if (!metrics) return "bg-secondary/40 text-muted-foreground border-transparent"
        return transitionAccuracyToKeyBg(metrics.successRate)
      }

      if (effectiveTab === "false") {
        const stat = physicalKeyStatsMap.get(physicalKey)
        if (!stat || stat.falseRate == null)
          return cn("bg-secondary/40 text-muted-foreground border-transparent", selectionMatch && ringClass)
        const intensity = stat.falseRate / maxFalseRate
        const bg =
          intensity > 0.6
            ? "bg-red-500/60 text-white border-red-500/30"
            : intensity > 0.3
              ? "bg-orange-400/50 text-foreground border-orange-400/30"
              : intensity > 0.1
                ? "bg-yellow-400/30 text-foreground border-yellow-400/20"
                : "bg-emerald-400/30 text-foreground border-emerald-400/20"
        return cn(bg, selectionMatch && ringClass)
      }

      // frequency
      const stat = physicalKeyStatsMap.get(physicalKey)
      if (!stat || stat.totalPresses === 0)
        return cn("bg-secondary/40 text-muted-foreground border-transparent", selectionMatch && ringClass)
      const intensity = stat.totalPresses / maxPresses
      const bg =
        intensity > 0.7
          ? "bg-primary/50 text-primary-foreground border-primary/30"
          : intensity > 0.4
            ? "bg-primary/30 text-foreground border-primary/20"
            : intensity > 0.1
              ? "bg-primary/15 text-foreground border-primary/10"
              : "bg-secondary/40 text-muted-foreground border-transparent"
      return cn(bg, selectionMatch && ringClass)
    },
    [
      activeSelectedPhysicalKey,
      effectiveTab,
      keyTransitionMetrics,
      maxFalseRate,
      maxPresses,
      physicalKeyStatsMap,
    ],
  )

  const getLogicalCandidateColor = useCallback(
    (logicalKey: string) => {
      const isSelected = logicalKey === selectedLogicalKey
      const selectedClass = "ring-2 ring-primary/70 border-primary/60"

      if (effectiveTab === "transitions") {
        const attempts = (bigramScores ?? [])
          .filter((bg) => bg.fromKey === logicalKey && bg.samples >= 1)
        const totalAttempts = attempts.reduce((sum, bg) => sum + bg.samples, 0)
        const totalCorrect = attempts.reduce((sum, bg) => sum + bg.correctAttempts, 0)
        if (totalAttempts === 0) {
          return cn(
            "bg-secondary/40 text-muted-foreground border-border/40",
            isSelected && selectedClass,
          )
        }
        return cn(
          transitionAccuracyToKeyBg(totalCorrect / totalAttempts),
          isSelected && selectedClass,
        )
      }

      if (effectiveTab === "false") {
        const stat = keyStatsMap.get(logicalKey)
        if (!stat || stat.falseRate == null) {
          return cn(
            "bg-secondary/40 text-muted-foreground border-border/40",
            isSelected && selectedClass,
          )
        }

        const intensity = stat.falseRate / maxLogicalFalseRate
        const bg =
          intensity > 0.6
            ? "bg-red-500/60 text-white border-red-500/30"
            : intensity > 0.3
              ? "bg-orange-400/50 text-foreground border-orange-400/30"
              : intensity > 0.1
                ? "bg-yellow-400/30 text-foreground border-yellow-400/20"
                : "bg-emerald-400/30 text-foreground border-emerald-400/20"
        return cn(bg, isSelected && selectedClass)
      }

      const stat = keyStatsMap.get(logicalKey)
      if (!stat || stat.totalPresses === 0) {
        return cn(
          "bg-secondary/40 text-muted-foreground border-border/40",
          isSelected && selectedClass,
        )
      }

      const intensity = stat.totalPresses / maxLogicalPresses
      const bg =
        intensity > 0.7
          ? "bg-primary/50 text-primary-foreground border-primary/30"
          : intensity > 0.4
            ? "bg-primary/30 text-foreground border-primary/20"
            : intensity > 0.1
              ? "bg-primary/15 text-foreground border-primary/10"
              : "bg-secondary/40 text-muted-foreground border-transparent"
      return cn(bg, isSelected && selectedClass)
    },
    [
      bigramScores,
      effectiveTab,
      keyStatsMap,
      maxLogicalFalseRate,
      maxLogicalPresses,
      selectedLogicalKey,
    ],
  )

  // ── Tooltip ──────────────────────────────────────────────────────────

  const getTooltipContent = useCallback(
    (physicalKey: string) => {
      const display = getPhysicalKeyDisplay(physicalKey)
      const baseLabel = display
        ? /[a-z]/.test(display.base)
          ? display.base.toUpperCase()
          : display.base
        : physicalKey.toUpperCase()

      if (effectiveTab === "transitions") {
        const metrics = keyTransitionMetrics.get(physicalKey)
        const candidates = getLogicalCandidatesForPhysicalKey(physicalKey)
        if (!metrics) return <span>{`${baseLabel}: No transition data`}</span>

        return (
          <div className="space-y-1">
            <div className="font-semibold">{baseLabel}</div>
            <div>
              {`success ${(metrics.successRate * 100).toFixed(0)}% (${metrics.correct}/${metrics.attempts})`}
            </div>
            <div>{`score ${(metrics.score * 100).toFixed(0)}%`}</div>
            {candidates.length > 1 && (
              <div className="pt-1 text-[10px] opacity-80">
                {candidates.map((candidate) => {
                  const candidateScores = (bigramScores ?? []).filter(
                    (bg) => bg.fromKey === candidate && bg.samples >= 1,
                  )
                  const attempts = candidateScores.reduce((sum, bg) => sum + bg.samples, 0)
                  const correct = candidateScores.reduce((sum, bg) => sum + bg.correctAttempts, 0)
                  return (
                    <div key={candidate}>
                      {`${candidate.toUpperCase()}: ${attempts > 0 ? `${Math.round((correct / attempts) * 100)}% (${correct}/${attempts})` : "No data"}`}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      }

      const stat = physicalKeyStatsMap.get(physicalKey)
      if (effectiveTab === "false") {
        if (!stat || stat.falseRate == null) return <span>{`${baseLabel}: No false data`}</span>
        return (
          <div className="space-y-1">
            <div className="font-semibold">{baseLabel}</div>
            <div>
              {`${stat.occurrences} occurrences, ${stat.falsePresses} false (${(stat.falseRate * 100).toFixed(1)}%)`}
            </div>
            {stat.breakdown.length > 1 && (
              <div className="pt-1 text-[10px] opacity-80">
                {stat.breakdown.map((entry) => (
                  <div key={entry.key}>
                    {`${entry.key.toUpperCase()}: ${entry.occurrences} / ${entry.falsePresses} false`}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      if (!stat || stat.totalPresses === 0) return <span>{`${baseLabel}: No data`}</span>
      return (
        <div className="space-y-1">
          <div className="font-semibold">{baseLabel}</div>
          <div>{`${stat.totalPresses} total presses, ${stat.misPresses} mis-presses`}</div>
          {stat.breakdown.length > 1 && (
            <div className="pt-1 text-[10px] opacity-80">
              {stat.breakdown.map((entry) => (
                <div key={entry.key}>
                  {`${entry.key.toUpperCase()}: ${entry.totalPresses} presses`}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    [bigramScores, effectiveTab, keyTransitionMetrics, physicalKeyStatsMap],
  )

  const handleKeyClick = useCallback(
    (physicalKey: string) => {
      const candidates = getLogicalCandidatesForPhysicalKey(physicalKey)
      if (candidates.length === 0 || !onLogicalKeySelect) return
      if (isAmbiguousPhysicalKey(physicalKey)) {
        setPendingPhysicalKey(physicalKey)
        return
      }
      setPendingPhysicalKey(null)
      onLogicalKeySelect(candidates[0])
    },
    [onLogicalKeySelect],
  )

  const handleLogicalCandidateSelect = useCallback(
    (logicalKey: string) => {
      setPendingPhysicalKey(null)
      onLogicalKeySelect?.(logicalKey)
    },
    [onLogicalKeySelect],
  )

  const visiblePendingPhysicalKey = pendingPhysicalKey

  useEffect(() => {
    if (!visiblePendingPhysicalKey) return

    const onPointerDown = (event: MouseEvent) => {
      if (!keyboardAreaRef.current?.contains(event.target as Node)) {
        setPendingPhysicalKey(null)
      }
    }

    window.addEventListener("mousedown", onPointerDown)
    return () => window.removeEventListener("mousedown", onPointerDown)
  }, [visiblePendingPhysicalKey])

  const pendingPickerPosition = visiblePendingPhysicalKey
    ? keyPositions[visiblePendingPhysicalKey]
    : null

  // ── Tab list ─────────────────────────────────────────────────────────

  const tabs: { id: HeatmapTab; label: string }[] = useMemo(
    () => [
      { id: "false", label: t("keyboardHeatmap.tabs.falseRate") },
      { id: "frequency", label: t("keyboardHeatmap.tabs.frequency") },
      ...(hasTransitions ? [{ id: "transitions" as const, label: t("keyboardHeatmap.tabs.transitions") }] : []),
    ],
    [hasTransitions, t],
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
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{t("keyboardHeatmap.title")}</h3>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setPendingPhysicalKey(null)
                if (onActiveTabChange) {
                  onActiveTabChange(tab.id)
                } else {
                  setUncontrolledActiveTab(tab.id)
                }
              }}
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
        <div className="overflow-x-auto pb-1">
          <div
            className={cn(
              "relative mx-auto w-max min-w-full",
              effectiveTab === "transitions" && "pt-12 pb-2",
            )}
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

            <AnimatePresence>
              {visiblePendingPhysicalKey && pendingPickerPosition && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  className="absolute z-20 min-w-[112px] rounded-xl border border-border/60 bg-background/95 p-2 shadow-xl backdrop-blur"
                  style={{
                    left: pendingPickerPosition.x,
                    top: pendingPickerPosition.y - 54,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="mb-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t("keyboardHeatmap.pickLogicalKey")}
                  </div>
                  <div className="flex gap-1">
                    {getLogicalCandidatesForPhysicalKey(visiblePendingPhysicalKey).map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        onClick={() => handleLogicalCandidateSelect(candidate)}
                        className={cn(
                          "flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-sm font-mono font-semibold transition-all hover:scale-[1.03]",
                          getLogicalCandidateColor(candidate),
                        )}
                      >
                        {candidate.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-1.5 items-center relative z-10">
              {layout.map((row, ri) => (
                <div key={ri} className="flex gap-1.5" style={{ paddingLeft: `${ri * ROW_OFFSET_PX}px` }}>
                  {row.map((key, ki) => {
                    const display = getPhysicalKeyDisplay(key)
                    const showShiftedDisplay =
                      display?.shifted != null &&
                      display.base.toLowerCase() !== display.shifted.toLowerCase()
                    return (
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
                              "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg font-mono font-semibold border transition-all duration-200 select-none cursor-pointer hover:scale-110",
                              showShiftedDisplay ? "flex-col gap-0" : "text-[10px] sm:text-xs",
                              getKeyColor(key),
                            )}
                          >
                            {showShiftedDisplay && display ? (
                              <>
                                <span className="text-[8px] sm:text-[9px] leading-none opacity-50">{display.shifted}</span>
                                <span className="text-[9px] sm:text-[11px] leading-none">
                                  {/[a-z]/.test(display.base)
                                    ? display.base.toUpperCase()
                                    : display.base}
                                </span>
                              </>
                            ) : (
                              /[a-z]/.test(display?.base ?? "")
                                ? display?.base.toUpperCase()
                                : display?.base ?? key.toUpperCase()
                            )}
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-xs font-mono">
                          {getTooltipContent(key)}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {effectiveTab === "transitions" && selectedLogicalKey && arcs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                {t("keyboardHeatmap.transitionsFrom", { key: selectedLogicalKey.toUpperCase() })}
              </div>
              <div className="mb-2 text-[10px] text-muted-foreground/70">
                {t("keyboardHeatmap.arcNote")}
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
                            {t("keyboardHeatmap.hitRate")}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="rounded-full border border-border/40 bg-secondary/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {arc.correctAttempts}/{arc.attempts}
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            {t("keyboardHeatmap.score")}
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
              <LegendItem color="bg-emerald-400/30" label={t("keyboardHeatmap.legend.falseRate.low")} />
              <LegendItem color="bg-yellow-400/30" label={t("keyboardHeatmap.legend.falseRate.some")} />
              <LegendItem color="bg-orange-400/50" label={t("keyboardHeatmap.legend.falseRate.many")} />
              <LegendItem color="bg-red-500/60" label={t("keyboardHeatmap.legend.falseRate.high")} />
            </>
          )}
          {effectiveTab === "frequency" && (
            <>
              <LegendItem color="bg-secondary/40" label={t("keyboardHeatmap.legend.frequency.rare")} />
              <LegendItem color="bg-primary/30" label={t("keyboardHeatmap.legend.frequency.often")} />
              <LegendItem color="bg-primary/50" label={t("keyboardHeatmap.legend.frequency.most")} />
            </>
          )}
          {effectiveTab === "transitions" && (
            <>
              <LegendItem color="bg-emerald-400/40" label={t("keyboardHeatmap.legend.transitions.clean")} />
              <LegendItem color="bg-yellow-400/40" label={t("keyboardHeatmap.legend.transitions.minor")} />
              <LegendItem color="bg-orange-400/40" label={t("keyboardHeatmap.legend.transitions.risky")} />
              <LegendItem color="bg-red-400/40" label={t("keyboardHeatmap.legend.transitions.errorProne")} />
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
