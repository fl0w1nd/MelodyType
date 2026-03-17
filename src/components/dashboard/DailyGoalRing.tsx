import { useMemo } from "react"
import { motion } from "framer-motion"
import { CalendarCheck, Zap } from "lucide-react"
import type { DailyGoal } from "@/lib/db"

interface DailyGoalRingProps {
  todayGoal: DailyGoal | undefined
}

export function DailyGoalRing({ todayGoal }: DailyGoalRingProps) {
  const progress = useMemo(() => {
    if (!todayGoal) return 0
    return Math.min((todayGoal.completedMinutes / todayGoal.targetMinutes) * 100, 100)
  }, [todayGoal])

  const circumference = 2 * Math.PI * 42
  const offset = circumference - (progress / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Today&apos;s Goal</h3>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-2">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-secondary/60"
              strokeWidth="5"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className={progress >= 100 ? "text-emerald-500" : "text-primary"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {progress >= 100 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
              >
                <Zap className="h-6 w-6 text-emerald-500 fill-emerald-500" />
              </motion.div>
            ) : (
              <span className="text-2xl font-mono font-bold tabular-nums">
                {Math.round(progress)}%
              </span>
            )}
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
              {progress >= 100 ? "complete" : "progress"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          {[
            {
              label: "Minutes",
              value: todayGoal ? (Math.round(todayGoal.completedMinutes * 10) / 10).toString() : "0",
            },
            {
              label: "Sessions",
              value: (todayGoal?.sessionsCount ?? 0).toString(),
            },
            {
              label: "Best WPM",
              value: todayGoal ? Math.round(todayGoal.bestWpm).toString() : "—",
            },
            {
              label: "Avg Acc",
              value: todayGoal ? `${todayGoal.avgAccuracy.toFixed(1)}%` : "—",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-secondary/30 p-2.5 text-center">
              <div className="text-sm font-mono font-bold tabular-nums">{item.value}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
