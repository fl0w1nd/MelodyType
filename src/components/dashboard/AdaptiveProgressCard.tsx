import { useEffect, useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import {
  Brain,
  Lock,
  Unlock,
  Star,
  Crosshair,
  TrendingUp,
  Gauge,
  Target,
  Keyboard,
  Zap,
  Music,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { KeyConfidence } from "@/engine/typing/adaptiveEngine"
import {
  loadAdaptiveState,
  ensureAdaptiveAccuracyStatsBackfilled,
  LETTER_FREQUENCY_ORDER,
  getAdaptiveKeyToneClass,
  getAdaptiveKeyBarClass,
  isKeyStrictlyMastered,
} from "@/engine/typing/adaptiveEngine"

export function AdaptiveProgressCard() {
  useEffect(() => {
    void ensureAdaptiveAccuracyStatsBackfilled()
  }, [])

  const adaptiveState = useLiveQuery(() => loadAdaptiveState(), [], null)

  const stats = useMemo(() => {
    if (!adaptiveState) return null

    const unlocked = adaptiveState.keyConfidences.filter((k) => k.unlocked)
    const mastered = unlocked.filter((k) => isKeyStrictlyMastered(k))
    const learning = unlocked.filter((k) => k.confidence > 0 && k.bestConfidence < 1.0)
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
      averageSpeed: adaptiveState.globalSummary.speed.avg,
      averageAccuracy: adaptiveState.globalSummary.accuracy.avg,
      averageIntegrity: adaptiveState.globalSummary.integrity.avg,
      integritySamples: adaptiveState.globalSummary.integrity.count,
      averageScore: adaptiveState.globalSummary.score.avg,
      totalClicks: adaptiveState.globalSummary.clicks.total,
      averageCps: adaptiveState.globalSummary.cps.avg,
      weakest,
      strongest,
      totalSessions: adaptiveState.totalSessions,
      focusKey: adaptiveState.focusKey,
    }
  }, [adaptiveState])

  if (!adaptiveState || !stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
      >
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
              <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Adaptive Progress
            </h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-5 text-muted-foreground">
          <Brain className="h-8 w-8 mb-2 opacity-20" />
          <span className="text-sm">Start practicing in adaptive mode to track progress</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
            <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Adaptive Progress
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{stats.totalSessions}</span>{" "}
          sessions
        </span>
      </div>

      <div className="px-5 pb-5 pt-2 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <StatPill
            icon={<Unlock className="h-3.5 w-3.5 text-primary" />}
            value={
              <>
                {stats.unlocked.length}
                <span className="text-[10px] text-muted-foreground font-normal">
                  /{LETTER_FREQUENCY_ORDER.length}
                </span>
              </>
            }
            label="Unlocked"
          />
          <StatPill
            icon={<Star className="h-3.5 w-3.5 text-amber-500" />}
            value={stats.mastered.length}
            label="Mastered"
          />
          <StatPill
            icon={<TrendingUp className="h-3.5 w-3.5 text-blue-500" />}
            value={`${Math.round(stats.avgConfidence * 100)}%`}
            label="Confidence"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <MetricPill
            label="Speed"
            value={`${stats.totalSessions > 0 ? stats.averageSpeed.toFixed(1) : "—"} wpm`}
            icon={<Gauge className="h-3.5 w-3.5 text-amber-500" />}
          />
          <MetricPill
            label="Accuracy"
            value={stats.totalSessions > 0 ? `${stats.averageAccuracy.toFixed(1)}%` : "—"}
            icon={<Target className="h-3.5 w-3.5 text-emerald-500" />}
          />
          <MetricPill
            label="Score"
            value={stats.totalSessions > 0 ? stats.averageScore.toFixed(0) : "—"}
            icon={<TrendingUp className="h-3.5 w-3.5 text-blue-500" />}
          />
          <MetricPill
            label="Integrity"
            value={stats.integritySamples > 0 ? `${stats.averageIntegrity.toFixed(0)}%` : "—"}
            icon={<Music className="h-3.5 w-3.5 text-sky-500" />}
          />
          <MetricPill
            label="Clicks"
            value={stats.totalSessions > 0 ? stats.totalClicks.toFixed(0) : "—"}
            icon={<Keyboard className="h-3.5 w-3.5 text-violet-500" />}
          />
          <MetricPill
            label="CPS"
            value={stats.totalSessions > 0 ? `${stats.averageCps.toFixed(1)}` : "—"}
            icon={<Zap className="h-3.5 w-3.5 text-rose-500" />}
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-muted-foreground font-medium">Key Confidence Map</span>
            {stats.focusKey && (
              <div className="flex items-center gap-1 text-primary">
                <Crosshair className="h-3 w-3" />
                <span className="font-mono font-semibold">{stats.focusKey.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-wrap justify-center">
            {adaptiveState.keyConfidences.map((kc, i) => (
              <motion.div
                key={kc.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.015, duration: 0.2 }}
                className={cn(
                  "relative w-7 h-7 flex items-center justify-center rounded-md text-[10px] font-mono font-semibold border transition-all duration-200",
                  getAdaptiveKeyToneClass(kc),
                  kc.focused &&
                    "ring-2 ring-primary/50 ring-offset-1 ring-offset-background scale-110",
                )}
                title={
                  kc.unlocked
                    ? `${kc.key.toUpperCase()}: ${Math.round(kc.speed * 5)} CPM · best ${Math.round(kc.bestConfidence * (adaptiveState?.settings.targetCpm ?? 175))} CPM · target ${adaptiveState?.settings.targetCpm ?? 175} CPM`
                    : `${kc.key.toUpperCase()}: Locked`
                }
              >
                {kc.unlocked ? kc.key.toUpperCase() : <Lock className="h-2.5 w-2.5" />}
                {kc.unlocked && kc.confidence > 0 && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 rounded-b",
                      getAdaptiveKeyBarClass(kc),
                    )}
                    style={{ width: `${Math.min(kc.confidence * 100, 100)}%` }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {stats.weakest.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 block">
                Weakest Keys
              </span>
              <div className="space-y-1.5">
                {stats.weakest.map((kc) => (
                  <KeyStatMiniRow key={kc.key} kc={kc} variant="weak" />
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 block">
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

        <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/30">
          <LegendDot color="bg-red-500/60" label="Weak" />
          <LegendDot color="bg-amber-500/60" label="Learning" />
          <LegendDot color="bg-blue-500/60" label="Good" />
          <LegendDot color="bg-emerald-500/60" label="Mastered" />
          <LegendDot color="bg-muted/40" label="Locked" />
        </div>
      </div>
    </motion.div>
  )
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/30 p-3">
      {icon}
      <span className="text-base font-mono font-bold tabular-nums">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  )
}

function MetricPill({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-secondary/20 p-2.5">
      {icon}
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-mono text-sm font-semibold text-foreground tabular-nums">{value}</div>
      </div>
    </div>
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
          "w-5 h-5 flex items-center justify-center rounded-md text-[9px] font-mono font-bold border",
          getAdaptiveKeyToneClass(kc),
        )}
      >
        {kc.key.toUpperCase()}
      </div>
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            variant === "weak" ? "bg-red-500" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(kc.confidence * 100, 100)}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground w-8 text-right tabular-nums">
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
