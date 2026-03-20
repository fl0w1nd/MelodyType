import { memo, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Star,
  Crosshair,
  CircleCheck,
  Gauge,
  Target,
  Clock,
  TrendingUp,
  Activity,
  Keyboard,
  Zap,
  Music,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type {
  AdaptiveGlobalSummary,
  KeyConfidence,
} from "@/engine/typing/adaptiveEngine"
import {
  ADAPTIVE_TARGET_PRESETS,
  LETTER_FREQUENCY_ORDER,
  DEFAULT_TARGET_CPM,
  MIN_TARGET_CPM,
  MAX_TARGET_CPM,
  getAdaptiveKeyToneClass,
  getAdaptiveKeyBarClass,
  getKeyUnlockChecks,
  isKeyReadyToUnlock,
  isKeyStrictlyMastered,
  MIN_HITS_FOR_MASTERY,
  MIN_RECENT_ACCURACY_FOR_MASTERY,
  MIN_LIFETIME_ACCURACY_FOR_MASTERY,
} from "@/engine/typing/adaptiveEngine"

interface KeyProgressPanelProps {
  keyConfidences: KeyConfidence[]
  focusKey: string | null
  globalSummary: AdaptiveGlobalSummary
  targetCpm?: number
  recoverKeys?: boolean
  totalSessions?: number
  roundNumber?: number
  compact?: boolean
  onUnlockKey?: (key: string) => Promise<void> | void
  onTargetChange?: (targetCpm: number) => void
  onRecoverChange?: (recoverKeys: boolean) => void
}

function KeyProgressPanelInner({
  keyConfidences,
  focusKey,
  globalSummary,
  targetCpm = DEFAULT_TARGET_CPM,
  recoverKeys = false,
  totalSessions = 0,
  roundNumber = 1,
  compact = false,
  onUnlockKey,
  onTargetChange,
  onRecoverChange,
}: KeyProgressPanelProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [unlockPromptKey, setUnlockPromptKey] = useState<string | null>(null)
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null)
  const settingsPanelRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  const unlockedKeys = keyConfidences.filter((k) => k.unlocked)
  const lockedKeys = keyConfidences.filter((k) => !k.unlocked)
  const progressionKeys = unlockedKeys.filter((k) => !k.forced)
  const masteredCount = unlockedKeys.filter((k) => isKeyStrictlyMastered(k, recoverKeys)).length
  const readyToUnlockCount = progressionKeys.filter((k) =>
    isKeyReadyToUnlock(k, recoverKeys),
  ).length
  const blockingKeys = progressionKeys.filter((k) => !isKeyReadyToUnlock(k, recoverKeys))

  const avgConfidence =
    unlockedKeys.length > 0
      ? unlockedKeys.reduce((sum, k) => sum + k.confidence, 0) / unlockedKeys.length
      : 0
  const hasSummaryData = globalSummary.count > 0
  const hasIntegrityData = globalSummary.integrity.count > 0
  const showDelta = globalSummary.count > 1
  const showIntegrityDelta = globalSummary.integrity.count > 1

  const handleConfirmUnlock = async () => {
    if (!unlockPromptKey || !onUnlockKey) return
    setUnlockingKey(unlockPromptKey)
    try {
      await onUnlockKey(unlockPromptKey)
    } finally {
      setUnlockingKey(null)
      setUnlockPromptKey(null)
    }
  }

  useEffect(() => {
    if (!settingsOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (
        settingsPanelRef.current?.contains(target) ||
        settingsButtonRef.current?.contains(target)
      ) {
        return
      }
      setSettingsOpen(false)
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [settingsOpen])

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
                getAdaptiveKeyToneClass(kc, recoverKeys),
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
    <div className="relative w-full">
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
                <span className="text-muted-foreground"> {t("keyProgressPanel.mastered")}</span>
              </span>
            </div>
            <div className="w-px h-5 bg-border/60" />
            {focusKey ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    {t("keyProgressPanel.focus")}{" "}
                    <span className="font-mono text-primary">{focusKey.toUpperCase()}</span>
                  </span>
                </div>
                <FocusThresholds
                  focusKey={focusKey}
                  keyConfidences={keyConfidences}
                  targetCpm={targetCpm}
                  recoverKeys={recoverKeys}
                  inline
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CircleCheck className="h-3.5 w-3.5" />
                {t("keyProgressPanel.readyForUnlock")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              ref={settingsButtonRef}
              type="button"
              data-tour="options-button"
              onClick={() => setSettingsOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <SlidersHorizontal className="h-3 w-3" />
              {t("keyProgressPanel.options")}
            </button>
            <span className="rounded-full border border-border/50 bg-background/70 px-2 py-1 text-[10px] font-mono text-muted-foreground">
              {t("keyProgressPanel.round", { n: roundNumber })}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? t("keyProgressPanel.collapse") : t("keyProgressPanel.details")}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            ref={settingsPanelRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            data-tour="options-panel"
            className="absolute right-0 top-full z-30 mt-2 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {t("keyProgressPanel.title")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("keyProgressPanel.subtitle")}
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {targetCpm} CPM ({Math.round(targetCpm / 5)} WPM)
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {ADAPTIVE_TARGET_PRESETS.map((preset) => {
                  const isActive = targetCpm === preset.cpm
                  return (
                    <Button
                      key={preset.cpm}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="h-auto min-w-[102px] flex-col items-start gap-0.5 px-3 py-2 text-left"
                      onClick={() => onTargetChange?.(preset.cpm)}
                    >
                      <span className="text-xs font-medium">
                        {preset.label}
                        {preset.cpm === DEFAULT_TARGET_CPM && ` ${t("keyProgressPanel.defaultSuffix")}`}
                      </span>
                      <span className="font-mono text-[11px]">{preset.cpm} CPM</span>
                      <span className="text-[10px] opacity-70">{preset.description}</span>
                    </Button>
                  )
                })}
              </div>

              <Slider
                value={[targetCpm]}
                onValueChange={(value) =>
                  onTargetChange?.(Array.isArray(value) ? value[0] : value)
                }
                min={MIN_TARGET_CPM}
                max={MAX_TARGET_CPM}
                step={5}
              />

              <div className="rounded-xl border border-border/50 bg-secondary/30 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {t("keyProgressPanel.requireCurrentMastery")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("keyProgressPanel.requireCurrentMasteryDesc")}
                    </div>
                  </div>
                  <Switch
                    checked={recoverKeys}
                    onCheckedChange={(checked) => onRecoverChange?.(checked)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4 xl:grid-cols-7">
          <InlineMetric
            label={t("keyProgressPanel.stats.speed")}
            value={formatSummaryValue(hasSummaryData, globalSummary.speed.last, "wpm", 1)}
            icon={<Gauge className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.speed.delta, "wpm", 1) : undefined}
            deltaValue={globalSummary.speed.delta}
            accent
          />
          <InlineMetric
            label={t("keyProgressPanel.stats.accuracy")}
            value={formatSummaryValue(hasSummaryData, globalSummary.accuracy.last, "%", 1)}
            icon={<Target className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.accuracy.delta, "%", 1) : undefined}
            deltaValue={globalSummary.accuracy.delta}
          />
          <InlineMetric
            label={t("keyProgressPanel.stats.score")}
            value={formatSummaryValue(hasSummaryData, globalSummary.score.last, "", 0)}
            icon={<TrendingUp className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.score.delta, "", 0) : undefined}
            deltaValue={globalSummary.score.delta}
            tooltip={t("keyProgressPanel.scoreTooltip")}
          />
          <InlineMetric
            label={t("keyProgressPanel.stats.integrity")}
            value={formatSummaryValue(hasIntegrityData, globalSummary.integrity.last, "%", 0)}
            icon={<Music className="h-3 w-3" />}
            delta={showIntegrityDelta ? formatDelta(globalSummary.integrity.delta, "%", 0) : undefined}
            deltaValue={globalSummary.integrity.delta}
            tooltip={t("keyProgressPanel.integrityTooltip")}
          />
          <InlineMetric
            label={t("keyProgressPanel.stats.target")}
            value={`${targetCpm} cpm`}
            icon={<Activity className="h-3 w-3" />}
          />
          <InlineMetric
            label={t("keyProgressPanel.stats.clicks")}
            value={formatSummaryValue(hasSummaryData, globalSummary.clicks.last, "", 0)}
            icon={<Keyboard className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.clicks.delta, "", 0) : undefined}
            deltaValue={globalSummary.clicks.delta}
          />
          <InlineMetric
            label={t("keyProgressPanel.stats.cps")}
            value={formatSummaryValue(hasSummaryData, globalSummary.cps.last, "cps", 1)}
            icon={<Zap className="h-3 w-3" />}
            delta={showDelta ? formatDelta(globalSummary.cps.delta, "cps", 1) : undefined}
            deltaValue={globalSummary.cps.delta}
          />
        </div>
      </div>

      <div className="mt-2 flex gap-1 flex-wrap justify-center">
        {keyConfidences.map((kc) => (
          <motion.button
            key={kc.key}
            type="button"
            onClick={() => {
              if (!kc.unlocked && onUnlockKey) {
                setUnlockPromptKey(kc.key)
              }
            }}
            whileHover={
              !kc.unlocked
                ? { rotate: [0, -8, 8, -6, 6, 0], scale: 1.06 }
                : undefined
            }
            transition={{ duration: 0.32, ease: "easeOut" }}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono font-medium border transition-all",
              getAdaptiveKeyToneClass(kc, recoverKeys),
              !kc.unlocked && onUnlockKey && "cursor-pointer hover:border-primary/40 hover:bg-primary/5",
              kc.focused && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background scale-110",
            )}
            title={
              kc.unlocked
                ? `${kc.key.toUpperCase()}: ${Math.round(kc.speed * 5)} CPM (target ${targetCpm}), ${Math.round(kc.confidence * 100)}% of target`
                : t("keyProgressPanel.lockedTitle", { key: kc.key.toUpperCase() })
            }
          >
            {kc.unlocked ? kc.key.toUpperCase() : <Lock className="h-2.5 w-2.5" />}
          </motion.button>
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
                  label={t("keyProgressPanel.summary.avgSpeed")}
                  value={formatSummaryValue(hasSummaryData, globalSummary.speed.avg, "wpm", 1)}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.avgAccuracy")}
                  value={formatSummaryValue(hasSummaryData, globalSummary.accuracy.avg, "%", 1)}
                  icon={<Target className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.avgScore")}
                  value={formatSummaryValue(hasSummaryData, globalSummary.score.avg, "", 0)}
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.avgIntegrity")}
                  value={formatSummaryValue(hasIntegrityData, globalSummary.integrity.avg, "%", 0)}
                  icon={<Music className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.sessions")}
                  value={String(totalSessions)}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.totalClicks")}
                  value={formatSummaryValue(hasSummaryData, globalSummary.clicks.total, "", 0)}
                  icon={<Keyboard className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.avgCps")}
                  value={formatSummaryValue(hasSummaryData, globalSummary.cps.avg, "cps", 1)}
                  icon={<Zap className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.avgConfidence")}
                  value={`${Math.round(avgConfidence * 100)}%`}
                  icon={<Activity className="h-3.5 w-3.5" />}
                />
                <SummaryMetricCard
                  label={t("keyProgressPanel.summary.unlockReadiness")}
                  value={`${readyToUnlockCount}/${progressionKeys.length || 0} keys ready`}
                  icon={<CircleCheck className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-foreground">
                      {t("keyProgressPanel.summary.unlockReadiness")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {readyToUnlockCount === progressionKeys.length
                        ? t("keyProgressPanel.unlockReadiness.allMet")
                        : t("keyProgressPanel.unlockReadiness.blocking", {
                            count: blockingKeys.length,
                          })}
                    </div>
                  </div>
                  {blockingKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {blockingKeys.slice(0, 4).map((kc) => (
                        <UnlockBlockerBadge
                          key={kc.key}
                          keyConf={kc}
                          recoverKeys={recoverKeys}
                        />
                      ))}
                      {blockingKeys.length > 4 && (
                        <span className="self-center text-[10px] text-muted-foreground">
                          {t("keyProgressPanel.moreBlockers", { n: blockingKeys.length - 4 })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("keyProgressPanel.unlockedKeys")}
                </span>
                <div className="grid gap-2 lg:grid-cols-2">
                  {unlockedKeys.map((kc) => (
                    <KeyStatCard
                      key={kc.key}
                      keyConf={kc}
                      isFocus={kc.key === focusKey}
                      targetCpm={targetCpm}
                      recoverKeys={recoverKeys}
                    />
                  ))}
                </div>
              </div>

              {lockedKeys.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("keyProgressPanel.nextToUnlock")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("keyProgressPanel.lockedManualHint")}
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
                        {t("keyProgressPanel.moreBlockers", { n: lockedKeys.length - 5 })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={unlockPromptKey !== null} onOpenChange={(open) => !open && setUnlockPromptKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("keyProgressPanel.unlockDialog.title", {
                key: unlockPromptKey?.toUpperCase() ?? "",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("keyProgressPanel.unlockDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockPromptKey(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmUnlock}
              disabled={!unlockPromptKey || unlockingKey === unlockPromptKey}
            >
              {unlockingKey === unlockPromptKey
                ? t("keyProgressPanel.unlockDialog.unlocking")
                : t("keyProgressPanel.unlockDialog.unlock")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KeyStatCard({
  keyConf,
  isFocus,
  targetCpm,
  recoverKeys,
}: {
  keyConf: KeyConfidence
  isFocus: boolean
  targetCpm: number
  recoverKeys: boolean
}) {
  const { t } = useTranslation()
  const ewmaCpm = Math.round(keyConf.speed * 5)
  const bestCpm = Math.round(keyConf.bestConfidence * targetCpm)
  const checks = getKeyUnlockChecks(keyConf, recoverKeys)
  const readiness = Object.values(checks).filter(Boolean).length
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-background/50 p-3",
        isFocus && "bg-primary/5 border border-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-bold border",
              getAdaptiveKeyToneClass(keyConf, recoverKeys),
            )}
          >
            {keyConf.key.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {keyConf.key.toUpperCase()}
              {isFocus && <span className="ml-1.5 text-xs text-primary">Focus</span>}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {readiness}/4 unlock checks passed
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-medium text-foreground">{ewmaCpm} cpm</div>
          <div className="text-[11px] text-muted-foreground">
            {Math.round(keyConf.confidence * 100)}% target
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", getAdaptiveKeyBarClass(keyConf, recoverKeys))}
            style={{ width: `${Math.min(keyConf.confidence * 100, 100)}%`, transition: "width 0.3s" }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <StatChip label={t("keyProgressPanel.keyStats.current")} value={`${ewmaCpm} cpm`} />
        <StatChip label={t("keyProgressPanel.keyStats.best")} value={`${bestCpm} cpm`} />
        <StatChip label={t("keyProgressPanel.keyStats.recent")} value={`${keyConf.accuracy.toFixed(0)}%`} />
        <StatChip label={t("keyProgressPanel.keyStats.lifetime")} value={`${keyConf.lifetimeAccuracy.toFixed(0)}%`} />
        <StatChip label={t("keyProgressPanel.keyStats.hits")} value={`${keyConf.samples}`} />
        <StatChip
          label={t("keyProgressPanel.keyStats.forecast")}
          value={
            keyConf.learningRate?.remainingLessons != null
              ? `~${keyConf.learningRate.remainingLessons}`
              : "—"
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <GateChip
          label={t("keyProgressPanel.gates.targetCpm", { cpm: targetCpm })}
          met={checks.speed}
        />
        <GateChip
          label={t("keyProgressPanel.gates.minHits", { n: MIN_HITS_FOR_MASTERY })}
          met={checks.hits}
        />
        <GateChip
          label={t("keyProgressPanel.gates.recentRate", {
            n: Math.round(MIN_RECENT_ACCURACY_FOR_MASTERY * 100),
          })}
          met={checks.recentAccuracy}
        />
        <GateChip
          label={t("keyProgressPanel.gates.lifetimeRate", {
            n: Math.round(MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100),
          })}
          met={checks.lifetimeAccuracy}
        />
      </div>
    </div>
  )
}

function UnlockBlockerBadge({
  keyConf,
  recoverKeys,
}: {
  keyConf: KeyConfidence
  recoverKeys: boolean
}) {
  const checks = getKeyUnlockChecks(keyConf, recoverKeys)
  const missing = [
    !checks.speed && "speed",
    !checks.hits && "hits",
    !checks.recentAccuracy && "recent",
    !checks.lifetimeAccuracy && "lifetime",
  ].filter(Boolean)

  return (
    <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-700 dark:text-amber-400">
      <span className="font-mono font-medium">{keyConf.key.toUpperCase()}</span>
      <span className="ml-1 opacity-80">{missing.join(" · ")}</span>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-secondary/20 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
      <div className="mt-0.5 font-mono font-medium text-foreground">{value}</div>
    </div>
  )
}

function GateChip({ label, met }: { label: string; met: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-medium",
        met
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {label}
    </span>
  )
}

function InlineMetric({
  label,
  value,
  icon,
  delta,
  deltaValue,
  accent,
  tooltip,
}: {
  label: string
  value: string
  icon: React.ReactNode
  delta?: string
  deltaValue?: number
  accent?: boolean
  tooltip?: string
}) {
  const content = (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="text-muted-foreground/70">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "truncate font-mono text-[0.95rem] font-medium text-foreground",
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

  if (!tooltip) return content

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="flex min-w-0" />}>
        {content}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
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
  const { t } = useTranslation()
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
        {t("keyProgressPanel.allKeysReady")}
      </div>
    )
  }

  const unlockChecks = getKeyUnlockChecks(focus, recoverKeys)
  const ewmaCpm = Math.round(focus.speed * 5)

  const gates = [
    {
      tooltipLabel: t("keyProgressPanel.focusTooltip.speed"),
      badgeLabel: t("keyProgressPanel.gates.targetCpm", { cpm: targetCpm }),
      met: unlockChecks.speed,
      current: `${ewmaCpm} cpm`,
      target: `${targetCpm} cpm`,
    },
    {
      tooltipLabel: t("keyProgressPanel.focusTooltip.hits"),
      badgeLabel: t("keyProgressPanel.gates.minHits", { n: MIN_HITS_FOR_MASTERY }),
      met: unlockChecks.hits,
      current: `${focus.samples}`,
      target: `${MIN_HITS_FOR_MASTERY}+`,
    },
    {
      tooltipLabel: t("keyProgressPanel.focusTooltip.recentAcc"),
      badgeLabel: t("keyProgressPanel.gates.recentRate", {
        n: Math.round(MIN_RECENT_ACCURACY_FOR_MASTERY * 100),
      }),
      met: unlockChecks.recentAccuracy,
      current: `${focus.accuracy.toFixed(1)}%`,
      target: `${Math.round(MIN_RECENT_ACCURACY_FOR_MASTERY * 100)}%`,
    },
    {
      tooltipLabel: t("keyProgressPanel.focusTooltip.lifetimeAcc"),
      badgeLabel: t("keyProgressPanel.gates.lifetimeRate", {
        n: Math.round(MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100),
      }),
      met: unlockChecks.lifetimeAccuracy,
      current: `${focus.lifetimeAccuracy.toFixed(1)}%`,
      target: `${Math.round(MIN_LIFETIME_ACCURACY_FOR_MASTERY * 100)}%`,
    },
  ]

  const metCount = gates.filter((g) => g.met).length

  if (inline) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<div className={cn("flex items-center gap-1.5 cursor-default", className)} />}
        >
          <div className="flex items-center gap-[3px]">
            {gates.map((gate, i) => (
              <span
                key={i}
                className={cn(
                  "inline-block size-[6px] rounded-full",
                  gate.met
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/25",
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {t("keyProgressPanel.gatesMet", { met: metCount, total: gates.length })}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="!block max-w-[300px] px-3.5 py-3">
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold">
              {t("keyProgressPanel.focusTooltip.title", { key: focus.key.toUpperCase() })}
            </div>
            <div className="space-y-1.5">
              {gates.map((gate) => (
                <div key={gate.tooltipLabel} className="flex items-center gap-2 text-[11px]">
                  <span className={cn(
                    "text-[10px]",
                    gate.met ? "text-emerald-400" : "text-amber-400",
                  )}>
                    {gate.met ? "✓" : "✗"}
                  </span>
                  <span className="flex-1 opacity-60">{gate.tooltipLabel}</span>
                  <span className="font-mono tabular-nums">
                    {gate.current}
                  </span>
                  <span className="opacity-30">/</span>
                  <span className="font-mono tabular-nums opacity-60">
                    {gate.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-secondary/20 p-3",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Crosshair className="h-3.5 w-3.5 text-primary" />
        {t("keyProgressPanel.focusKeyThresholds")}
        <span className="font-mono text-primary">{focus.key.toUpperCase()}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {gates.map((gate) => (
          <span
            key={gate.badgeLabel}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-medium",
              gate.met
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            {gate.badgeLabel}
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
