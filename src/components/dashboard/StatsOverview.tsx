import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Gauge,
  Target,
  Flame,
  Trophy,
  Clock,
  Hash,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { formatLocalDateKey, parseDateKey } from "@/lib/date"
import type { TypingSession, DailyGoal } from "@/lib/db"

interface StatsOverviewProps {
  sessions: TypingSession[]
  dailyGoals: DailyGoal[]
}

export function StatsOverview({ sessions, dailyGoals }: StatsOverviewProps) {
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        avgWpm: 0,
        bestWpm: 0,
        avgAccuracy: 0,
        totalSessions: 0,
        totalTime: 0,
        streak: 0,
        recentTrend: null as null | "up" | "down" | "stable",
      }
    }

    const avgWpm = sessions.reduce((a, s) => a + s.wpm, 0) / sessions.length
    const bestWpm = Math.max(...sessions.map((s) => s.wpm))
    const avgAccuracy = sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length
    const totalTime = sessions.reduce((a, s) => a + s.duration, 0)

    let streak = 0
    const sortedGoals = [...dailyGoals].sort(
      (a, b) => parseDateKey(b.date).getTime() - parseDateKey(a.date).getTime(),
    )
    const today = formatLocalDateKey()
    for (const goal of sortedGoals) {
      const dayDiff = Math.floor(
        (parseDateKey(today).getTime() - parseDateKey(goal.date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
      if (dayDiff === streak && goal.sessionsCount > 0) {
        streak++
      } else {
        break
      }
    }

    let recentTrend: "up" | "down" | "stable" | null = null
    if (sessions.length >= 6) {
      const half = Math.floor(sessions.length / 2)
      const firstHalf = sessions.slice(0, half)
      const secondHalf = sessions.slice(half)
      const firstAvg = firstHalf.reduce((a, s) => a + s.wpm, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, s) => a + s.wpm, 0) / secondHalf.length
      const diff = secondAvg - firstAvg
      if (diff > 2) recentTrend = "up"
      else if (diff < -2) recentTrend = "down"
      else recentTrend = "stable"
    }

    return {
      avgWpm: Math.round(avgWpm * 10) / 10,
      bestWpm: Math.round(bestWpm * 10) / 10,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      totalSessions: sessions.length,
      totalTime: Math.round(totalTime / 60),
      streak,
      recentTrend,
    }
  }, [sessions, dailyGoals])

  const heroMetrics = [
    {
      icon: Gauge,
      label: "Avg WPM",
      value: stats.avgWpm.toString(),
      accent: "from-amber-500/20 to-orange-500/5",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderAccent: "border-amber-500/20",
    },
    {
      icon: Trophy,
      label: "Best WPM",
      value: stats.bestWpm.toString(),
      accent: "from-yellow-500/20 to-amber-500/5",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      borderAccent: "border-yellow-500/20",
    },
    {
      icon: Target,
      label: "Accuracy",
      value: `${stats.avgAccuracy}%`,
      accent: "from-emerald-500/20 to-teal-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderAccent: "border-emerald-500/20",
    },
    {
      icon: Hash,
      label: "Sessions",
      value: stats.totalSessions.toString(),
      accent: "from-blue-500/20 to-indigo-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderAccent: "border-blue-500/20",
    },
    {
      icon: Clock,
      label: "Practice",
      value: `${stats.totalTime}m`,
      accent: "from-violet-500/20 to-purple-500/5",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderAccent: "border-violet-500/20",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${stats.streak}d`,
      accent: "from-rose-500/20 to-red-500/5",
      iconColor: "text-rose-600 dark:text-rose-400",
      borderAccent: "border-rose-500/20",
    },
  ]

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your typing journey
          </p>
        </div>
        {stats.recentTrend && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex items-center gap-1.5 text-xs font-medium"
          >
            {stats.recentTrend === "up" && (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Improving</span>
              </>
            )}
            {stats.recentTrend === "down" && (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">Needs focus</span>
              </>
            )}
            {stats.recentTrend === "stable" && (
              <span className="text-muted-foreground">Steady pace</span>
            )}
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {heroMetrics.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.06,
              duration: 0.4,
              ease: [0.25, 1, 0.5, 1],
            }}
            className={`group relative overflow-hidden rounded-2xl border ${card.borderAccent} bg-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
            <div className="relative flex flex-col items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm shadow-sm">
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <span className="text-2xl font-mono font-bold tabular-nums tracking-tight text-foreground">
                {card.value}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {card.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
