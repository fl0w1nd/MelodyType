import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { WpmChart, AccuracyChart } from "@/components/dashboard/WpmChart"
import { KeyboardHeatmap } from "@/components/dashboard/KeyboardHeatmap"
import { SessionHistory } from "@/components/dashboard/SessionHistory"
import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { KeyDetailPanel } from "@/components/dashboard/KeyDetailPanel"
import { AdaptiveProgressCard } from "@/components/dashboard/AdaptiveProgressCard"

export default function DashboardPage() {
  const sessions =
    useLiveQuery(() => db.sessions.orderBy("timestamp").toArray()) ?? []

  const keyStats = useLiveQuery(() => db.keyStats.toArray()) ?? []

  const dailyGoals = useLiveQuery(() => db.dailyGoals.toArray()) ?? []

  const today = new Date().toISOString().split("T")[0]
  const todayGoal = dailyGoals.find((g) => g.date === today)

  const [heatmapMode, setHeatmapMode] = useState<"errors" | "speed">("errors")

  return (
    <div className="flex flex-col gap-6">
      <StatsOverview sessions={sessions} dailyGoals={dailyGoals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AdaptiveProgressCard />
          <WpmChart sessions={sessions} />
          <AccuracyChart sessions={sessions} />
        </div>
        <div className="space-y-6">
          <DailyGoalRing todayGoal={todayGoal} />
        </div>
      </div>

      <div>
        <div className="flex gap-1 mb-3">
          <Button
            variant={heatmapMode === "errors" ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setHeatmapMode("errors")}
          >
            Error Rate
          </Button>
          <Button
            variant={heatmapMode === "speed" ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setHeatmapMode("speed")}
          >
            Frequency
          </Button>
        </div>
        <KeyboardHeatmap keyStats={keyStats} mode={heatmapMode} />
      </div>

      <KeyDetailPanel keyStats={keyStats} sessions={sessions} />

      <SessionHistory sessions={sessions} />
    </div>
  )
}
