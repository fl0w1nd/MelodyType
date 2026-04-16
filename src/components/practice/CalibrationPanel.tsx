import { useEffect, useState, type ReactNode } from "react"
import { Gauge, Target, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import {
  ADAPTIVE_TARGET_PRESETS,
  DEFAULT_TARGET_CPM,
  MAX_TARGET_CPM,
  MIN_TARGET_CPM,
} from "@/engine/typing/adaptiveEngine"
import {
  CALIBRATION_WORD_COUNT,
  type CalibrationResult,
} from "@/engine/typing/calibration"

interface CalibrationPanelProps {
  active: boolean
  result: CalibrationResult | null
  onAccept: (targetCpm: number) => Promise<void> | void
  onExit: () => Promise<void> | void
}

export function CalibrationPanel({
  active,
  result,
  onAccept,
  onExit,
}: CalibrationPanelProps) {
  const { t } = useTranslation()
  const [draftTargetCpm, setDraftTargetCpm] = useState(DEFAULT_TARGET_CPM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setDraftTargetCpm(result?.recommendedTargetCpm ?? DEFAULT_TARGET_CPM)
    setSubmitting(false)
  }, [result])

  const handleAccept = async () => {
    setSubmitting(true)
    try {
      await onAccept(draftTargetCpm)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {active && (
        <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("calibration.bannerTitle")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("calibration.bannerDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {t("calibration.wordCount", { count: CALIBRATION_WORD_COUNT })}
              </Badge>
              <Button type="button" variant="outline" size="sm" onClick={() => void onExit()}>
                {t("calibration.exit")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <Dialog open>
          <DialogContent className="sm:max-w-lg" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{t("calibration.title")}</DialogTitle>
              <DialogDescription>{t("calibration.subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-3">
              <CalibrationMetricCard
                label={t("calibration.measuredSpeed")}
                value={`${result.measuredWpm} WPM`}
                detail={`${result.measuredCpm} CPM`}
                icon={<Gauge className="h-4 w-4" />}
              />
              <CalibrationMetricCard
                label={t("calibration.accuracy")}
                value={`${result.accuracy}%`}
                icon={<Target className="h-4 w-4" />}
              />
              <CalibrationMetricCard
                label={t("calibration.recommended")}
                value={`${result.recommendedTargetCpm} CPM`}
                detail={`${Math.round(result.recommendedTargetCpm / 5)} WPM`}
                icon={<Sparkles className="h-4 w-4" />}
                accent
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t("calibration.adjust")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("calibration.hint")}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {ADAPTIVE_TARGET_PRESETS.map((preset) => {
                  const active = draftTargetCpm === preset.cpm
                  return (
                    <Button
                      key={preset.cpm}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="h-auto min-w-[98px] flex-col items-start gap-0.5 px-3 py-2 text-left"
                      onClick={() => setDraftTargetCpm(preset.cpm)}
                    >
                      <span className="text-xs font-medium">{preset.label}</span>
                      <span className="font-mono text-[11px]">{preset.cpm} CPM</span>
                    </Button>
                  )
                })}
              </div>

              <Slider
                value={[draftTargetCpm]}
                onValueChange={(value) =>
                  setDraftTargetCpm(Array.isArray(value) ? value[0] : value)
                }
                min={MIN_TARGET_CPM}
                max={MAX_TARGET_CPM}
                step={5}
              />

              <div className="text-right font-mono text-xs text-muted-foreground">
                {draftTargetCpm} CPM ({Math.round(draftTargetCpm / 5)} WPM)
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => void onExit()}>
                {t("calibration.exit")}
              </Button>
              <Button onClick={() => void handleAccept()} disabled={submitting}>
                {submitting ? `${t("calibration.accept")}...` : t("calibration.accept")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function CalibrationMetricCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string
  value: string
  detail?: string
  icon: ReactNode
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={accent ? "text-primary" : undefined}>{icon}</span>
        {label}
      </div>
      <div className={accent ? "mt-2 font-mono text-lg font-semibold text-primary" : "mt-2 font-mono text-lg font-semibold text-foreground"}>
        {value}
      </div>
      {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
    </div>
  )
}
