import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import {
  Clock,
  Star,
  Hash,
  AtSign,
  Trophy,
  ChevronRight,
  Gauge,
  Target,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  TIME_LEVELS,
  TIER_ORDER,
  TIER_META,
  getLevelsByTier,
  getStars,
  type TimeLevel,
  type TimeTier,
  type LevelRecord,
} from "@/engine/typing/timeLevels"
import { getTimeLevelRecords } from "@/engine/practice/sessionQueries"

interface TimeLevelSelectProps {
  onSelectLevel: (level: TimeLevel) => void
}

export function TimeLevelSelect({ onSelectLevel }: TimeLevelSelectProps) {
  const records = useLiveQuery(
    () => getTimeLevelRecords(),
    [],
    {} as Record<string, LevelRecord>,
  )

  const totalStars = TIME_LEVELS.reduce(
    (sum, l) => sum + getStars(records[l.id] ?? null),
    0,
  )
  const maxStars = TIME_LEVELS.length * 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Header stats */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="font-mono font-semibold text-foreground">
            {totalStars}
          </span>
          <span>/ {maxStars}</span>
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
        </div>
      </div>

      {/* Tier sections */}
      <div className="flex flex-col gap-8">
        {TIER_ORDER.map((tier, ti) => (
          <TierSection
            key={tier}
            tier={tier}
            levels={getLevelsByTier(tier)}
            records={records}
            onSelect={onSelectLevel}
            delay={ti * 0.08}
          />
        ))}
      </div>
    </motion.div>
  )
}

function TierSection({
  tier,
  levels,
  records,
  onSelect,
  delay,
}: {
  tier: TimeTier
  levels: TimeLevel[]
  records: Record<string, LevelRecord>
  onSelect: (level: TimeLevel) => void
  delay: number
}) {
  const meta = TIER_META[tier]
  const tierStars = levels.reduce(
    (sum, l) => sum + getStars(records[l.id] ?? null),
    0,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${meta.color}`}>
          {meta.label}
        </h3>
        <div className="flex-1 h-px bg-border/40" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          <span className="font-mono">{tierStars}/{levels.length * 3}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {levels.map((level, i) => (
          <LevelCard
            key={level.id}
            level={level}
            record={records[level.id] ?? null}
            onSelect={onSelect}
            delay={delay + i * 0.04}
          />
        ))}
      </div>
    </motion.div>
  )
}

function LevelCard({
  level,
  record,
  onSelect,
  delay,
}: {
  level: TimeLevel
  record: LevelRecord | null
  onSelect: (level: TimeLevel) => void
  delay: number
}) {
  const stars = getStars(record)
  const meta = TIER_META[level.tier]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <Card
        className={`group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 bg-gradient-to-br ${meta.gradient} border-border/50`}
        onClick={() => onSelect(level)}
      >
        <div className="p-4">
          {/* Top row: name + stars */}
          <div className="flex items-start justify-between mb-1.5">
            <h4 className="text-sm font-semibold text-foreground leading-tight">
              {level.name}
            </h4>
            <div className="flex gap-0.5 shrink-0 ml-2">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= stars
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {level.description}
          </p>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {level.timeLimit}s
            </span>
            <span className="inline-flex items-center rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
              {level.difficulty}
            </span>
            {level.punctuation && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <AtSign className="h-2.5 w-2.5" />
              </span>
            )}
            {level.numbers && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Hash className="h-2.5 w-2.5" />
              </span>
            )}
          </div>

          {/* Bottom row: best record or "Not attempted" */}
          <div className="flex items-center justify-between">
            {record && record.attempts > 0 ? (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Gauge className="h-3 w-3" />
                  <span className="font-mono font-semibold text-foreground">
                    {Math.round(record.bestWpm)}
                  </span>
                  WPM
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span className="font-mono font-semibold text-foreground">
                    {record.bestAccuracy.toFixed(1)}%
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground/50 italic">
                Not attempted
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
