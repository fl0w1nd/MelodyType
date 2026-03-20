import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { CalendarDays, Clock, CalendarRange, Calendar } from "lucide-react"

export type TimeRange = "recent" | "day" | "week" | "month"

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  className?: string
}

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  const { t } = useTranslation()

  const ranges: { value: TimeRange; label: string; icon: React.ReactNode }[] = [
    { value: "recent", label: t("timeRangeSelector.recent"), icon: <Clock className="h-3.5 w-3.5" /> },
    { value: "day", label: t("timeRangeSelector.day"), icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { value: "week", label: t("timeRangeSelector.week"), icon: <CalendarRange className="h-3.5 w-3.5" /> },
    { value: "month", label: t("timeRangeSelector.month"), icon: <Calendar className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-xl bg-secondary/60 p-1", className)}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
            value === range.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {range.icon}
          <span className="hidden sm:inline">{range.label}</span>
        </button>
      ))}
    </div>
  )
}
