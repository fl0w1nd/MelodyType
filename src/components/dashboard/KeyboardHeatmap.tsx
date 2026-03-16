import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Flame } from "lucide-react"
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
        if (!stroke.correct) {
          current.errors += 1
        }
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
    if (!stat || stat.totalHits === 0) return "bg-secondary/50 text-muted-foreground"

    const errorRate = stat.errors / stat.totalHits
    if (mode === "errors") {
      const intensity = errorRate / maxVal
      if (intensity > 0.6) return "bg-red-500/70 text-white"
      if (intensity > 0.3) return "bg-orange-400/60 text-white"
      if (intensity > 0.1) return "bg-yellow-400/40 text-foreground"
      return "bg-emerald-400/40 text-foreground"
    }

    const intensity = stat.totalHits / maxVal
    if (intensity > 0.7) return "bg-primary/60 text-primary-foreground"
    if (intensity > 0.4) return "bg-primary/35 text-foreground"
    if (intensity > 0.1) return "bg-primary/15 text-foreground"
    return "bg-secondary/50 text-muted-foreground"
  }

  const getTooltipText = (key: string) => {
    const stat = statsMap.get(key)
    if (!stat || stat.totalHits === 0) return `${key.toUpperCase()}: No data`
    const errorRate = ((stat.errors / stat.totalHits) * 100).toFixed(1)
    return `${key.toUpperCase()}: ${stat.totalHits} hits, ${stat.errors} errors (${errorRate}%)`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-primary" />
          {title}
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {mode === "errors" ? "Error Rate" : "Usage Frequency"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5 items-center">
          {keyboardLayout.map((row, ri) => (
            <div
              key={ri}
              className="flex gap-1.5"
              style={{ paddingLeft: `${ri * 12}px` }}
            >
              {row.map((key) => (
                <Tooltip key={key}>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md text-xs font-mono font-medium transition-all cursor-default",
                        getColor(key),
                      )}
                    >
                      {key.toUpperCase()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
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
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-emerald-400/40" />
                <span className="text-[10px] text-muted-foreground">Low errors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-yellow-400/40" />
                <span className="text-[10px] text-muted-foreground">Some errors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-orange-400/60" />
                <span className="text-[10px] text-muted-foreground">Many errors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-red-500/70" />
                <span className="text-[10px] text-muted-foreground">High errors</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-secondary/50" />
                <span className="text-[10px] text-muted-foreground">Rarely used</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-primary/35" />
                <span className="text-[10px] text-muted-foreground">Often used</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-primary/60" />
                <span className="text-[10px] text-muted-foreground">Most used</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
