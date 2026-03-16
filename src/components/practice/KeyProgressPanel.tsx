import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Star,
  Crosshair,
  Gauge,
  Target,
  Clock,
  Hash,
  RotateCcw,
  TrendingUp,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  AdaptiveGlobalSummary,
  KeyConfidence,
} from "@/engine/typing/adaptiveEngine"
import {
  LETTER_FREQUENCY_ORDER,
  DEFAULT_TARGET_CPM,
  MIN_HITS_FOR_MASTERY,
  MIN_RECENT_ACCURACY_FOR_MASTERY,
  MIN_LIFETIME_ACCURACY_FOR_MASTERY,
  getConfidenceColorClass,
  getConfidenceBarColorClass,
} from "@/engine/typing/adaptiveEngine"

interface KeyProgressPanelProps {
  keyConfidences: KeyConfidence[]
  focusKey: string | null
  globalSummary: AdaptiveGlobalSummary
  targetCpm?: number
  recoverKeys?: boolean
  forcedAlphabetSize?: number
  totalSessions?: number
  roundNumber?: number
  compact?: boolean
}

function KeyProgressPanelInner({
  keyConfidences,
  focusKey,
  globalSummary,
  targetCpm = DEFAULT_TARGET_CPM,
  recoverKeys = false,
  forcedAlphabetSize = 0,
  totalSessions = 0,
  roundNumber = 1,
  compact = false,
}: KeyProgressPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const unlockedKeys = keyConfidences.filter((k) => k.unlocked)
  const lockedKeys = keyConfidences.filter((k) => !k.unlocked)
  const forcedKeys = unlockedKeys.filter((k) => k.forced)
  const masteredCount = unlockedKeys.filter(
    (k) => k.bestConfidence >= 1.0,
  ).length

  const avgConfidence =
    unlockedKeys.length > 0
      ? unlockedKeys.reduce((sum, k) => sum + k.confidence, 0) / unlockedKeys.length
      : 0
  const hasSummaryData = globalSummary.count > 0
  const showDelta = globalSummary.count > 1

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50">
        <div className="flex items-center gap-1.5">
          <Unlock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            {unlockedKeys.length}/{LETTER_FREQUENCY_ORDER.length}
          </span>
        </div>
        <div className="w-px h-5 bg-border/60" />
        <div className="flex gap-0.5">
          {keyConfidences.slice(0, 15).map((kc) => (
            <div
              key={kc.key}
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded text-[9px] font-mono font-medium border transition-colors",
                getConfidenceColorClass(kc.confidence, kc.unlocked),
                kc.focused && "ring-1 ring-primary ring-offset-1 ring-offset-background",
              )}
            >
              {kc.key.toUpperCase()}
            </div>
          ))}
          {keyConfidences.length > 15 && (
            <span className="text-[9px] text-muted-foreground self-center ml-1">
              +{keyConfidences.length - 15}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="rounded-xl bg-secondary/40 border border-border/50 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5">
              <Unlock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">
                <span className="text-foreground">{unlockedKeys.length}</span>
                <span className="text-muted-foreground">/{LETTER_FREQUENCY_ORDER.length} keys</span>
              </span>
            </div>
            <div className="w-px h-5 bg-border/60" />
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium">
                <span className="text-foreground">{masteredCount}</span>
                <span className="text-muted-foreground"> mastered</span>
              </span>
            </div>
            {focusKey && (
              <>
                <div className="w-px h-5 bg-border/60" />
                <div className="flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    Focus: <span className="font-mono text-primary">{focusKey.toUpperCase()}</span>
                  </span>
                </div>
                <FocusThresholds
                  focusKey={focusKey}
                  keyConfidences={keyConfidences}
                  targetCpm={targetCpm}
                  recoverKeys={recoverKeys}
                  inline
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-full border border-border/50 bg-background/70 px-2 py-1 text-[10px] font-mono text-muted-foreground">
              Round {roundNumber}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? "Collapse" : "Details"}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <InlineMetric
            label="Speed"
            value={formatSummaryValue(hasSummaryData, globalSummary.speed.last, "wpm", 1)}
            icon={<Gauge className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.speed.delta, "wpm", 1) : undefined}
            deltaValue={globalSummary.speed.delta}
            accent
          />
          <InlineMetric
            label="Accuracy"
            value={formatSummaryValue(hasSummaryData, globalSummary.accuracy.last, "%", 1)}
            icon={<Target className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.accuracy.delta, "%", 1) : undefined}
            deltaValue={globalSummary.accuracy.delta}
          />
          <InlineMetric
            label="Score"
            value={formatSummaryValue(hasSummaryData, globalSummary.score.last, "", 0)}
            icon={<TrendingUp className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.score.delta, "", 0) : undefined}
            deltaValue={globalSummary.score.delta}
          />
          <InlineMetric
            label="Target"
            value={`${targetCpm} cpm`}
            icon={<Activity className="h-3 w-3" />}
          />
          <InlineMetric
            label="Recover"
            value={recoverKeys ? "On" : "Off"}
            icon={<RotateCcw className="h-3 w-3" />}
          />
          <InlineMetric
            label="Unlocked"
            value={`${unlockedKeys.length}/${LETTER_FREQUENCY_ORDER.length}`}
            icon={<Unlock className="h-3 w-3" />}
          />
          <InlineMetric
            label="Mastered"
            value={String(masteredCount)}
            icon={<Star className="h-3 w-3" />}
          />
        </div>
      </div>

      <div className="mt-2 flex gap-1 flex-wrap justify-center">
        {keyConfidences.map((kc) => (
          <div
            key={kc.key}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono font-medium border transition-all",
              getConfidenceColorClass(kc.confidence, kc.unlocked),
              kc.focused && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background scale-110",
            )}
            title={
              kc.unlocked
                ? `${kc.key.toUpperCase()}: ${Math.round(kc.speed * 5)} CPM (target ${targetCpm}), ${Math.round(kc.confidence * 100)}% of target`
                : `${kc.key.toUpperCase()}: Locked`
            }
          >
            {kc.unlocked ? kc.key.toUpperCase() : <Lock className="h-2.5 w-2.5" />}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 px-1">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryMetricCard
                  label="Average Speed"
                  value={formatSummaryValue(hasSummaryData, globalSummary.speed.avg, "wpm", 1)}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label="Average Accuracy"
                  value={formatSummaryValue(hasSummaryData, globalSummary.accuracy.avg, "%", 1)}
                  icon={<Target className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label="Average Score"
                  value={formatSummaryValue(hasSummaryData, globalSummary.score.avg, "", 0)}
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label="Adaptive Sessions"
                  value={String(totalSessions)}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label="Forced Unlocks"
                  value={`${Math.round(forcedAlphabetSize * 100)}%${forcedKeys.length > 0 ? ` · +${forcedKeys.length}` : ""}`}
                  icon={<Hash className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-mono font-medium">{Math.round(avgConfidence * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${avgConfidence * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Unlocked Keys</span>
                <div className="grid gap-1.5">
                  {unlockedKeys.map((kc) => (
                    <KeyStatRow
                      key={kc.key}
                      keyConf={kc}
                      isFocus={kc.key === focusKey}
                      targetCpm={targetCpm}
                    />
                  ))}
                </div>
              </div>

              {lockedKeys.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Next to Unlock
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {lockedKeys.slice(0, 5).map((kc) => (
                      <div
                        key={kc.key}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 border border-border/30"
                      >
                        <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                        <span className="text-xs font-mono text-muted-foreground/50">
                          {kc.key.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {lockedKeys.length > 5 && (
                      <span className="text-[10px] text-muted-foreground/40 self-center">
                        +{lockedKeys.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function KeyStatRow({
  keyConf,
  isFocus,
  targetCpm,
}: {
  keyConf: KeyConfidence
  isFocus: boolean
  targetCpm: number
}) {
  const ewmaCpm = Math.round(keyConf.speed * 5)
  const bestCpm = Math.round(keyConf.bestConfidence * targetCpm)
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md",
        isFocus && "bg-primary/5 border border-primary/20",
      )}
    >
      <div
        className={cn(
          "w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold border",
          getConfidenceColorClass(keyConf.confidence, true),
        )}
      >
        {keyConf.key.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", getConfidenceBarColorClass(keyConf.confidence))}
            style={{ width: `${Math.min(keyConf.confidence * 100, 100)}%`, transition: "width 0.3s" }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5 text-[10px] font-mono text-muted-foreground shrink-0">
        <span>{ewmaCpm} cpm</span>
        <span>best {bestCpm}</span>
        <span>{keyConf.accuracy.toFixed(0)}%</span>
        <span>life {keyConf.lifetimeAccuracy.toFixed(0)}%</span>
        <span>{keyConf.samples} hits</span>
        {keyConf.learningRate?.remainingLessons != null && (
          <span className="text-primary/70" title={`R²=${keyConf.learningRate.certainty.toFixed(2)}`}>
            ~{keyConf.learningRate.remainingLessons}
          </span>
        )}
      </div>
      {isFocus && <Crosshair className="h-3 w-3 text-primary shrink-0" />}
    </div>
  )
}

function InlineMetric({
  label,
  value,
  icon,
  delta,
  deltaValue,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  delta?: string
  deltaValue?: number
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2 min-w-[7.5rem]">
      <span className="text-muted-foreground/70">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "truncate font-mono font-medium text-foreground",
              accent && "text-primary",
            )}
          >
            {value}
          </div>
          {delta && (
            <span
              className={cn(
                "text-[10px] font-medium",
                deltaValue == null || deltaValue === 0
                  ? "text-muted-foreground/70"
                  : deltaValue > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
              )}
            >
              {delta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryMetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2">
      <span className="text-muted-foreground/70">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </div>
        <div className="truncate font-mono font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

function FocusThresholds({
  focusKey,
  keyConfidences,
  targetCpm,
  recoverKeys,
  inline = false,
  className,
}: {
  focusKey: string | null
  keyConfidences: KeyConfidence[]
  targetCpm: number
  recoverKeys: boolean
  inline?: boolean
  className?: string
}) {
  const focus = focusKey
    ? keyConfidences.find((kc) => kc.key === focusKey)
    : null

  if (!focus) {
    return (
      <div
        className={cn(
          inline
            ? "text-xs text-emerald-700 dark:text-emerald-400"
            : "rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-400",
          className,
        )}
      >
        All currently unlocked keys meet the adaptive unlock thresholds.
      </div>
    )
  }

  const speedGate = recoverKeys ? focus.confidence : focus.bestConfidence
  const checks = [
    {
      label: `Target ${targetCpm} CPM`,
      met: speedGate >= 1.0,
    },
    {
      label: `${MIN_HITS_FOR_MASTERY}+ hits`,
      met: focus.samples >= MIN_HITS_FOR_MASTERY,
    },
    {
      label: `${Math.round(MIN_RECENT_ACCURACY_FOR_MASTERY * 100)}% recent`,
      met: focus.accuracy >= MIN_RECENT_ACCURACY_FOR_MASTERY * 100,
    },
    {
      label: `${Math.round(MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100)}% lifetime`,
      met: focus.lifetimeAccuracy >= MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100,
    },
  ]

  return (
    <div
      className={cn(
        inline
          ? "flex flex-wrap items-center gap-2"
          : "rounded-xl border border-border/50 bg-secondary/20 p-3",
        className,
      )}
    >
      {!inline && (
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Crosshair className="h-3.5 w-3.5 text-primary" />
          Focus Key Thresholds
          <span className="font-mono text-primary">{focus.key.toUpperCase()}</span>
        </div>
      )}
      <div className={cn("flex flex-wrap gap-2", inline && "contents")}>
        {checks.map((check) => (
          <span
            key={check.label}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-medium",
              check.met
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

function formatSummaryValue(
  hasData: boolean,
  value: number,
  unit: string,
  decimals: number,
): string {
  if (!hasData) return "—"
  const formatted = formatNumber(value, decimals)
  if (!unit) return formatted
  return unit === "%" ? `${formatted}${unit}` : `${formatted} ${unit}`
}

function formatDelta(value: number, unit: string, decimals: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return unit ? `${formatNumber(0, decimals)}${unit}` : formatNumber(0, decimals)
  }

  const abs = Math.abs(value)
  const formatted = formatNumber(abs, decimals)
  const sign = value > 0 ? "+" : "-"
  return unit ? `${sign}${formatted}${unit}` : `${sign}${formatted}`
}

export const KeyProgressPanel = memo(KeyProgressPanelInner)
