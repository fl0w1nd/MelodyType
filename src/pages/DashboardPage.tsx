import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Brain, Clock, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { WpmChart, AccuracyChart } from "@/components/dashboard/WpmChart"
import { KeyboardHeatmap } from "@/components/dashboard/KeyboardHeatmap"
import { SessionHistory } from "@/components/dashboard/SessionHistory"
import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { KeyDetailPanel } from "@/components/dashboard/KeyDetailPanel"
import { AdaptiveProgressCard } from "@/components/dashboard/AdaptiveProgressCard"

type DashboardMode = "adaptive" | "time" | "quote"

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
    useLiveQuery(() => db.sessions.orderBy("timestamp").toArray()) ?? []
  const dailyGoals = useLiveQuery(() => db.dailyGoals.toArray()) ?? []

  const today = new Date().toISOString().split("T")[0]
  const todayGoal = dailyGoals.find((goal) => goal.date === today)

  const [heatmapMode, setHeatmapMode] = useState<"errors" | "speed">("errors")
  const [selectedMode, setSelectedMode] = useState<DashboardMode>("adaptive")

  const filteredSessions = useMemo(
    () => sessions.filter((session) => session.mode === selectedMode),
    [selectedMode, sessions],
  )

  return (
    <div className="flex flex-col gap-6">
      <StatsOverview sessions={sessions} dailyGoals={dailyGoals} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <Tabs value={selectedMode} onValueChange={(value) => setSelectedMode(value as DashboardMode)}>
          <TabsList className="h-auto w-full justify-start flex-wrap rounded-2xl bg-secondary/55 p-1">
            {(Object.entries(dashboardModeMeta) as Array<[DashboardMode, { label: string; icon: React.ReactNode }]>).map(
              ([mode, meta]) => (
                <TabsTrigger
                  key={mode}
                  value={mode}
                  className="min-w-[120px] gap-2 rounded-xl px-4 py-2.5 text-sm"
                >
                  {meta.icon}
                  {meta.label}
                </TabsTrigger>
              ),
            )}
          </TabsList>

          {(["adaptive", "time", "quote"] as DashboardMode[]).map((mode) => (
            <TabsContent key={mode} value={mode} className="mt-6 space-y-6">
              {mode === "adaptive" && <AdaptiveProgressCard />}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WpmChart sessions={sessions.filter((session) => session.mode === mode)} />
                <AccuracyChart sessions={sessions.filter((session) => session.mode === mode)} />
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
                <KeyboardHeatmap
                  sessions={sessions.filter((session) => session.mode === mode)}
                  mode={heatmapMode}
                />
              </div>

              <KeyDetailPanel
                sessions={sessions.filter((session) => session.mode === mode)}
              />

              <SessionHistory
                sessions={sessions.filter((session) => session.mode === mode)}
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-6">
          <DailyGoalRing todayGoal={todayGoal} />
          <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {dashboardModeMeta[selectedMode].icon}
              Sessions
            </div>
            <div className="mt-2 text-3xl font-mono font-bold tabular-nums text-foreground">
              {filteredSessions.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
