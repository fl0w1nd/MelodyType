import { motion } from "framer-motion"
import {
  Trophy,
  Gauge,
  Target,
  Clock,
  Zap,
  RotateCcw,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TypingMetrics } from "@/engine/typing/types"

interface ResultsPanelProps {
  metrics: TypingMetrics
  onRestart: () => void
  onNext?: () => void
}

export function ResultsPanel({ metrics, onRestart, onNext }: ResultsPanelProps) {
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
                  Here&apos;s your performance summary
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center mb-8">
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
                <div
                  className={`text-6xl font-mono font-bold ${grade.color}`}
                >
                  {grade.label}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {grade.message}
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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

            <div className="grid grid-cols-3 gap-3 mb-8 text-center">
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-lg font-mono font-semibold text-foreground">
                  {metrics.correctChars}
                </div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-lg font-mono font-semibold text-destructive">
                  {metrics.incorrectChars}
                </div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-lg font-mono font-semibold text-foreground">
                  {metrics.rawWpm.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Raw WPM</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={onRestart}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
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
      <span className="text-2xl font-mono font-bold tabular-nums text-foreground">
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
    return {
      label: "S",
      color: "text-amber-500",
      message: "Outstanding performance!",
    }
  if (score >= 60)
    return {
      label: "A",
      color: "text-primary",
      message: "Excellent typing skills!",
    }
  if (score >= 40)
    return {
      label: "B",
      color: "text-emerald-600",
      message: "Great work, keep improving!",
    }
  if (score >= 25)
    return {
      label: "C",
      color: "text-blue-500",
      message: "Good effort, practice more!",
    }
  if (score >= 15)
    return {
      label: "D",
      color: "text-orange-500",
      message: "Keep practicing!",
    }
  return {
    label: "F",
    color: "text-muted-foreground",
    message: "Every master was once a beginner.",
  }
}
