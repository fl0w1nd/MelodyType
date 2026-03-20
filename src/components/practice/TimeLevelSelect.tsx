import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import {
  AtSign,
  ChevronRight,
  Clock,
  Crown,
  Hash,
  History,
  Info,
  Medal,
  Sparkles,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  TIME_GRADE_META,
  TIME_LEVELS,
  TIER_ORDER,
  compareTimeGrades,
  getGradeRequirements,
  getNextGradeRequirement,
  getLevelsByTier,
  type LevelRecord,
  type TimeLevel,
  type TimeTier,
} from "@/engine/typing/timeLevels"
import { getTimeLevelRecords } from "@/engine/practice/sessionQueries"

interface TimeLevelSelectProps {
  onSelectLevel: (level: TimeLevel) => void
}

export function TimeLevelSelect({ onSelectLevel }: TimeLevelSelectProps) {
  const { t } = useTranslation()
  const records = useLiveQuery(
    () => getTimeLevelRecords(),
    [],
    {} as Record<string, LevelRecord>,
  )
  const [inspectedLevel, setInspectedLevel] = useState<TimeLevel | null>(null)

  const playedLevels = TIME_LEVELS.filter((level) => records[level.id] != null).length
  const strongClears = TIME_LEVELS.filter((level) => {
    const record = records[level.id]
    return record ? compareTimeGrades(record.bestGrade, "A") >= 0 : false
  }).length
  const perfectClears = TIME_LEVELS.filter((level) => {
    const record = records[level.id]
    return record?.bestGrade === "S"
  }).length

  const inspectedRecord = inspectedLevel ? records[inspectedLevel.id] ?? null : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="mb-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <HeaderStat
          icon={<History className="h-4 w-4 text-primary" />}
          label={t("timeLevelSelect.stats.played")}
          value={`${playedLevels}/${TIME_LEVELS.length}`}
        />
        <HeaderStat
          icon={<Medal className="h-4 w-4 text-emerald-500" />}
          label={t("timeLevelSelect.stats.aOrBetter")}
          value={String(strongClears)}
        />
        <HeaderStat
          icon={<Crown className="h-4 w-4 text-amber-500" />}
          label={t("timeLevelSelect.stats.sClears")}
          value={String(perfectClears)}
        />
      </div>

      <div className="flex flex-col gap-8">
        {TIER_ORDER.map((tier, index) => (
          <TierSection
            key={tier}
            tier={tier}
            levels={getLevelsByTier(tier)}
            records={records}
            onSelect={onSelectLevel}
            onInspect={setInspectedLevel}
            delay={index * 0.08}
          />
        ))}
      </div>

      <LevelRecordDialog
        level={inspectedLevel}
        record={inspectedRecord}
        onClose={() => setInspectedLevel(null)}
        onStart={(level) => {
          setInspectedLevel(null)
          onSelectLevel(level)
        }}
      />
    </motion.div>
  )
}

function HeaderStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
      <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
  )
}

