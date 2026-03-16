import { useMemo, useState } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { KeyboardIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"

interface KeyDetailPanelProps {
  sessions: TypingSession[]
  title?: string
}

interface PerKeyData {
  key: string
  totalHits: number
  errors: number
  errorRate: number
  avgLatency: number
  recentSamples: { session: number; speed: number }[]
  learningRate: number
}

export function KeyDetailPanel({ sessions, title = "Per-Key Analysis" }: KeyDetailPanelProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const perKeyData = useMemo(() => {
    const map = new Map<string, PerKeyData>()

    const recentSessions = sessions.slice(-20)
    for (let si = 0; si < recentSessions.length; si++) {
      const session = recentSessions[si]
      const keyHits: Record<string, { correct: number; total: number }> = {}
      for (const k of session.keystrokes) {
        if (k.key.length !== 1 || k.key === " ") continue
        const lower = k.key.toLowerCase()
        if (!keyHits[lower]) keyHits[lower] = { correct: 0, total: 0 }
        keyHits[lower].total++
        if (k.correct) keyHits[lower].correct++
      }

      for (const [key, counts] of Object.entries(keyHits)) {
        const data = map.get(key) ?? {
          key,
          totalHits: 0,
          errors: 0,
          errorRate: 0,
          avgLatency: 0,
          recentSamples: [],
          learningRate: 0,
        }
        data.totalHits += counts.total
        data.errors += counts.total - counts.correct
        if (counts.total > 0) {
          const speed = Math.round((counts.correct / counts.total) * 100)
          data.recentSamples.push({ session: si + 1, speed })
        }
        map.set(key, data)
      }
    }

    for (const data of map.values()) {
      data.errorRate = data.totalHits > 0 ? data.errors / data.totalHits : 0
    }

    for (const session of sessions) {
      const perKeyTimestamps = new Map<string, number[]>()
      for (const stroke of session.keystrokes) {
        const key = stroke.key.toLowerCase()
        if (!stroke.correct || key.length !== 1 || key < "a" || key > "z") continue
        const existing = perKeyTimestamps.get(key) ?? []
        existing.push(stroke.timestamp)
        perKeyTimestamps.set(key, existing)
      }

      for (const [key, timestamps] of perKeyTimestamps) {
        if (timestamps.length < 2) continue
        const latencies: number[] = []
        for (let i = 1; i < timestamps.length; i++) {
          const latency = timestamps[i] - timestamps[i - 1]
          if (latency > 0) {
            latencies.push(latency)
          }
        }
        if (latencies.length === 0) continue
        const avgLatency = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
        const data = map.get(key)
        if (data) {
          data.avgLatency = data.avgLatency > 0 ? (data.avgLatency + avgLatency) / 2 : avgLatency
        }
      }
    }

    for (const data of map.values()) {
      const samples = data.recentSamples
      if (samples.length >= 3) {
        const firstHalf = samples.slice(0, Math.floor(samples.length / 2))
        const secondHalf = samples.slice(Math.floor(samples.length / 2))
        const avgFirst =
          firstHalf.reduce((a, b) => a + b.speed, 0) / firstHalf.length
        const avgSecond =
          secondHalf.reduce((a, b) => a + b.speed, 0) / secondHalf.length
        data.learningRate = avgSecond - avgFirst
      }
    }

    return [...map.values()].sort((a, b) => b.totalHits - a.totalHits)
  }, [sessions])

  const selected = selectedKey
    ? perKeyData.find((d) => d.key === selectedKey)
    : perKeyData[0]

  if (perKeyData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyboardIcon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Complete some practice sessions to see per-key statistics
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyboardIcon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          {/* Key selector */}
          <div className="flex flex-wrap lg:flex-col gap-1.5 lg:max-h-80 lg:overflow-y-auto lg:pr-2">
            {perKeyData.map((data) => (
              <button
                key={data.key}
                onClick={() => setSelectedKey(data.key)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors min-w-[60px]",
                  (selected?.key === data.key)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 hover:bg-secondary text-foreground",
                )}
              >
                <span className="font-mono font-bold text-base w-5 text-center">
                  {data.key.toUpperCase()}
                </span>
                <span className="text-[10px] opacity-70">
                  {data.totalHits}
                </span>
              </button>
            ))}
          </div>

          {/* Detail view */}
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-mono text-2xl font-bold text-primary">
                  {selected.key.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {selected.totalHits} keystrokes
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        selected.errorRate > 0.1
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-700",
                      )}
                    >
                      {(selected.errorRate * 100).toFixed(1)}% error rate
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <span>Learning rate:</span>
                    {selected.learningRate > 1 ? (
                      <span className="flex items-center gap-0.5 text-emerald-600">
                        <TrendingUp className="h-3 w-3" />+
                        {selected.learningRate.toFixed(1)}%
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

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-secondary/40 p-3 text-center">
                  <div className="text-lg font-mono font-bold">
                    {selected.totalHits - selected.errors}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Correct
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3 text-center">
                  <div className="text-lg font-mono font-bold text-destructive">
                    {selected.errors}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Errors
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3 text-center">
                  <div className="text-lg font-mono font-bold">
                    {((1 - selected.errorRate) * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Accuracy
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-mono">
                    {((1 - selected.errorRate) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(1 - selected.errorRate) * 100}
                  className="h-2"
                />
              </div>

              {selected.recentSamples.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Accuracy per session (recent {selected.recentSamples.length}{" "}
                    sessions)
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="session"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: "Session",
                          position: "insideBottom",
                          offset: -2,
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        dataKey="speed"
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                        label={{
                          value: "%",
                          position: "insideLeft",
                          offset: 5,
                          fontSize: 10,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid oklch(0.9 0.01 75)",
                          backgroundColor: "oklch(0.995 0.003 80)",
                          fontSize: "11px",
                        }}
                        formatter={(value) => [
                          `${value}%`,
                          "Accuracy",
                        ]}
                      />
                      <Scatter data={selected.recentSamples}>
                        {selected.recentSamples.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              entry.speed >= 90
                                ? "oklch(0.6 0.17 145)"
                                : entry.speed >= 70
                                  ? "oklch(0.55 0.15 55)"
                                  : "oklch(0.577 0.245 27.325)"
                            }
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
