import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Gauge,
  Target,
  Flame,
  Trophy,
  Clock,
  Hash,
} from "lucide-react"
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
      }
    }

    const avgWpm =
      sessions.reduce((a, s) => a + s.wpm, 0) / sessions.length
    const bestWpm = Math.max(...sessions.map((s) => s.wpm))
    const avgAccuracy =
      sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length
    const totalTime = sessions.reduce((a, s) => a + s.duration, 0)

    let streak = 0
    const sortedGoals = [...dailyGoals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    const today = new Date().toISOString().split("T")[0]
    for (const goal of sortedGoals) {
      const dayDiff = Math.floor(
        (new Date(today).getTime() - new Date(goal.date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
      if (dayDiff === streak && goal.sessionsCount > 0) {
        streak++
      } else {
        break
      }
    }

    return {
      avgWpm: Math.round(avgWpm * 10) / 10,
      bestWpm: Math.round(bestWpm * 10) / 10,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      totalSessions: sessions.length,
      totalTime: Math.round(totalTime / 60),
      streak,
    }
  }, [sessions, dailyGoals])

  const cards = [
    {
      icon: Gauge,
      label: "Avg WPM",
      value: stats.avgWpm.toString(),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Trophy,
      label: "Best WPM",
      value: stats.bestWpm.toString(),
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Target,
      label: "Avg Accuracy",
      value: `${stats.avgAccuracy}%`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Hash,
      label: "Sessions",
      value: stats.totalSessions.toString(),
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Clock,
      label: "Total Time",
      value: `${stats.totalTime}m`,
      color: "text-violet-600",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${stats.streak}d`,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-4"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgColor}`}
          >
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <span className="text-xl font-mono font-bold tabular-nums text-foreground">
            {card.value}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {card.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
