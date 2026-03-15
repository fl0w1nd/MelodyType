import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Trophy,
  Gauge,
  Target,
  Clock,
  Zap,
  RotateCcw,
  Unlock,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TypingMetrics, KeystrokeEntry } from "@/engine/typing/types"
import type { KeyConfidence } from "@/engine/typing/adaptiveEngine"

interface AdaptiveResultsPanelProps {
  metrics: TypingMetrics
  keystrokeLog: KeystrokeEntry[]
  keyConfidences: KeyConfidence[]
  newlyUnlocked: string | null
  onRestart: () => void
}

interface PerKeyResult {
  key: string
  hits: number
  errors: number
  accuracy: number
  avgLatency: number
  wpm: number
}

function computePerKeyResults(log: KeystrokeEntry[]): PerKeyResult[] {
  const keyMap: Record<string, { hits: number; errors: number; latencies: number[] }> = {}

  for (let i = 0; i < log.length; i++) {
    const entry = log[i]
    if (entry.key.length !== 1) continue
    const lower = entry.key.toLowerCase()
    if (!keyMap[lower]) keyMap[lower] = { hits: 0, errors: 0, latencies: [] }
    keyMap[lower].hits++
    if (!entry.correct) keyMap[lower].errors++

    if (i > 0) {
      const latency = entry.timestamp - log[i - 1].timestamp
      if (latency > 0 && latency < 5000) {
        keyMap[lower].latencies.push(latency)
      }
    }
  }

  return Object.entries(keyMap)
    .map(([key, data]) => {
      const avgLatency =
        data.latencies.length > 0
          ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length
          : 0
      const wpm = avgLatency > 0 ? (60000 / avgLatency) / 5 : 0
      return {
        key,
        hits: data.hits,
        errors: data.errors,
        accuracy: data.hits > 0 ? ((data.hits - data.errors) / data.hits) * 100 : 100,
        avgLatency,
        wpm,
      }
    })
    .sort((a, b) => a.accuracy - b.accuracy)
}

export function AdaptiveResultsPanel({
  metrics,
  keystrokeLog,
  keyConfidences,
  newlyUnlocked,
  onRestart,
}: AdaptiveResultsPanelProps) {
  const perKeyResults = useMemo(() => computePerKeyResults(keystrokeLog), [keystrokeLog])
  const grade = getGrade(metrics.wpm, metrics.accuracy)

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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-medium">
                  Practice Complete
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adaptive practice results
                </p>
              </div>
            </div>

            {newlyUnlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
              >
                <Unlock className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  New key unlocked:{" "}
                  <span className="font-mono text-lg font-bold">
                    {newlyUnlocked.toUpperCase()}
                  </span>
                </span>
              </motion.div>
            )}

            <div className="flex items-center justify-center mb-6">
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
                <div className={`text-5xl font-mono font-bold ${grade.color}`}>
                  {grade.label}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {grade.message}
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
            </div>

            {perKeyResults.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Per-Key Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {perKeyResults.map((result, i) => (
                    <KeyResultRow
                      key={result.key}
                      result={result}
                      confidence={keyConfidences.find((k) => k.key === result.key)}
                      delay={0.3 + i * 0.03}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={onRestart} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Continue Practice
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}

function KeyResultRow({
  result,
  confidence,
  delay,
}: {
  result: PerKeyResult
  confidence?: KeyConfidence
  delay: number
}) {
  const trend = confidence
    ? result.accuracy > (confidence.accuracy ?? 0)
      ? "up"
      : result.accuracy < (confidence.accuracy ?? 0)
        ? "down"
        : "same"
    : "same"

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary/40"
    >
      <div
        className={cn(
          "w-6 h-6 flex items-center justify-center rounded font-mono text-xs font-bold",
          result.accuracy >= 95
            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : result.accuracy >= 80
              ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
              : result.accuracy >= 60
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                : "bg-red-500/20 text-red-700 dark:text-red-400",
        )}
      >
        {result.key.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              result.accuracy >= 95
                ? "bg-emerald-500"
                : result.accuracy >= 80
                  ? "bg-blue-500"
                  : result.accuracy >= 60
                    ? "bg-amber-500"
                    : "bg-red-500",
            )}
            style={{ width: `${result.accuracy}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground shrink-0">
        <span>{result.accuracy.toFixed(0)}%</span>
        <span className="text-muted-foreground/40">|</span>
        <span>{Math.round(result.wpm)}w</span>
        {trend === "up" && <ArrowUp className="h-2.5 w-2.5 text-emerald-500" />}
        {trend === "down" && <ArrowDown className="h-2.5 w-2.5 text-red-500" />}
        {trend === "same" && <Minus className="h-2.5 w-2.5 text-muted-foreground/40" />}
      </div>
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
      className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3"
    >
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-xl font-mono font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  )
}

function getGrade(
  wpm: number,
  accuracy: number,
): { label: string; color: string; message: string } {
  const score = wpm * (accuracy / 100)
  if (score >= 80)
    return { label: "S", color: "text-amber-500", message: "Outstanding performance!" }
  if (score >= 60)
    return { label: "A", color: "text-primary", message: "Excellent typing skills!" }
  if (score >= 40)
    return { label: "B", color: "text-emerald-600", message: "Great work, keep improving!" }
  if (score >= 25)
    return { label: "C", color: "text-blue-500", message: "Good effort, practice more!" }
  if (score >= 15)
    return { label: "D", color: "text-orange-500", message: "Keep practicing!" }
  return { label: "F", color: "text-muted-foreground", message: "Every master was once a beginner." }
}
