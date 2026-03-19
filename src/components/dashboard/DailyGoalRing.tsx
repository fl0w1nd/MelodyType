import { useCallback, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { CalendarCheck, Check, Flame } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { DailyGoal, TypingSession } from "@/lib/db"
import { computeStoredSessionAccuracyMetrics } from "@/engine/typing/accuracyMetrics"
import { useAppSetting, setAppSetting } from "@/lib/settings"

const MAX = 120
const STEP = 5
const R = 70
const CX = 100
const CY = 100
const SW = 8
const THUMB_R = 11
const HIT_ZONE = 24

function minutesToAngle(min: number) {
  return (min / MAX) * 360
}

function angleToMinutes(deg: number) {
  const norm = ((deg % 360) + 360) % 360
  const raw = (norm / 360) * MAX
  return Math.min(MAX, Math.max(0, Math.round(raw / STEP) * STEP))
}

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function svgArc(r: number, startDeg: number, endDeg: number) {
  if (endDeg - startDeg >= 359.99) {
    const s = polar(r, startDeg)
    const m = polar(r, startDeg + 180)
    return `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${m.x} ${m.y} A ${r} ${r} 0 1 1 ${s.x} ${s.y}`
  }
  const s = polar(r, startDeg)
  const e = polar(r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

interface DailyGoalRingProps {
  todayGoal: DailyGoal | undefined
  todaySessions: TypingSession[]
}

export function DailyGoalRing({ todayGoal, todaySessions }: DailyGoalRingProps) {
  const dailyGoalMinutes = useAppSetting("dailyGoalMinutes")
  const [dragging, setDragging] = useState(false)
  const [localMinutes, setLocalMinutes] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const target = localMinutes ?? dailyGoalMinutes
  const completed = todayGoal?.completedMinutes ?? 0
  const pct = target > 0 ? Math.min((completed / target) * 100, 100) : 0
  const done = pct >= 100 && target > 0

  const avgAcc = useMemo(() => {
    if (!todaySessions.length) return null
    return (
      todaySessions.reduce(
        (s, sess) => s + computeStoredSessionAccuracyMetrics(sess).accuracy,
        0,
      ) / todaySessions.length
    )
  }, [todaySessions])

  const toAngle = useCallback((e: PointerEvent | React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const sc = 200 / rect.width
    const dx = (e.clientX - rect.left) * sc - CX
    const dy = (e.clientY - rect.top) * sc - CY
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (deg < 0) deg += 360
    return { deg, dist: Math.sqrt(dx * dx + dy * dy) }
  }, [])

  const onDown = useCallback(
    (e: React.PointerEvent) => {
      const info = toAngle(e)
      if (!info || info.dist < R - HIT_ZONE || info.dist > R + HIT_ZONE) return
      e.preventDefault()
      setLocalMinutes(angleToMinutes(info.deg))
      setDragging(true)
      svgRef.current?.setPointerCapture(e.pointerId)
    },
    [toAngle],
  )

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      const info = toAngle(e)
      if (!info) return
      setLocalMinutes(angleToMinutes(info.deg))
    },
    [dragging, toAngle],
  )

  const onUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    if (localMinutes != null) void setAppSetting("dailyGoalMinutes", localMinutes)
    setLocalMinutes(null)
  }, [dragging, localMinutes])

  const targetAngle = minutesToAngle(target)
  const progressAngle = minutesToAngle(Math.min(completed, target))
  const thumb = polar(R, targetAngle)

  const ticks = useMemo(() => {
    const out: { p1: ReturnType<typeof polar>; p2: ReturnType<typeof polar>; major: boolean }[] = []
    for (let m = 0; m < MAX; m += 5) {
      const deg = minutesToAngle(m)
      const major = m % 30 === 0
      const r1 = R + SW / 2 + 2
      const r2 = R + SW / 2 + (major ? 8 : 4)
      out.push({ p1: polar(r1, deg), p2: polar(r2, deg), major })
    }
    return out
  }, [])

  const labels = useMemo(
    () =>
      [0, 30, 60, 90].map((m) => ({
        m,
        pos: polar(R + SW / 2 + 16, minutesToAngle(m)),
      })),
    [],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Today&apos;s Goal
          </h3>
          {done && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5"
            >
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-500">Done</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-5 pb-5 pt-1">
        {/* Circular Dial */}
        <div className="relative w-[180px] h-[180px]">
          <svg
            ref={svgRef}
            viewBox="0 0 200 200"
            className="w-full h-full select-none"
            style={{ touchAction: "none" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            role="slider"
            aria-label="Daily practice goal in minutes"
            aria-valuemin={0}
            aria-valuemax={120}
            aria-valuenow={target}
          >
            {/* Graduation ticks */}
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.p1.x}
                y1={t.p1.y}
                x2={t.p2.x}
                y2={t.p2.y}
                stroke="currentColor"
                className={t.major ? "text-muted-foreground/35" : "text-muted-foreground/15"}
                strokeWidth={t.major ? 1.5 : 0.8}
                strokeLinecap="round"
              />
            ))}

            {/* Minute labels */}
            {labels.map(({ m, pos }) => (
              <text
                key={m}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-muted-foreground/30 pointer-events-none select-none"
                style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
              >
                {m}
              </text>
            ))}

            {/* Background track */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="currentColor"
              className="text-secondary/50"
              strokeWidth={SW}
            />

            {/* Target arc */}
            {targetAngle > 0.5 && (
              <path
                d={svgArc(R, 0, Math.min(targetAngle, 359.99))}
                fill="none"
                stroke="currentColor"
                className={done ? "text-emerald-500/20" : "text-primary/20"}
                strokeWidth={SW}
                strokeLinecap="round"
              />
            )}

            {/* Progress arc */}
            {completed > 0 && progressAngle > 0.5 && (
              <motion.path
                d={svgArc(R, 0, Math.min(progressAngle, 359.99))}
                fill="none"
                stroke="currentColor"
                className={done ? "text-emerald-500" : "text-primary"}
                strokeWidth={SW}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
              />
            )}

            {/* Thumb */}
            <circle
              cx={thumb.x}
              cy={thumb.y}
              r={dragging ? THUMB_R + 2 : THUMB_R}
              fill="currentColor"
              className={done ? "text-emerald-500" : "text-primary"}
              style={{
                stroke: "hsl(var(--background))",
                strokeWidth: 3,
                cursor: dragging ? "grabbing" : "grab",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))",
                transition: "r 0.15s ease",
              }}
            />
          </svg>

          {/* Center display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.span
              className="text-3xl font-mono font-bold tabular-nums leading-none"
              key={target}
              initial={false}
              animate={{ scale: [0.96, 1] }}
              transition={{ duration: 0.1 }}
            >
              {target}
            </motion.span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">
              minutes
            </span>
          </div>
        </div>

        {/* Completed progress */}
        {completed > 0 && (
          <div className="flex items-center gap-1.5 -mt-1">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-mono font-medium tabular-nums">
              {Math.round(completed * 10) / 10}
            </span>
            <span className="text-xs text-muted-foreground">/ {target} min</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {[
            {
              label: "Progress",
              value: `${Math.round(pct)}%`,
              tooltip: "Percentage of your daily practice time goal completed",
            },
            {
              label: "Sessions",
              value: (todayGoal?.sessionsCount ?? 0).toString(),
              tooltip: "Number of practice sessions completed today",
            },
            {
              label: "Best WPM",
              value: todayGoal ? Math.round(todayGoal.bestWpm).toString() : "—",
              tooltip: "Your highest typing speed achieved in today's sessions",
            },
            {
              label: "Avg Acc",
              value: avgAcc != null ? `${avgAcc.toFixed(1)}%` : "—",
              tooltip: "Average accuracy across all of today's practice sessions",
            },
          ].map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger render={<div className="rounded-xl bg-secondary/30 p-2.5 text-center" />}>
                <div className="text-sm font-mono font-bold tabular-nums">{item.value}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  {item.label}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-center">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