function TierSection({
  tier,
  levels,
  records,
  onSelect,
  onInspect,
  delay,
}: {
  tier: TimeTier
  levels: TimeLevel[]
  records: Record<string, LevelRecord>
  onSelect: (level: TimeLevel) => void
  onInspect: (level: TimeLevel) => void
  delay: number
}) {
  const { t } = useTranslation()
  const tierColor = {
    beginner: "text-emerald-600 dark:text-emerald-400",
    intermediate: "text-blue-600 dark:text-blue-400",
    advanced: "text-amber-600 dark:text-amber-400",
    expert: "text-rose-600 dark:text-rose-400",
  }[tier]

  const clearedCount = levels.filter((level) => records[level.id] != null).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="mb-3 flex items-center gap-3">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${tierColor}`}>
          {t(`tierMeta.${tier}`)}
        </h3>
        <div className="h-px flex-1 bg-border/40" />
        <div className="text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{clearedCount}</span>
          <span>{t("timeLevelSelect.tierCount", { n: levels.length })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => (
          <LevelCard
            key={level.id}
            level={level}
            record={records[level.id] ?? null}
            onSelect={onSelect}
            onInspect={onInspect}
            delay={delay + index * 0.04}
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
  onInspect,
  delay,
}: {
  level: TimeLevel
  record: LevelRecord | null
  onSelect: (level: TimeLevel) => void
  onInspect: (level: TimeLevel) => void
  delay: number
}) {
  const { t } = useTranslation()
  const tierGradient = {
    beginner: "from-emerald-500/10 to-emerald-500/5",
    intermediate: "from-blue-500/10 to-blue-500/5",
    advanced: "from-amber-500/10 to-amber-500/5",
    expert: "from-rose-500/10 to-rose-500/5",
  }[level.tier]

  const badgeClass = record
    ? TIME_GRADE_META[record.bestGrade].badge
    : "border-border/60 bg-secondary/60 text-muted-foreground"

  const levelName = t(`timeLevels.${level.id}.name`)
  const levelDesc = t(`timeLevels.${level.id}.description`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="h-full"
    >
      <Card
        className={`group relative h-full cursor-pointer overflow-hidden border-border/50 bg-gradient-to-br ${tierGradient} transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md`}
        onClick={() => onSelect(level)}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold leading-tight text-foreground">
                {levelName}
              </h4>
              <div className="min-h-[2.5rem]">
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {levelDesc}
                </p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
              {record
                ? t("timeLevelSelect.gradeBest", { grade: record.bestGrade })
                : t("timeLevelSelect.newBadge")}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <MetaTag icon={<Clock className="h-2.5 w-2.5" />}>{level.timeLimit}s</MetaTag>
            <MetaTag>{level.difficulty}</MetaTag>
            {level.punctuation && (
              <MetaTag icon={<AtSign className="h-2.5 w-2.5" />}>
                {t("timeLevelSelect.punc")}
              </MetaTag>
            )}
            {level.numbers && (
              <MetaTag icon={<Hash className="h-2.5 w-2.5" />}>
                {t("timeLevelSelect.num")}
              </MetaTag>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between">
            {record ? (
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono font-semibold text-foreground">{record.bestWpm} WPM</span>
                <span className="text-muted-foreground">{record.bestAccuracy}%</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("timeLevelSelect.notPlayed")}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-secondary/60 hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation()
                  onInspect(level)
                }}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function MetaTag({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
      {icon}
      {children}
    </span>
  )
}

function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(timestamp)
}

function LevelRecordDialog({
  level,
  record,
  onClose,
  onStart,
}: {
  level: TimeLevel | null
  record: LevelRecord | null
  onClose: () => void
  onStart: (level: TimeLevel) => void
}) {
  const { t } = useTranslation()
  if (!level) return null

  const tierColor = {
    beginner: "text-emerald-600 dark:text-emerald-400",
    intermediate: "text-blue-600 dark:text-blue-400",
    advanced: "text-amber-600 dark:text-amber-400",
    expert: "text-rose-600 dark:text-rose-400",
  }[level.tier]

  const gradeReqs = getGradeRequirements(level)
  const nextReq = record
    ? getNextGradeRequirement(level, record.bestWpm, record.bestAccuracy)
    : null

  const levelName = t(`timeLevels.${level.id}.name`)
  const levelDesc = t(`timeLevels.${level.id}.description`)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase ${tierColor}`}>
              {t(`tierMeta.${level.tier}`)}
            </span>
            <span className="text-base">{levelName}</span>
          </DialogTitle>
          <DialogDescription>{levelDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <MetaTag icon={<Clock className="h-2.5 w-2.5" />}>{level.timeLimit}s</MetaTag>
            <MetaTag>{level.difficulty}</MetaTag>
            {level.punctuation && (
              <MetaTag icon={<AtSign className="h-2.5 w-2.5" />}>
                {t("timeLevelSelect.punc")}
              </MetaTag>
            )}
            {level.numbers && (
              <MetaTag icon={<Hash className="h-2.5 w-2.5" />}>
                {t("timeLevelSelect.num")}
              </MetaTag>
            )}
          </div>

          {record ? (
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
              <div className="mb-2 text-xs font-medium text-foreground">
                {t("timeLevelSelect.dialog.record")}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <StatRow
                  label={t("timeLevelSelect.dialog.record_labels.best")}
                  value={`${record.bestWpm.toFixed(1)} WPM`}
                  sub={`${record.bestAccuracy.toFixed(1)}%`}
                  accent={TIME_GRADE_META[record.bestGrade].color}
                  badge={record.bestGrade}
                />
                <StatRow
                  label={t("timeLevelSelect.dialog.record_labels.last")}
                  value={`${record.lastWpm.toFixed(1)} WPM`}
                  sub={`${record.lastAccuracy.toFixed(1)}%`}
                  badge={record.lastGrade}
                />
                <StatRow
                  label={t("timeLevelSelect.dialog.record_labels.attempts")}
                  value={String(record.attempts)}
                />
                <StatRow
                  label={t("timeLevelSelect.dialog.record_labels.lastPlayed")}
                  value={formatShortDate(record.lastPlayedAt)}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-sm text-muted-foreground">
              {t("timeLevelSelect.dialog.noRuns")}
            </div>
          )}

          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {t("timeLevelSelect.dialog.gradeThresholds")}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["B", "A", "S"] as const).map((g) => (
                <div key={g} className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-center">
                  <div className={`text-sm font-bold ${TIME_GRADE_META[g].color}`}>{g}</div>
                  <div className="text-[10px] text-muted-foreground">{gradeReqs[g].wpm} WPM</div>
                  <div className="text-[10px] text-muted-foreground">{gradeReqs[g].accuracy}%</div>
                </div>
              ))}
            </div>
            {nextReq && (
              <div className="mt-2 text-xs text-muted-foreground">
                {t("timeLevelSelect.dialog.next")}
                {" "}
                <span className="font-semibold text-foreground">{nextReq.grade}</span>
                {nextReq.wpmGap > 0 && ` · +${nextReq.wpmGap.toFixed(1)} WPM`}
                {nextReq.accuracyGap > 0 && ` · +${nextReq.accuracyGap.toFixed(1)}%`}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("timeLevelSelect.dialog.close")}
          </Button>
          <Button onClick={() => onStart(level)}>
            {t("timeLevelSelect.dialog.startLevel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatRow({
  label,
  value,
  sub,
  accent,
  badge,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
  badge?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right">
        <span className={`font-mono text-xs font-semibold ${accent ?? "text-foreground"}`}>
          {value}
        </span>
        {sub && <span className="ml-1 text-[10px] text-muted-foreground">{sub}</span>}
        {badge && (
          <span className={`ml-1.5 text-[10px] font-semibold ${TIME_GRADE_META[badge as keyof typeof TIME_GRADE_META]?.color ?? ""}`}>
            {badge}
          </span>
        )}
      </span>
    </div>
  )
}
