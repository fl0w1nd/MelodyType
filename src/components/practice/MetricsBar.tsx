import { memo } from "react"
import { Gauge, Target, Clock, Zap } from "lucide-react"
import type { TypingMetrics } from "@/engine/typing/types"

interface MetricsBarProps {
  metrics: TypingMetrics
  isStarted: boolean
  timeLimit?: number
}

function MetricsBarInner({ metrics, isStarted, timeLimit }: MetricsBarProps) {
  const remaining =
    timeLimit != null ? Math.max(0, timeLimit - metrics.elapsedTime) : null

  const timeValue = (() => {
    if (!isStarted) {
      return remaining != null ? formatTime(timeLimit!) : "0:00"
    }
    return formatTime(remaining != null ? remaining : metrics.elapsedTime)
  })()

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10 py-3 px-5 rounded-xl bg-secondary/40 border border-border/50">
      <MetricItem
        icon={<Gauge className="h-4 w-4" />}
        label="WPM"
        value={isStarted ? metrics.wpm.toFixed(0) : "—"}
        accent
      />
      <div className="w-px h-8 bg-border/60" />
      <MetricItem
        icon={<Target className="h-4 w-4" />}
        label="Accuracy"
        value={isStarted ? `${metrics.accuracy.toFixed(1)}%` : "—"}
      />
      <div className="w-px h-8 bg-border/60" />
      <MetricItem
        icon={<Clock className="h-4 w-4" />}
        label={remaining != null ? "Remaining" : "Time"}
        value={timeValue}
      />
      <div className="w-px h-8 bg-border/60" />
      <MetricItem
        icon={<Zap className="h-4 w-4" />}
        label="Raw"
        value={isStarted ? metrics.rawWpm.toFixed(0) : "—"}
      />
    </div>
  )
}

function MetricItem({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground/60">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
          {label}
        </span>
        <span
          className={`text-base font-mono font-semibold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export const MetricsBar = memo(MetricsBarInner)
