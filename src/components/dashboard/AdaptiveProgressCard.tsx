import { useMemo, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  Lock,
  Unlock,
  Star,
  Crosshair,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AdaptiveState, KeyConfidence } from "@/engine/typing/adaptiveEngine"
import {
  loadAdaptiveState,
  CONFIDENCE_UNLOCK_THRESHOLD,
  LETTER_FREQUENCY_ORDER,
} from "@/engine/typing/adaptiveEngine"

function getConfidenceColor(confidence: number, unlocked: boolean): string {
  if (!unlocked) return "bg-muted/30 text-muted-foreground/40 border-border/30"
  if (confidence >= CONFIDENCE_UNLOCK_THRESHOLD)
    return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
  if (confidence >= 0.6)
    return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40"
  if (confidence >= 0.3)
    return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
  if (confidence > 0)
    return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40"
  return "bg-primary/10 text-primary/60 border-primary/20"
}

function getBarColor(confidence: number): string {
  if (confidence >= CONFIDENCE_UNLOCK_THRESHOLD) return "bg-emerald-500"
  if (confidence >= 0.6) return "bg-blue-500"
  if (confidence >= 0.3) return "bg-amber-500"
  return "bg-red-500"
}

export function AdaptiveProgressCard() {
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null)

  useEffect(() => {
    loadAdaptiveState().then(setAdaptiveState)
  }, [])

  const stats = useMemo(() => {
    if (!adaptiveState) return null

    const unlocked = adaptiveState.keyConfidences.filter((k) => k.unlocked)
    const mastered = unlocked.filter(
      (k) => k.confidence >= CONFIDENCE_UNLOCK_THRESHOLD,
    )
    const learning = unlocked.filter(
      (k) => k.confidence > 0 && k.confidence < CONFIDENCE_UNLOCK_THRESHOLD,
    )
    const avgConfidence =
      unlocked.length > 0
        ? unlocked.reduce((sum, k) => sum + k.confidence, 0) / unlocked.length
        : 0
    const weakest = [...unlocked]
      .filter((k) => k.samples > 0)
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 3)
    const strongest = [...unlocked]
      .filter((k) => k.samples > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)

    return {
      unlocked,
      mastered,
      learning,
      avgConfidence,
      weakest,
      strongest,
      totalSessions: adaptiveState.totalSessions,
      focusKey: adaptiveState.focusKey,
    }
  }, [adaptiveState])

  if (!adaptiveState || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Adaptive Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Start practicing in adaptive mode to see your progress
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Adaptive Progress
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {stats.totalSessions} sessions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/40 p-3">
            <Unlock className="h-4 w-4 text-primary" />
            <span className="text-lg font-mono font-bold">
              {stats.unlocked.length}
              <span className="text-xs text-muted-foreground font-normal">
                /{LETTER_FREQUENCY_ORDER.length}
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Unlocked
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/40 p-3">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-lg font-mono font-bold">
              {stats.mastered.length}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Mastered
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/40 p-3">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-lg font-mono font-bold">
              {Math.round(stats.avgConfidence * 100)}%
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Confidence
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground font-medium">
              Key Confidence Map
            </span>
            {stats.focusKey && (
              <div className="flex items-center gap-1 text-primary">
                <Crosshair className="h-3 w-3" />
                <span>Focus: {stats.focusKey.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-wrap justify-center">
            {adaptiveState.keyConfidences.map((kc, i) => (
              <motion.div
                key={kc.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                className={cn(
                  "relative w-7 h-7 flex items-center justify-center rounded text-[10px] font-mono font-medium border transition-all",
                  getConfidenceColor(kc.confidence, kc.unlocked),
                  kc.focused && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background scale-110",
                )}
                title={
                  kc.unlocked
                    ? `${kc.key.toUpperCase()}: ${Math.round(kc.confidence * 100)}% • ${Math.round(kc.speed)} WPM • ${kc.accuracy.toFixed(0)}% accuracy`
                    : `${kc.key.toUpperCase()}: Locked`
                }
              >
                {kc.unlocked ? kc.key.toUpperCase() : <Lock className="h-2.5 w-2.5" />}
                {kc.unlocked && kc.confidence > 0 && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 rounded-b",
                      getBarColor(kc.confidence),
                    )}
                    style={{
                      width: `${Math.min(kc.confidence * 100, 100)}%`,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {stats.weakest.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">
                Weakest Keys
              </span>
              <div className="space-y-1.5">
                {stats.weakest.map((kc) => (
                  <KeyStatMiniRow key={kc.key} kc={kc} variant="weak" />
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">
                Strongest Keys
              </span>
              <div className="space-y-1.5">
                {stats.strongest.map((kc) => (
                  <KeyStatMiniRow key={kc.key} kc={kc} variant="strong" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-1 border-t border-border/30">
          <LegendDot color="bg-red-500/60" label="Weak" />
          <LegendDot color="bg-amber-500/60" label="Learning" />
          <LegendDot color="bg-blue-500/60" label="Good" />
          <LegendDot color="bg-emerald-500/60" label="Mastered" />
          <LegendDot color="bg-muted/40" label="Locked" />
        </div>
      </CardContent>
    </Card>
  )
}

function KeyStatMiniRow({
  kc,
  variant,
}: {
  kc: KeyConfidence
  variant: "weak" | "strong"
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-5 h-5 flex items-center justify-center rounded text-[9px] font-mono font-bold border",
          getConfidenceColor(kc.confidence, true),
        )}
      >
        {kc.key.toUpperCase()}
      </div>
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            variant === "weak" ? "bg-red-500" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(kc.confidence * 100, 100)}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">
        {Math.round(kc.confidence * 100)}%
      </span>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  )
}
