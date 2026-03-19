import { memo } from "react"
import { Music } from "lucide-react"
import { motion } from "framer-motion"
import type { MelodyState } from "@/engine/midi/types"

interface FlowMeterProps {
  melodyState: MelodyState
  isStarted: boolean
}

const flowLabels: Record<MelodyState["flowState"], string> = {
  idle: "Ready",
  flowing: "On Pace",
  fading: "Falling Behind…",
  stalled: "Paused",
}

function FlowMeterInner({ melodyState, isStarted }: FlowMeterProps) {
  const { fuel, maxFuel, flowState } = melodyState
  const ratio = maxFuel > 0 ? Math.min(1, fuel / maxFuel) : 0

  const barColor =
    flowState === "flowing"
      ? "bg-emerald-500"
      : flowState === "fading"
        ? "bg-amber-500"
        : flowState === "stalled"
          ? "bg-red-500"
          : "bg-primary/40"

  const labelColor =
    flowState === "flowing"
      ? "text-emerald-600 dark:text-emerald-400"
      : flowState === "fading"
        ? "text-amber-600 dark:text-amber-400"
        : flowState === "stalled"
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground/60"

  const label = isStarted ? flowLabels[flowState] : flowLabels.idle

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/40" role="status">
      <Music className={`h-3.5 w-3.5 shrink-0 transition-colors duration-300 ${labelColor}`} />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium whitespace-nowrap">
        Melody Flow
      </span>
      <div className="flex-1 h-1.5 min-w-20 bg-secondary/60 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label="Melody flow">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          animate={{
            width: `${ratio * 100}%`,
            opacity: flowState === "stalled" && isStarted ? [1, 0.4, 1] : 1,
          }}
          transition={
            flowState === "stalled" && isStarted
              ? { opacity: { repeat: Infinity, duration: 0.8 }, width: { duration: 0.15 } }
              : { duration: 0.15 }
          }
        />
      </div>
      <span
        className={`text-[10px] font-medium tabular-nums whitespace-nowrap transition-colors duration-300 ${labelColor}`}
      >
        {label}
      </span>
    </div>
  )
}

export const FlowMeter = memo(FlowMeterInner)
