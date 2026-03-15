import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck } from "lucide-react"
import type { DailyGoal } from "@/lib/db"

interface DailyGoalRingProps {
  todayGoal: DailyGoal | undefined
}

export function DailyGoalRing({ todayGoal }: DailyGoalRingProps) {
  const progress = useMemo(() => {
    if (!todayGoal) return 0
    return Math.min(
      (todayGoal.completedMinutes / todayGoal.targetMinutes) * 100,
      100,
    )
  }, [todayGoal])

  const circumference = 2 * Math.PI * 45
  const offset = circumference - (progress / 100) * circumference

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-4 w-4 text-primary" />
          Today&apos;s Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative h-32 w-32">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              className="text-secondary"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              className="text-primary transition-all duration-700 ease-out"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold">
              {Math.round(progress)}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              complete
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full text-center">
          <div className="rounded-lg bg-secondary/40 p-2">
            <div className="text-sm font-mono font-semibold">
              {todayGoal ? Math.round(todayGoal.completedMinutes * 10) / 10 : 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Minutes</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2">
            <div className="text-sm font-mono font-semibold">
              {todayGoal?.sessionsCount ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Sessions</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2">
            <div className="text-sm font-mono font-semibold">
              {todayGoal ? Math.round(todayGoal.bestWpm) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">Best WPM</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2">
            <div className="text-sm font-mono font-semibold">
              {todayGoal ? `${todayGoal.avgAccuracy.toFixed(1)}%` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">Avg Acc.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
