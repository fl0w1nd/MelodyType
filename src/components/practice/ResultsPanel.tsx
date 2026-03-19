import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Trophy,
  Gauge,
  Target,
  Clock,
  Zap,
  Music,
  RotateCcw,
  TrendingUp,
  Crown,
  Type,
  Keyboard,
  ArrowLeft,
  ChevronRight,
  Medal,
  History,
  Sparkles,
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
import type {
  TypingMetrics,
  PracticeModeConfig,
  KeystrokeEntry,
} from "@/engine/typing/types"
import {
  TIME_GRADE_META,
  TIER_META,
  getLevelById,
  getNextGradeRequirement,
  getTimeGrade,
  type LevelRecord,
} from "@/engine/typing/timeLevels"

interface ResultsPanelProps {
  metrics: TypingMetrics
  onRestart: () => void
  onNext?: () => void
  onBackToLevels?: () => void
  onNextLevel?: () => void
  modeConfig?: PracticeModeConfig
  keystrokeLog?: KeystrokeEntry[]
  isNewPersonalBest?: boolean
  levelRecord?: LevelRecord | null
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
  isNewPersonalBest = false,
  levelRecord = null,
  wordsCompleted,
}: ResultsPanelProps) {
  const isTimeMode = modeConfig?.mode === "time"
  const level = modeConfig?.levelId ? getLevelById(modeConfig.levelId) : null
  const timeGrade = level ? getTimeGrade(level, metrics.wpm, metrics.accuracy) : null
  const grade = timeGrade
    ? {
        label: timeGrade,
        color: TIME_GRADE_META[timeGrade].color,
        message: TIME_GRADE_META[timeGrade].message,
      }
    : getPerformanceGrade(metrics.wpm, metrics.accuracy)
  const nextRequirement =
    level && isTimeMode
      ? getNextGradeRequirement(level, metrics.wpm, metrics.accuracy)
      : null
  const cpm =
    metrics.elapsedTime > 0
      ? Math.round((metrics.correctChars / metrics.elapsedTime) * 60)
      : 0
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
        (entry) =>
          entry.timestamp >= windowStart &&
          entry.timestamp < windowEnd &&
          entry.correct,
      ).length
      const windowMinutes = intervalMs / 60000
      const wpm =
        windowMinutes > 0 ? Math.round(correctInWindow / 5 / windowMinutes) : 0
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
      role="status"
      aria-live="polite"
    >
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-1">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-xl font-medium">
                  {level ? level.name : "Practice Complete"}
                </h3>
                {subtitle && (
                  <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {isNewPersonalBest && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.4,
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400"
                >
                  <Crown className="h-4 w-4" />
                  New PB!
                </motion.div>
              )}
            </div>

            <div className="mb-8 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2,
                }}
                className="flex flex-col items-center"
              >
                <div className={`text-6xl font-mono font-bold ${grade.color}`}>
                  {grade.label}
                </div>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  {grade.message}
                </p>
                {isTimeMode && level && (
                  <div className="mt-3 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                    Target clear: {level.targetWpm} WPM at {level.targetAccuracy}%
                  </div>
                )}
              </motion.div>
            </div>

            <div
              className={`mb-8 grid gap-4 ${
                isTimeMode ? "grid-cols-2 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-5"
              }`}
            >
              <StatCard
                icon={<Gauge className="h-4 w-4" />}
                label="WPM"
                value={metrics.wpm.toFixed(0)}
                delay={0.1}
              />
              <StatCard
                icon={<Target className="h-4 w-4" />}
                label="Accuracy"
                value={`${metrics.accuracy.toFixed(1)}%`}
                delay={0.15}
              />
              <StatCard
                icon={<Clock className="h-4 w-4" />}
                label="Time"
                value={`${metrics.elapsedTime}s`}
                delay={0.2}
              />
              <StatCard
                icon={<Zap className="h-4 w-4" />}
                label="Consistency"
                value={`${metrics.consistency}%`}
                delay={0.25}
              />
              <StatCard
                icon={<Music className="h-4 w-4" />}
                label="Melody Integrity"
                value={`${metrics.melodyIntegrity.toFixed(0)}%`}
                delay={0.3}
              />
              {isTimeMode && (
                <StatCard
                  icon={<Keyboard className="h-4 w-4" />}
                  label="CPM"
                  value={String(cpm)}
                  delay={0.35}
                />
              )}
            </div>

            <div
              className={`mb-8 grid gap-3 text-center ${
                isTimeMode ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"
              }`}
            >
              <DetailStat
                label="Correct"
                value={String(metrics.correctChars)}
              />
              <DetailStat
                label="Errors"
                value={String(metrics.incorrectChars)}
                valueClassName="text-destructive"
              />
              <DetailStat
                label="Raw WPM"
                value={metrics.rawWpm.toFixed(0)}
              />
              <DetailStat
                label="Melody Integrity"
                value={`${metrics.melodyIntegrity.toFixed(0)}%`}
              />
              {isTimeMode && wordsCompleted != null && (
                <DetailStat
                  label="Words"
                  value={String(wordsCompleted)}
                  icon={<Type className="h-3.5 w-3.5 text-muted-foreground" />}
                />
              )}
            </div>

            {isTimeMode && level && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="mb-8 rounded-xl border border-border/50 bg-secondary/25 p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Level Progress</span>
                </div>

                {levelRecord ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <CompactStat label="Best WPM" value={levelRecord.bestWpm.toFixed(1)} />
                      <CompactStat label="Best Accuracy" value={`${levelRecord.bestAccuracy.toFixed(1)}%`} />
                      <CompactStat label="Best Grade" value={levelRecord.bestGrade} valueClassName={TIME_GRADE_META[levelRecord.bestGrade].color} />
                      <CompactStat label="Attempts" value={String(levelRecord.attempts)} />
                    </div>

                    {nextRequirement ? (
                      <div className="flex items-center gap-3 rounded-lg bg-secondary/40 px-4 py-2.5 text-sm">
                        <Medal className="h-4 w-4 shrink-0 text-amber-500" />
                        <span className="text-muted-foreground">
                          Next: grade <span className="font-semibold text-foreground">{nextRequirement.grade}</span>
                          {" · "}{nextRequirement.wpm} WPM at {nextRequirement.accuracy}%
                          {nextRequirement.wpmGap > 0 && (
                            <span className="ml-2 font-mono text-xs text-muted-foreground/70">
                              (+{nextRequirement.wpmGap.toFixed(1)} WPM, +{nextRequirement.accuracyGap.toFixed(1)}% needed)
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg bg-amber-500/8 px-4 py-2.5 text-sm">
                        <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                        <span className="text-muted-foreground">S-grade achieved — no higher rank on this level</span>
                      </div>
                    )}

                    {isNewPersonalBest && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium">New personal best!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    First attempt on this level — your record will appear here after this run is saved.
                  </p>
                )}
              </motion.div>
            )}

            {isTimeMode && wpmOverTime.length > 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    WPM Over Time
                  </span>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={wpmOverTime}>
                      <defs>
                        <linearGradient
                          id="resultWpmGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--primary)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--primary)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}s`}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--card)",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`${value} WPM`, "Speed"]}
                        labelFormatter={(label) => `${label}s`}
                      />
                      {levelRecord?.bestWpm != null && (
                        <ReferenceLine
                          y={levelRecord.bestWpm}
                          stroke="var(--accent)"
                          strokeDasharray="4 4"
                          strokeWidth={1}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="wpm"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#resultWpmGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
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
                  <Sparkles className="h-4 w-4" />
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
      aria-label={label}
    >
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-2xl font-mono font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </motion.div>
  )
}

