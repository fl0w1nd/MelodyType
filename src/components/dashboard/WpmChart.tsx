import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Target, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"
import { TimeRangeSelector, type TimeRange } from "./TimeRangeSelector"
import {
  filterSessionsByRange,
  aggregateSessionsByRange,
  type AggregatedDataPoint,
} from "./dashboardUtils"

interface WpmChartProps {
  sessions: TypingSession[]
  title?: string
}

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--card)",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)",
}

function WpmChartInner({
  data,
  range,
}: {
  data: AggregatedDataPoint[]
  range: TimeRange
}) {
  const summary = useMemo(() => {
    if (data.length === 0) return null
    const avg = Math.round(data.reduce((s, d) => s + d.wpm, 0) / data.length)
    const max = Math.max(...data.map((d) => d.wpm))
    const totalSessions = data.reduce((s, d) => s + d.sessions, 0)
    return { avg, max, totalSessions }
  }, [data])

  return (
    <div>
      {summary && (
        <div className="flex items-center gap-4 px-2 mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold tabular-nums">{summary.avg}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              avg wpm
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {summary.max}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">peak</span>
          </div>
          {range !== "recent" && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-mono tabular-nums">{summary.totalSessions}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  sessions
                </span>
              </div>
            </>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="wpmGradientNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <RechartsTooltip
            contentStyle={tooltipStyle}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel ?? ""}
            formatter={(value) => [`${Number(value).toFixed(1)} wpm`, "Speed"]}
          />
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#wpmGradientNew)"
            dot={data.length < 20 ? { r: 3, fill: "var(--chart-1)", strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: "var(--chart-1)", strokeWidth: 2, stroke: "var(--card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AccuracyChartInner({ data }: { data: AggregatedDataPoint[] }) {
  const summary = useMemo(() => {
    if (data.length === 0) return null
    const avg = Math.round((data.reduce((s, d) => s + d.accuracy, 0) / data.length) * 10) / 10
    const min = Math.min(...data.map((d) => d.accuracy))
    return { avg, min }
  }, [data])

  return (
    <div>
      {summary && (
        <div className="flex items-center gap-4 px-2 mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold tabular-nums">{summary.avg}%</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">avg</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {summary.min}%
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              floor
            </span>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="accGradientNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[(dataMin: number) => Math.max(Math.floor(dataMin - 5), 0), 100]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <RechartsTooltip
            contentStyle={tooltipStyle}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel ?? ""}
            formatter={(value) => [`${Number(value).toFixed(2)}%`, "Accuracy"]}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            dot={data.length < 20 ? { r: 3, fill: "var(--chart-2)", strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: "var(--chart-2)", strokeWidth: 2, stroke: "var(--card)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartShell({
  title,
  icon,
  iconColor,
  sessions,
  className,
  children,
}: {
  title: string
  icon: React.ReactNode
  iconColor?: string
  sessions: TypingSession[]
  className?: string
  children: React.ComponentType<{ data: AggregatedDataPoint[]; range: TimeRange }>
}) {
  const [range, setRange] = useState<TimeRange>("recent")
  const filtered = useMemo(() => filterSessionsByRange(sessions, range), [sessions, range])
  const data = useMemo(() => aggregateSessionsByRange(filtered, range), [filtered, range])

  const Inner = children

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", iconColor)}>
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">{title}</h3>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>
      <div className="px-3 pb-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
            <span className="text-sm">No data for this period</span>
          </div>
        ) : (
          <Inner data={data} range={range} />
        )}
      </div>
    </motion.div>
  )
}

export function WpmChart({ sessions, title = "Speed Progress" }: WpmChartProps) {
  return (
    <ChartShell
      title={title}
      icon={<TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
      iconColor="bg-amber-500/10"
      sessions={sessions}
    >
      {WpmChartInner}
    </ChartShell>
  )
}

export function AccuracyChart({ sessions, title = "Accuracy Trend" }: WpmChartProps) {
  return (
    <ChartShell
      title={title}
      icon={<Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
      iconColor="bg-emerald-500/10"
      sessions={sessions}
    >
      {AccuracyChartInner}
    </ChartShell>
  )
}
