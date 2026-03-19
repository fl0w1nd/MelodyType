import { useMemo } from "react"
import { motion } from "framer-motion"
import { Activity } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatLocalDateKey, parseDateKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"

interface ActivityHeatmapProps {
  sessions: TypingSession[]
  weeks?: number
}

export function ActivityHeatmap({ sessions, weeks = 16 }: ActivityHeatmapProps) {
  const { grid, maxCount, totalDays } = useMemo(() => {
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
    const grid: { date: string; count: number; wpm: number; dayOfWeek: number }[][] = []
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

    const visibleCounts = grid.flat().map((d) => d.count)
    const maxCount = Math.max(...visibleCounts, 1)
    return { grid, maxCount, totalDays }
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

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{activeDays}</span> active days
        </span>
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="flex flex-col gap-[5px]">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-4 flex items-center">
              <span className="text-xs text-muted-foreground w-8 text-right">{label}</span>
            </div>
          ))}
        </div>

        <div
          className="grid flex-1 gap-[5px]"
          style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
          role="img"
          aria-label="Activity heatmap showing practice sessions over time"
        >
          {grid.map((week, wi) => (
            <div key={wi} className="grid gap-[5px]" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
              {week.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        "h-4 w-full rounded transition-colors duration-200",
                        getIntensityClass(day.count),
                      )}
                      style={{ gridRow: day.dayOfWeek + 1 }}
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
                        {day.count} session{day.count !== 1 ? "s" : ""} · best {day.wpm} wpm
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No sessions</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-auto pt-3">
        <span className="text-[10px] text-muted-foreground mr-0.5">Less</span>
        <div className="h-3.5 w-3.5 rounded bg-secondary/40 dark:bg-secondary/30" />
        <div className="h-3.5 w-3.5 rounded bg-emerald-300/50 dark:bg-emerald-400/25" />
        <div className="h-3.5 w-3.5 rounded bg-emerald-400/50 dark:bg-emerald-400/40" />
        <div className="h-3.5 w-3.5 rounded bg-emerald-400/80 dark:bg-emerald-400/70" />
        <div className="h-3.5 w-3.5 rounded bg-emerald-500 dark:bg-emerald-500" />
        <span className="text-[10px] text-muted-foreground ml-0.5">More</span>
      </div>
    </motion.div>
  )
}
