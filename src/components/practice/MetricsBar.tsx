import { memo, useMemo } from "react"
import { Gauge, Target, Clock, Zap, Music } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import type { TypingMetrics } from "@/engine/typing/types"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface MetricsBarProps {
  metrics: TypingMetrics
  isStarted: boolean
  timeLimit?: number
}

function MetricsBarInner({ metrics, isStarted, timeLimit }: MetricsBarProps) {
  const { t } = useTranslation()

  const remaining =
    timeLimit != null ? Math.max(0, timeLimit - metrics.elapsedTime) : null

  const timeValue = (() => {
    if (!isStarted) {
      return remaining != null ? formatTime(timeLimit!) : "0:00"
    }
    return formatTime(remaining != null ? remaining : metrics.elapsedTime)
  })()

  const progress = useMemo(() => {
    if (timeLimit == null || !isStarted) return null
    return Math.max(0, Math.min(1, 1 - metrics.elapsedTime / timeLimit))
  }, [timeLimit, isStarted, metrics.elapsedTime])

  const isUrgent = remaining != null && isStarted && remaining <= 10
  const isCritical = remaining != null && isStarted && remaining <= 5

  return (
    <div className="flex flex-col gap-0" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-3 px-5 rounded-xl bg-secondary/40 border border-border/50">
        <MetricItem
          icon={<Gauge className="h-4 w-4" />}
          label={t("metricsBar.wpm")}
          value={isStarted ? metrics.wpm.toFixed(0) : "—"}
          tooltip={t("metricsBar.tooltips.wpm")}
          accent
        />
        <div className="hidden sm:block w-px h-8 bg-border/60" />
        <MetricItem
          icon={<Target className="h-4 w-4" />}
          label={t("metricsBar.accuracy")}
          value={isStarted ? `${metrics.accuracy.toFixed(1)}%` : "—"}
          tooltip={t("metricsBar.tooltips.accuracy")}
        />
        <div className="hidden sm:block w-px h-8 bg-border/60" />
        <MetricItem
          icon={<Clock className="h-4 w-4" />}
          label={remaining != null ? t("metricsBar.remaining") : t("metricsBar.time")}
          value={timeValue}
          tooltip={remaining != null ? t("metricsBar.tooltips.time") : t("metricsBar.tooltips.time")}
          urgent={isUrgent}
          critical={isCritical}
        />
        <div className="hidden sm:block w-px h-8 bg-border/60" />
        <MetricItem
          icon={<Zap className="h-4 w-4" />}
          label={t("metricsBar.raw")}
          value={isStarted ? metrics.rawWpm.toFixed(0) : "—"}
          tooltip={t("metricsBar.tooltips.raw")}
        />
        <div className="hidden sm:block w-px h-8 bg-border/60" />
        <MetricItem
          icon={<Music className="h-4 w-4" />}
          label={t("metricsBar.integrity")}
          value={isStarted ? `${metrics.melodyIntegrity.toFixed(0)}%` : "—"}
          tooltip={t("metricsBar.tooltips.integrity")}
        />
      </div>

      {timeLimit != null && (
        <TimeProgressBar
          progress={progress}
          isStarted={isStarted}
          isUrgent={isUrgent}
          isCritical={isCritical}
          ariaLabel={t("metricsBar.timeRemaining")}
        />
      )}
    </div>
  )
}

function TimeProgressBar({
  progress,
  isStarted,
  isUrgent,
  isCritical,
  ariaLabel,
}: {
  progress: number | null
  isStarted: boolean
  isUrgent: boolean
  isCritical: boolean
  ariaLabel: string
}) {
  const width = progress != null ? progress * 100 : 100

  const barColor = isCritical
    ? "bg-destructive"
    : isUrgent
      ? "bg-amber-500"
      : "bg-primary"

  return (
    <div
      className="w-full h-1 bg-secondary/60 rounded-b-xl overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={ariaLabel}
    >
      <motion.div
        className={`h-full rounded-b-xl transition-colors duration-300 ${barColor}`}
        initial={{ width: "100%" }}
        animate={{
          width: `${width}%`,
          opacity: isCritical ? [1, 0.5, 1] : 1,
        }}
        transition={
          isCritical
            ? { opacity: { repeat: Infinity, duration: 0.5 }, width: { duration: 0.3 } }
            : { duration: 0.3 }
        }
        style={{ willChange: isStarted ? "width, opacity" : "auto" }}
      />
    </div>
  )
}

function MetricItem({
  icon,
  label,
  value,
  tooltip,
  accent,
  urgent,
  critical,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tooltip?: string
  accent?: boolean
  urgent?: boolean
  critical?: boolean
}) {
  const valueColor = critical
    ? "text-destructive"
    : urgent
      ? "text-amber-500"
      : accent
        ? "text-primary"
        : "text-foreground"

  const content = (
    <div className="flex items-center gap-2">
      <span className={`transition-colors duration-300 ${critical ? "text-destructive/60" : urgent ? "text-amber-500/60" : "text-muted-foreground/60"}`}>
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
          {label}
        </span>
        <span
          className={`text-base font-mono font-semibold tabular-nums transition-colors duration-300 ${valueColor}`}
        >
          {value}
        </span>
      </div>
    </div>
  )

  if (!tooltip) return content

  return (
    <Tooltip>
      <TooltipTrigger render={<div />}>
        {content}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export const MetricsBar = memo(MetricsBarInner)
