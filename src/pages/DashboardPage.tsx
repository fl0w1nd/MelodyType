import { useCallback, useEffect, useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import { Brain, Clock, Quote } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { WpmChart, AccuracyChart } from "@/components/dashboard/WpmChart"
import { KeyboardHeatmap } from "@/components/dashboard/KeyboardHeatmap"
import { SessionHistory } from "@/components/dashboard/SessionHistory"
import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { KeyDetailPanel } from "@/components/dashboard/KeyDetailPanel"
import { AdaptiveProgressCard } from "@/components/dashboard/AdaptiveProgressCard"
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap"
import { formatLocalDateKey } from "@/lib/date"
import type { DailyGoal, TypingSession } from "@/lib/db"
import { loadAllBigramScores, backfillBigramStatsFromHistory } from "@/engine/typing/adaptiveEngine"
import { buildDashboardKeyStats } from "@/components/dashboard/dashboardUtils"

type DashboardMode = "adaptive" | "time" | "quote"

const EMPTY_SESSIONS: TypingSession[] = []
const EMPTY_DAILY_GOALS: DailyGoal[] = []

export default function DashboardPage() {
  const { t } = useTranslation()
  const sessions =
    useLiveQuery(() => db.sessions.orderBy("timestamp").toArray()) ?? EMPTY_SESSIONS
  const dailyGoals = useLiveQuery(() => db.dailyGoals.toArray()) ?? EMPTY_DAILY_GOALS

  const today = formatLocalDateKey()
  const todayGoal = dailyGoals.find((goal) => goal.date === today)
  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (session) => formatLocalDateKey(new Date(session.timestamp)) === today,
      ),
    [sessions, today],
  )

  const [selectedMode, setSelectedMode] = useState<DashboardMode>("adaptive")
  const [selectedKeyOverride, setSelectedKeyOverride] = useState<string | null>(null)
  const bigramScores = useLiveQuery(() => loadAllBigramScores(), [], [])

  const dashboardModeMeta: Record<DashboardMode, { label: string; icon: React.ReactNode }> = {
    adaptive: { label: t("dashboardPage.tabs.adaptive"), icon: <Brain className="h-4 w-4" /> },
    time: { label: t("dashboardPage.tabs.time"), icon: <Clock className="h-4 w-4" /> },
    quote: { label: t("dashboardPage.tabs.quote"), icon: <Quote className="h-4 w-4" /> },
  }

  const sessionsByMode = useMemo(() => {
    const map: Record<DashboardMode, TypingSession[]> = { adaptive: [], time: [], quote: [] }
    for (const s of sessions) {
      const bucket = map[s.mode as DashboardMode]
      if (bucket) bucket.push(s)
    }
    return map
  }, [sessions])

  useEffect(() => {
    void backfillBigramStatsFromHistory()
  }, [])

  const getDefaultKey = useCallback(
    (mode: DashboardMode) => {
      const modeSessions = sessions.filter((s) => s.mode === mode)
      if (modeSessions.length === 0) return null
      const keyHits = new Map<string, number>()
      for (const session of modeSessions) {
        for (const stroke of session.keystrokes) {
          const k = stroke.key.toLowerCase()
          if (k.length === 1 && k >= "a" && k <= "z") {
            keyHits.set(k, (keyHits.get(k) ?? 0) + 1)
          }
        }
      }
      if (keyHits.size === 0) return null
      let maxKey = ""
      let maxHits = 0
      for (const [key, hits] of keyHits) {
        if (hits > maxHits) {
          maxHits = hits
          maxKey = key
        }
      }
      return maxKey || null
    },
    [sessions],
  )

  const selectedKey = useMemo(
    () => selectedKeyOverride ?? getDefaultKey(selectedMode),
    [selectedKeyOverride, getDefaultKey, selectedMode],
  )

  const handleModeChange = useCallback(
    (value: string) => {
      setSelectedMode(value as DashboardMode)
      setSelectedKeyOverride(null)
    },
    [],
  )

  const handleKeySelect = useCallback((key: string) => {
    setSelectedKeyOverride(key)
  }, [])

  const keyStatsMap = useMemo(
    () => buildDashboardKeyStats(sessionsByMode[selectedMode]),
    [sessionsByMode, selectedMode],
  )

  return (
    <div className="flex flex-col gap-6">
      <StatsOverview sessions={sessions} dailyGoals={dailyGoals} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-stretch">
        <ActivityHeatmap sessions={sessions} weeks={12} />
        <DailyGoalRing todayGoal={todayGoal} todaySessions={todaySessions} />
      </div>

      <Tabs value={selectedMode} onValueChange={handleModeChange}>
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
              <WpmChart sessions={sessionsByMode[mode]} />
              <AccuracyChart sessions={sessionsByMode[mode]} />
            </div>

            <KeyboardHeatmap
              sessions={sessionsByMode[mode]}
              selectedKey={selectedKey}
              onKeySelect={handleKeySelect}
              bigramScores={mode === "adaptive" ? bigramScores : undefined}
              keyStatsMap={mode === selectedMode ? keyStatsMap : undefined}
            >
              <KeyDetailPanel
                sessions={sessionsByMode[mode]}
                selectedKey={selectedKey}
                keyStatsMap={mode === selectedMode ? keyStatsMap : undefined}
              />
            </KeyboardHeatmap>

            <SessionHistory sessions={sessionsByMode[mode]} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
