import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"
import { type HeatmapTab } from "./KeyboardHeatmap"
import {
  aggregateDashboardPhysicalKeyStats,
  buildDashboardKeyStats,
  type DashboardKeyStats,
} from "./dashboardUtils"
import { getPhysicalKeyForLogicalChar } from "@/lib/keyboardLayout"

function formatLogicalKeyLabel(key: string): string {
  return /^[a-z]$/.test(key) ? key.toUpperCase() : key
}

interface KeyDetailPanelProps {
  sessions: TypingSession[]
  activeTab: HeatmapTab
  selectedLogicalKey: string | null
  keyStatsMap?: Map<string, DashboardKeyStats>
}

export function KeyDetailPanel({
  sessions,
  activeTab,
  selectedLogicalKey,
  keyStatsMap,
}: KeyDetailPanelProps) {
  const { t } = useTranslation()

  const perKeyData = useMemo(
    () => keyStatsMap ?? buildDashboardKeyStats(sessions),
    [keyStatsMap, sessions],
  )
  const selected = useMemo(
    () => (selectedLogicalKey ? perKeyData.get(selectedLogicalKey) ?? null : null),
    [perKeyData, selectedLogicalKey],
  )

  if (!selected) return null

  const selectedPhysicalKey = selectedLogicalKey
    ? getPhysicalKeyForLogicalChar(selectedLogicalKey)?.physicalKey ?? selectedLogicalKey
    : null
  const sharedPhysicalStats = activeTab !== "transitions" && selectedPhysicalKey
    ? aggregateDashboardPhysicalKeyStats(perKeyData, selectedPhysicalKey)
    : null
  const sharedTotalPresses = sharedPhysicalStats && sharedPhysicalStats.logicalKeys.length > 1
    ? sharedPhysicalStats.totalPresses
    : selected.totalPresses
  const selectedLabel = formatLogicalKeyLabel(selected.key)

  const falseRatePct = selected.falseRate == null
    ? "—"
    : `${(selected.falseRate * 100).toFixed(1)}%`
  const keyAccuracyPct = selected.keyAccuracy == null
    ? "—"
    : `${(selected.keyAccuracy * 100).toFixed(1)}%`
  const keyAccuracyValue = selected.keyAccuracy == null
    ? undefined
    : selected.keyAccuracy * 100
  const chartData = selected.recentSamples.map((sample) => ({
    ...sample,
    tooltipLabel: `Session ${sample.session}`,
  }))

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeTab}:${selected.key}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex min-w-12 h-12 px-2 items-center justify-center rounded-xl bg-primary/10 font-mono text-lg font-bold text-primary">
            {selectedLabel}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {t("keyDetailPanel.totalPresses", { n: sharedTotalPresses })}
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-md font-medium",
                  selected.falseRate != null && selected.falseRate > 0.1
                    ? "bg-destructive/10 text-destructive"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {t("keyDetailPanel.falsePct", { pct: falseRatePct })}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t("keyDetailPanel.statsNote")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>{t("keyDetailPanel.trend")}</span>
              {selected.learningRate > 1 ? (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  {t("keyDetailPanel.trendUp", { n: selected.learningRate.toFixed(1) })}
                </span>
              ) : selected.learningRate < -1 ? (
                <span className="flex items-center gap-0.5 text-destructive">
                  <TrendingDown className="h-3 w-3" />
                  {t("keyDetailPanel.trendDown", { n: selected.learningRate.toFixed(1) })}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Minus className="h-3 w-3" />
                  {t("keyDetailPanel.trendStable")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums">
                {selected.successPresses}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                {t("keyDetailPanel.stats.success")}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              {t("keyDetailPanel.tooltips.success")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums text-destructive">
                {selected.misPresses}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                {t("keyDetailPanel.stats.misPresses")}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              {t("keyDetailPanel.tooltips.misPresses")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {selected.falsePresses}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                {t("keyDetailPanel.stats.false")}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-center">
              {t("keyDetailPanel.tooltips.false")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums">
                {selected.keyAccuracy == null ? "—" : `${Math.round(selected.keyAccuracy * 100)}%`}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                {t("keyDetailPanel.stats.keyAccuracy")}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              {t("keyDetailPanel.tooltips.keyAccuracy")}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("keyDetailPanel.stats.keyAccuracy")}</span>
            <span className="font-mono tabular-nums">{keyAccuracyPct}</span>
          </div>
          <Progress value={keyAccuracyValue ?? 0} className="h-1.5" />
        </div>

        {selected.recentSamples.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              {t("keyDetailPanel.keyAccuracyLabel", { n: selected.recentSamples.length })}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 6, bottom: 16, left: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="session"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: t("keyDetailPanel.chartLabels.session"),
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 10,
                  }}
                />
                <YAxis
                  dataKey="accuracy"
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    fontSize: "11px",
                    padding: "6px 10px",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel ?? ""}
                  formatter={(value) => [
                    `${Number(value).toFixed(0)}%`,
                    t("keyDetailPanel.chartLabels.keyAccuracy"),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--chart-2)"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: "var(--chart-2)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "var(--chart-2)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
