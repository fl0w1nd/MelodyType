import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { WpmChart, AccuracyChart } from "@/components/dashboard/WpmChart"
import { KeyboardHeatmap } from "@/components/dashboard/KeyboardHeatmap"
import { SessionHistory } from "@/components/dashboard/SessionHistory"
import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"

export default function DashboardPage() {
  const sessions = useLiveQuery(() =>
    db.sessions.orderBy("timestamp").toArray(),
  ) ?? []

  const keyStats = useLiveQuery(() => db.keyStats.toArray()) ?? []

  const dailyGoals = useLiveQuery(() => db.dailyGoals.toArray()) ?? []

  const today = new Date().toISOString().split("T")[0]
  const todayGoal = dailyGoals.find((g) => g.date === today)

  const [heatmapMode, setHeatmapMode] = useState<"errors" | "speed">("errors")

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your progress and identify areas for improvement
        </p>
      </motion.div>

      <StatsOverview sessions={sessions} dailyGoals={dailyGoals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WpmChart sessions={sessions} />
          <AccuracyChart sessions={sessions} />
        </div>
        <div className="space-y-6">
          <DailyGoalRing todayGoal={todayGoal} />
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
        </div>
      </div>

      <SessionHistory sessions={sessions} />
    </div>
  )
}
