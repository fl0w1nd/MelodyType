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
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"
import { buildDashboardKeyStats } from "./dashboardUtils"

interface KeyDetailPanelProps {
  sessions: TypingSession[]
  selectedKey: string | null
}

export function KeyDetailPanel({ sessions, selectedKey }: KeyDetailPanelProps) {
  const perKeyData = useMemo(() => buildDashboardKeyStats(sessions), [sessions])
  const selected = selectedKey ? perKeyData.get(selectedKey) : undefined

  if (!selectedKey || !selected) return null

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
        key={selected.key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-mono text-2xl font-bold text-primary">
            {selected.key.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{selected.totalPresses} Total Presses</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-md font-medium",
                  selected.falseRate != null && selected.falseRate > 0.1
                    ? "bg-destructive/10 text-destructive"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {falseRatePct} false
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Success/False are target-key stats. Mis-presses are actual wrong presses of this key.
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>Trend:</span>
              {selected.learningRate > 1 ? (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />+{selected.learningRate.toFixed(1)}%
                </span>
              ) : selected.learningRate < -1 ? (
                <span className="flex items-center gap-0.5 text-destructive">
                  <TrendingDown className="h-3 w-3" />
                  {selected.learningRate.toFixed(1)}%
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Minus className="h-3 w-3" />
                  Stable
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
                Success
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              Times this key was correctly pressed when it was the expected target
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums text-destructive">
                {selected.misPresses}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                Mis-presses
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              Times this key was physically pressed when a different key was expected — indicates you hit the wrong key
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {selected.falsePresses}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                False
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-center">
              Times you failed to press this key correctly on the first attempt when it was expected
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-3 text-center" />}>
              <div className="text-base font-mono font-bold tabular-nums">
                {selected.keyAccuracy == null ? "—" : `${Math.round(selected.keyAccuracy * 100)}%`}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                Key Accuracy
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              Ratio of successful presses to total target occurrences for this key
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Key Accuracy</span>
            <span className="font-mono tabular-nums">{keyAccuracyPct}</span>
          </div>
          <Progress value={keyAccuracyValue ?? 0} className="h-1.5" />
        </div>

        {selected.recentSamples.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Key accuracy per session (recent {selected.recentSamples.length})
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 6, bottom: 16, left: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="session"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Session", position: "insideBottom", offset: -2, fontSize: 10 }}
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
                  formatter={(value) => [`${Number(value).toFixed(0)}%`, "Key Accuracy"]}
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
