import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { TypingSession } from "@/lib/db"

interface WpmChartProps {
  sessions: TypingSession[]
  title?: string
}

export function WpmChart({ sessions, title = "WPM Over Time" }: WpmChartProps) {
  const data = sessions
    .slice(-30)
    .map((s, i) => ({
      index: i + 1,
      wpm: Math.round(s.wpm),
      accuracy: Math.round(s.accuracy * 10) / 10,
      date: new Date(s.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Complete some practice sessions to see your progress
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.55 0.15 55)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.55 0.15 55)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid oklch(0.9 0.01 75)",
                backgroundColor: "oklch(0.995 0.003 80)",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="wpm"
              stroke="oklch(0.55 0.15 55)"
              strokeWidth={2}
              fill="url(#wpmGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function AccuracyChart({ sessions, title = "Accuracy Trend" }: WpmChartProps) {
  const data = sessions
    .slice(-30)
    .map((s, i) => ({
      index: i + 1,
      accuracy: Math.round(s.accuracy * 10) / 10,
      date: new Date(s.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No data yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid oklch(0.9 0.01 75)",
                backgroundColor: "oklch(0.995 0.003 80)",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}%`, "Accuracy"]}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="oklch(0.6 0.17 145)"
              strokeWidth={2}
              dot={{ r: 3, fill: "oklch(0.6 0.17 145)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
