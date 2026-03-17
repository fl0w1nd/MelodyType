import { useMemo } from "react"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"

const keyboardLayout = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
]

interface KeyboardHeatmapProps {
  sessions: TypingSession[]
  mode?: "errors" | "speed"
  title?: string
}

export function KeyboardHeatmap({
  sessions,
  mode = "errors",
  title = "Keyboard Heatmap",
}: KeyboardHeatmapProps) {
  const statsMap = useMemo(() => {
    const map = new Map<string, { totalHits: number; errors: number }>()
    for (const session of sessions) {
      for (const stroke of session.keystrokes) {
        const key = stroke.key.toLowerCase()
        if (key.length !== 1 || key < "a" || key > "z") continue
        const current = map.get(key) ?? { totalHits: 0, errors: 0 }
        current.totalHits += 1
        if (!stroke.correct) current.errors += 1
        map.set(key, current)
      }
    }
    return map
  }, [sessions])

  const maxVal = useMemo(() => {
    const values = [...statsMap.values()]
    if (values.length === 0) return 1
    if (mode === "errors") {
      return Math.max(
        ...values.map((entry) => (entry.totalHits > 0 ? entry.errors / entry.totalHits : 0)),
        0.01,
      )
    }
    return Math.max(...values.map((entry) => entry.totalHits), 1)
  }, [mode, statsMap])

  const getColor = (key: string) => {
    const stat = statsMap.get(key)
    if (!stat || stat.totalHits === 0)
      return "bg-secondary/40 text-muted-foreground border-transparent"

    if (mode === "errors") {
      const errorRate = stat.errors / stat.totalHits
      const intensity = errorRate / maxVal
      if (intensity > 0.6) return "bg-red-500/60 text-white border-red-500/30"
      if (intensity > 0.3) return "bg-orange-400/50 text-foreground border-orange-400/30"
      if (intensity > 0.1) return "bg-yellow-400/30 text-foreground border-yellow-400/20"
      return "bg-emerald-400/30 text-foreground border-emerald-400/20"
    }

    const intensity = stat.totalHits / maxVal
    if (intensity > 0.7) return "bg-primary/50 text-primary-foreground border-primary/30"
    if (intensity > 0.4) return "bg-primary/30 text-foreground border-primary/20"
    if (intensity > 0.1) return "bg-primary/15 text-foreground border-primary/10"
    return "bg-secondary/40 text-muted-foreground border-transparent"
  }

  const getTooltipText = (key: string) => {
    const stat = statsMap.get(key)
    if (!stat || stat.totalHits === 0) return `${key.toUpperCase()}: No data`
    const errorRate = ((stat.errors / stat.totalHits) * 100).toFixed(1)
    return `${key.toUpperCase()}: ${stat.totalHits} hits, ${stat.errors} errors (${errorRate}%)`
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
            <Flame className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {mode === "errors" ? "Error Rate" : "Usage Frequency"}
        </span>
      </div>

      <div className="px-5 pb-5 pt-2">
        <div className="flex flex-col gap-1.5 items-center">
          {keyboardLayout.map((row, ri) => (
            <div key={ri} className="flex gap-1.5" style={{ paddingLeft: `${ri * 14}px` }}>
              {row.map((key, ki) => (
                <Tooltip key={key}>
                  <TooltipTrigger>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.2 + ri * 0.06 + ki * 0.02,
                        duration: 0.3,
                        ease: [0.25, 1, 0.5, 1],
                      }}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-mono font-semibold border transition-all duration-200 cursor-default hover:scale-105",
                        getColor(key),
                      )}
                    >
                      {key.toUpperCase()}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-mono">
                    {getTooltipText(key)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          {mode === "errors" ? (
            <>
              <LegendItem color="bg-emerald-400/30" label="Low" />
              <LegendItem color="bg-yellow-400/30" label="Some" />
              <LegendItem color="bg-orange-400/50" label="Many" />
              <LegendItem color="bg-red-500/60" label="High" />
            </>
          ) : (
            <>
              <LegendItem color="bg-secondary/40" label="Rare" />
              <LegendItem color="bg-primary/30" label="Often" />
              <LegendItem color="bg-primary/50" label="Most" />
            </>
          )}
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