function DetailStat({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string
  value: string
  valueClassName?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <div
        className={`flex items-center justify-center gap-1 text-lg font-mono font-semibold text-foreground ${
          valueClassName ?? ""
        }`}
      >
        {icon}
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function CompactStat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-sm font-semibold ${valueClassName ?? "text-foreground"}`}>{value}</div>
    </div>
  )
}

function getPerformanceGrade(
  wpm: number,
  accuracy: number,
): { label: string; color: string; message: string } {
  const score = wpm * (accuracy / 100)
  if (score >= 80) {
    return {
      label: "S",
      color: "text-amber-500",
      message: "Outstanding performance!",
    }
  }
  if (score >= 60) {
    return {
      label: "A",
      color: "text-primary",
      message: "Excellent typing skills!",
    }
  }
  if (score >= 40) {
    return {
      label: "B",
      color: "text-emerald-600",
      message: "Great work, keep improving!",
    }
  }
  if (score >= 25) {
    return {
      label: "C",
      color: "text-blue-500",
      message: "Good effort, practice more!",
    }
  }
  if (score >= 15) {
    return {
      label: "D",
      color: "text-orange-500",
      message: "Keep practicing!",
    }
  }
  return {
    label: "F",
    color: "text-muted-foreground",
    message: "Every master was once a beginner.",
  }
}
