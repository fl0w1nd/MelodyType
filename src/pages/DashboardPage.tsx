import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import { Brain, Clock, Quote } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { WpmChart, AccuracyChart } from "@/components/dashboard/WpmChart"
import { KeyboardHeatmap } from "@/components/dashboard/KeyboardHeatmap"
import { SessionHistory } from "@/components/dashboard/SessionHistory"
import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { KeyDetailPanel } from "@/components/dashboard/KeyDetailPanel"
import { AdaptiveProgressCard } from "@/components/dashboard/AdaptiveProgressCard"
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap"
import type { DailyGoal, TypingSession } from "@/lib/db"

type DashboardMode = "adaptive" | "time" | "quote"

const EMPTY_SESSIONS: TypingSession[] = []
const EMPTY_DAILY_GOALS: DailyGoal[] = []

const dashboardModeMeta: Record<
  DashboardMode,
  { label: string; icon: React.ReactNode }
> = {
  adaptive: { label: "Adaptive", icon: <Brain className="h-4 w-4" /> },
  time: { label: "Time", icon: <Clock className="h-4 w-4" /> },
  quote: { label: "Quote", icon: <Quote className="h-4 w-4" /> },
}

export default function DashboardPage() {
  const sessions =
    useLiveQuery(() => db.sessions.orderBy("timestamp").toArray()) ?? EMPTY_SESSIONS
  const dailyGoals = useLiveQuery(() => db.dailyGoals.toArray()) ?? EMPTY_DAILY_GOALS

  const today = new Date().toISOString().split("T")[0]
  const todayGoal = dailyGoals.find((goal) => goal.date === today)

  const [heatmapMode, setHeatmapMode] = useState<"errors" | "speed">("errors")
  const [selectedMode, setSelectedMode] = useState<DashboardMode>("adaptive")

  return (
    <div className="flex flex-col gap-6">
      <StatsOverview sessions={sessions} dailyGoals={dailyGoals} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-stretch">
        <ActivityHeatmap sessions={sessions} weeks={12} />
        <DailyGoalRing todayGoal={todayGoal} />
      </div>

      <Tabs
        value={selectedMode}
        onValueChange={(value) => setSelectedMode(value as DashboardMode)}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        >
          <TabsList className="h-auto w-full justify-start flex-wrap rounded-2xl bg-secondary/40 p-1 border border-border/30">
            {(
              Object.entries(dashboardModeMeta) as Array<
                [DashboardMode, { label: string; icon: React.ReactNode }]
              >
            ).map(([mode, meta]) => (
              <TabsTrigger
                key={mode}
                value={mode}
                className="min-w-[120px] gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:shadow-sm"
              >
                {meta.icon}
                {meta.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </motion.div>

        {(["adaptive", "time", "quote"] as DashboardMode[]).map((mode) => (
          <TabsContent key={mode} value={mode} className="mt-6 space-y-5">
            {mode === "adaptive" && <AdaptiveProgressCard />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <WpmChart sessions={sessions.filter((s) => s.mode === mode)} />
              <AccuracyChart sessions={sessions.filter((s) => s.mode === mode)} />
            </div>

            <div>
              <div className="flex gap-1 mb-3">
                <Button
                  variant={heatmapMode === "errors" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 rounded-lg"
                  onClick={() => setHeatmapMode("errors")}
                >
                  Error Rate
                </Button>
                <Button
                  variant={heatmapMode === "speed" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 rounded-lg"
                  onClick={() => setHeatmapMode("speed")}
                >
                  Frequency
                </Button>
              </div>
              <KeyboardHeatmap
                sessions={sessions.filter((s) => s.mode === mode)}
                mode={heatmapMode}
              />
            </div>

            <KeyDetailPanel sessions={sessions.filter((s) => s.mode === mode)} />

            <SessionHistory sessions={sessions.filter((s) => s.mode === mode)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
