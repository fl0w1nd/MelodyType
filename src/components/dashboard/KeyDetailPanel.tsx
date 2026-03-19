import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TypingSession } from "@/lib/db"

interface KeyDetailPanelProps {
  sessions: TypingSession[]
  selectedKey: string | null
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

export function KeyDetailPanel({ sessions, selectedKey }: KeyDetailPanelProps) {
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
          if (latency > 0) latencies.push(latency)
        }
        if (latencies.length === 0) continue
        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length
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
        const avgFirst = firstHalf.reduce((a, b) => a + b.speed, 0) / firstHalf.length
        const avgSecond = secondHalf.reduce((a, b) => a + b.speed, 0) / secondHalf.length
        data.learningRate = avgSecond - avgFirst
      }
    }

    return map
  }, [sessions])

  const selected = selectedKey ? perKeyData.get(selectedKey) : undefined

  if (!selectedKey || !selected) return null

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
              <span className="font-medium text-sm">{selected.totalHits} keystrokes</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-md font-medium",
                  selected.errorRate > 0.1
                    ? "bg-destructive/10 text-destructive"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {(selected.errorRate * 100).toFixed(1)}% errors
              </Badge>
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

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-secondary/30 p-3 text-center">
            <div className="text-base font-mono font-bold tabular-nums">
              {selected.totalHits - selected.errors}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              Correct
            </div>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3 text-center">
            <div className="text-base font-mono font-bold tabular-nums text-destructive">
              {selected.errors}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              Errors
            </div>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3 text-center">
            <div className="text-base font-mono font-bold tabular-nums">
              {((1 - selected.errorRate) * 100).toFixed(0)}%
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              Accuracy
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-mono tabular-nums">
              {((1 - selected.errorRate) * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={(1 - selected.errorRate) * 100} className="h-1.5" />
        </div>

        {selected.recentSamples.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Accuracy per session (recent {selected.recentSamples.length})
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <ScatterChart margin={{ top: 4, right: 4, bottom: 16, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="session"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Session", position: "insideBottom", offset: -2, fontSize: 10 }}
                />
                <YAxis
                  dataKey="speed"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    fontSize: "11px",
                    padding: "6px 10px",
                  }}
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                />
                <Scatter data={selected.recentSamples}>
                  {selected.recentSamples.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.speed >= 90
                          ? "var(--chart-2)"
                          : entry.speed >= 70
                            ? "var(--chart-1)"
                            : "var(--destructive)"
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
