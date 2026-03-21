import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Activity } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatLocalDateKey, parseDateKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"

const CELL_SIZE = 12
const CELL_GAP = 3
const DAY_LABEL_WIDTH = 28
const PADDING = 40 // p-5 = 20px × 2

interface ActivityHeatmapProps {
  sessions: TypingSession[]
}

export function ActivityHeatmap({ sessions }: ActivityHeatmapProps) {
  const { t } = useTranslation()
  const measureRef = useRef<HTMLDivElement>(null)
  const [weeks, setWeeks] = useState(0)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const compute = () => {
      // The card has overflow:hidden + the grid content only renders
      // when weeks > 0, so on first measure el.clientWidth is the
      // slot width given by the parent layout, not inflated by content.
      const available = el.clientWidth - DAY_LABEL_WIDTH - PADDING
      const colWidth = CELL_SIZE + CELL_GAP
      const w = Math.max(12, Math.floor(available / colWidth))
      setWeeks((prev) => (prev === w ? prev : w))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { grid, monthLabels, maxCount, totalDays } = useMemo(() => {
    const dayMap = new Map<string, { count: number; wpm: number }>()
    for (const s of sessions) {
      const d = formatLocalDateKey(new Date(s.timestamp))
      const existing = dayMap.get(d)
      if (existing) {
        existing.count++
        existing.wpm = Math.max(existing.wpm, s.wpm)
      } else {
        dayMap.set(d, { count: 1, wpm: s.wpm })
      }
    }

    const today = new Date()
    const totalDays = weeks * 7
    const grid: { date: string; count: number; wpm: number; dayOfWeek: number; month: number }[][] = []
    let currentWeek: typeof grid[0] = []

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = formatLocalDateKey(d)
      const data = dayMap.get(key)
      const entry = {
        date: key,
        count: data?.count ?? 0,
        wpm: data ? Math.round(data.wpm) : 0,
        dayOfWeek: d.getDay(),
        month: d.getMonth(),
      }

      if (entry.dayOfWeek === 0 && currentWeek.length > 0) {
        grid.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(entry)
    }
    if (currentWeek.length > 0) {
      grid.push(currentWeek)
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthLabels: { col: number; label: string }[] = []
    let lastMonth = -1
    for (let wi = 0; wi < grid.length; wi++) {
      const firstDay = grid[wi][0]
      if (firstDay.month !== lastMonth) {
        monthLabels.push({ col: wi, label: monthNames[firstDay.month] })
        lastMonth = firstDay.month
      }
    }

    const visibleCounts = grid.flat().map((d) => d.count)
    const maxCount = Math.max(...visibleCounts, 1)
    return { grid, monthLabels, maxCount, totalDays }
  }, [sessions, weeks])

  const activeDays = useMemo(() => {
    const today = new Date()
    const cutoff = today.getTime() - totalDays * 24 * 60 * 60 * 1000
    return new Set(
      sessions
        .filter((s) => s.timestamp >= cutoff)
        .map((s) => formatLocalDateKey(new Date(s.timestamp))),
    ).size
  }, [sessions, totalDays])

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-secondary/40 dark:bg-secondary/30"
    const ratio = count / maxCount
    if (ratio > 0.75) return "bg-emerald-500 dark:bg-emerald-500"
    if (ratio > 0.5) return "bg-emerald-400/80 dark:bg-emerald-400/70"
    if (ratio > 0.25) return "bg-emerald-400/50 dark:bg-emerald-400/40"
    return "bg-emerald-300/50 dark:bg-emerald-400/25"
  }

  const dayLabels = [
    "",
    t("activityHeatmap.dayLabels.mon"),
    "",
    t("activityHeatmap.dayLabels.wed"),
    "",
    t("activityHeatmap.dayLabels.fri"),
    "",
  ]

  return (
    <motion.div
      ref={measureRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {t("activityHeatmap.title")}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("activityHeatmap.activeDays", { count: activeDays })}
        </span>
      </div>

      {weeks > 0 && (
        <div className="flex-1 flex flex-col justify-center">
          {/* Month labels row */}
          <div className="flex mb-0.5">
            <div style={{ width: DAY_LABEL_WIDTH, flexShrink: 0 }} />
            <div className="flex" style={{ gap: CELL_GAP }}>
              {grid.map((_, wi) => {
                const monthLabel = monthLabels.find((m) => m.col === wi)
                return (
                  <span
                    key={wi}
                    className="text-[10px] text-muted-foreground leading-none"
                    style={{ width: CELL_SIZE, textAlign: "left" }}
                  >
                    {monthLabel?.label ?? ""}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="flex">
            {/* Day labels */}
            <div
              className="flex flex-col shrink-0"
              style={{ width: DAY_LABEL_WIDTH, gap: CELL_GAP }}
            >
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center justify-end pr-1"
                  style={{ height: CELL_SIZE }}
                >
                  <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
                </div>
              ))}
            </div>

            {/* Cells grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${grid.length}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                gap: CELL_GAP,
              }}
              role="img"
              aria-label={t("activityHeatmap.ariaLabel")}
            >
              {grid.map((week, wi) =>
                week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger>
                      <div
                        className={cn(
                          "rounded-sm transition-colors duration-200",
                          getIntensityClass(day.count),
                        )}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          gridColumn: wi + 1,
                          gridRow: day.dayOfWeek + 1,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-medium">
                        {parseDateKey(day.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {day.count > 0 ? (
                        <div className="text-muted-foreground">
                          {t("activityHeatmap.tooltip.sessions", {
                            n: day.count,
                            wpm: day.wpm,
                          })}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          {t("activityHeatmap.tooltip.noSessions")}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )),
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 mt-auto pt-3">
        <span className="text-[10px] text-muted-foreground mr-0.5">
          {t("activityHeatmap.legend.less")}
        </span>
        <div className="h-[11px] w-[11px] rounded-sm bg-secondary/40 dark:bg-secondary/30" />
        <div className="h-[11px] w-[11px] rounded-sm bg-emerald-300/50 dark:bg-emerald-400/25" />
        <div className="h-[11px] w-[11px] rounded-sm bg-emerald-400/50 dark:bg-emerald-400/40" />
        <div className="h-[11px] w-[11px] rounded-sm bg-emerald-400/80 dark:bg-emerald-400/70" />
        <div className="h-[11px] w-[11px] rounded-sm bg-emerald-500 dark:bg-emerald-500" />
        <span className="text-[10px] text-muted-foreground ml-0.5">
          {t("activityHeatmap.legend.more")}
        </span>
      </div>
    </motion.div>
  )
}
