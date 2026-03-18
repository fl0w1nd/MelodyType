import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Trophy,
  Gauge,
  Target,
  Clock,
  Zap,
  RotateCcw,
  TrendingUp,
  Crown,
  Type,
  Keyboard,
  Star,
  ArrowLeft,
  ChevronRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TypingMetrics, PracticeModeConfig, KeystrokeEntry } from "@/engine/typing/types"
import { getLevelById, getStars, TIER_META, type LevelRecord } from "@/engine/typing/timeLevels"

interface ResultsPanelProps {
  metrics: TypingMetrics
  onRestart: () => void
  onNext?: () => void
  onBackToLevels?: () => void
  onNextLevel?: () => void
  modeConfig?: PracticeModeConfig
  keystrokeLog?: KeystrokeEntry[]
  previousPersonalBest?: number | null
  isNewPersonalBest?: boolean
  wordsCompleted?: number
}

export function ResultsPanel({
  metrics,
  onRestart,
  onNext,
  onBackToLevels,
  onNextLevel,
  modeConfig,
  keystrokeLog,
  previousPersonalBest = null,
  isNewPersonalBest = false,
  wordsCompleted,
}: ResultsPanelProps) {
  const grade = getGrade(metrics.wpm, metrics.accuracy)
  const isTimeMode = modeConfig?.mode === "time"
  const level = modeConfig?.levelId ? getLevelById(modeConfig.levelId) : null
  const cpm = metrics.elapsedTime > 0 ? Math.round((metrics.correctChars / metrics.elapsedTime) * 60) : 0
  const personalBest = isTimeMode
    ? (isNewPersonalBest ? metrics.wpm : previousPersonalBest)
    : null

  const currentRecord: LevelRecord = {
    bestWpm: metrics.wpm,
    bestAccuracy: metrics.accuracy,
    attempts: 1,
  }
  const earnedStars = getStars(currentRecord)

  const wpmOverTime = useMemo(() => {
    if (!keystrokeLog || keystrokeLog.length < 2) return []

    const firstTs = keystrokeLog[0].timestamp
    const totalDuration = keystrokeLog[keystrokeLog.length - 1].timestamp - firstTs
    if (totalDuration <= 0) return []

    const intervalMs = Math.max(1000, totalDuration / 20)
    const points: { time: number; wpm: number }[] = []

    for (let t = intervalMs; t <= totalDuration + intervalMs / 2; t += intervalMs) {
      const windowStart = firstTs + t - intervalMs
      const windowEnd = firstTs + t
      const correctInWindow = keystrokeLog.filter(
        (e) => e.timestamp >= windowStart && e.timestamp < windowEnd && e.correct,
      ).length
      const windowMinutes = intervalMs / 60000
      const wpm = windowMinutes > 0 ? Math.round(correctInWindow / 5 / windowMinutes) : 0
      points.push({ time: Math.round(t / 1000), wpm })
    }

    return points
  }, [keystrokeLog])

  const subtitle = level
    ? `${level.name} · ${level.timeLimit}s · ${TIER_META[level.tier].label}`
    : isTimeMode
      ? `${modeConfig?.timeLimit}s · ${modeConfig?.difficulty ?? "easy"}`
      : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="w-full"
    >
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-1">
          <CardContent className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-xl font-medium">
                  {level ? level.name : "Practice Complete"}
                </h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              {isNewPersonalBest && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
                  className="shrink-0 flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400"
                >
                  <Crown className="h-4 w-4" />
                  New PB!
                </motion.div>
              )}
            </div>

            {/* Grade + Stars */}
            <div className="flex items-center justify-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className={`text-6xl font-mono font-bold ${grade.color}`}>
                  {grade.label}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {grade.message}
                </p>
                {level && (
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3].map((s) => (
                      <motion.div
                        key={s}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4 + s * 0.1, type: "spring", stiffness: 300 }}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            s <= earnedStars
                              ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Main stats */}
            <div className={`grid ${isTimeMode ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"} gap-4 mb-8`}>
              <StatCard icon={<Gauge className="h-4 w-4" />} label="WPM" value={metrics.wpm.toFixed(0)} delay={0.1} />
              <StatCard icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${metrics.accuracy.toFixed(1)}%`} delay={0.15} />
              <StatCard icon={<Clock className="h-4 w-4" />} label="Time" value={`${metrics.elapsedTime}s`} delay={0.2} />
              <StatCard icon={<Zap className="h-4 w-4" />} label="Consistency" value={`${metrics.consistency}%`} delay={0.25} />
              {isTimeMode && (
                <StatCard icon={<Keyboard className="h-4 w-4" />} label="CPM" value={String(cpm)} delay={0.3} />
              )}
            </div>

            {/* Detail stats */}
            <div className={`grid ${isTimeMode ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"} gap-3 mb-8 text-center`}>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-lg font-mono font-semibold text-foreground">{metrics.correctChars}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-lg font-mono font-semibold text-destructive">{metrics.incorrectChars}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-lg font-mono font-semibold text-foreground">{metrics.rawWpm.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Raw WPM</div>
              </div>
              {isTimeMode && wordsCompleted != null && (
                <div className="rounded-lg bg-secondary/50 p-3">
                  <div className="text-lg font-mono font-semibold text-foreground flex items-center justify-center gap-1">
                    <Type className="h-3.5 w-3.5 text-muted-foreground" />
                    {wordsCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
              )}
            </div>

            {/* Personal best */}
            {isTimeMode && personalBest != null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mb-6 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>Personal Best</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-foreground">
                    {personalBest.toFixed(0)} WPM
                  </span>
                  {!isNewPersonalBest && (
                    <span className={`text-xs font-mono ${metrics.wpm >= personalBest ? "text-emerald-500" : "text-muted-foreground"}`}>
                      {metrics.wpm >= personalBest ? "=" : `${(metrics.wpm - personalBest).toFixed(0)}`}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* WPM chart */}
            {isTimeMode && wpmOverTime.length > 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">WPM Over Time</span>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={wpmOverTime}>
                      <defs>
                        <linearGradient id="resultWpmGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.55 0.15 55)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.55 0.15 55)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}s`} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.9 0.01 75)", backgroundColor: "oklch(0.995 0.003 80)", fontSize: "12px" }}
                        formatter={(value) => [`${value} WPM`, "Speed"]}
                        labelFormatter={(label) => `${label}s`}
                      />
                      {personalBest != null && (
                        <ReferenceLine y={personalBest} stroke="oklch(0.75 0.14 65)" strokeDasharray="4 4" strokeWidth={1} />
                      )}
                      <Area type="monotone" dataKey="wpm" stroke="oklch(0.55 0.15 55)" strokeWidth={2} fill="url(#resultWpmGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center flex-wrap">
              {onBackToLevels && (
                <Button onClick={onBackToLevels} variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  All Levels
                </Button>
              )}
              <Button onClick={onRestart} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              {onNextLevel && (
                <Button onClick={onNextLevel} className="gap-2">
                  Next Level
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {onNext && (
                <Button onClick={onNext} className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Next Lesson
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-4"
    >
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-2xl font-mono font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </motion.div>
  )
}

function getGrade(
  wpm: number,
  accuracy: number,
): { label: string; color: string; message: string } {
  const score = wpm * (accuracy / 100)
  if (score >= 80) return { label: "S", color: "text-amber-500", message: "Outstanding performance!" }
  if (score >= 60) return { label: "A", color: "text-primary", message: "Excellent typing skills!" }
  if (score >= 40) return { label: "B", color: "text-emerald-600", message: "Great work, keep improving!" }
  if (score >= 25) return { label: "C", color: "text-blue-500", message: "Good effort, practice more!" }
  if (score >= 15) return { label: "D", color: "text-orange-500", message: "Keep practicing!" }
  return { label: "F", color: "text-muted-foreground", message: "Every master was once a beginner." }
}
