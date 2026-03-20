import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Sparkles, HelpCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { startTour, subscribeTour } from "@/lib/tourEmitter"

// ── Tour step definitions ──────────────────────────────

interface TourStep {
  target: string
  titleKey: string
  descriptionKey: string
  placement?: "top" | "bottom" | "left" | "right"
  /** Allow clicks to pass through to the spotlighted element */
  interactive?: boolean
  onEnter?: () => void
  onLeave?: () => void
}

function clickTourTarget(target: string) {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (el instanceof HTMLElement) el.click()
}

const tourSteps: TourStep[] = [
  {
    target: "logo",
    titleKey: "tour.steps.logo.title",
    descriptionKey: "tour.steps.logo.description",
    placement: "bottom",
  },
  {
    target: "mode-selector",
    titleKey: "tour.steps.modeSelector.title",
    descriptionKey: "tour.steps.modeSelector.description",
    placement: "bottom",
  },
  {
    target: "options-button",
    titleKey: "tour.steps.optionsButton.title",
    descriptionKey: "tour.steps.optionsButton.description",
    placement: "bottom",
  },
  {
    target: "options-panel",
    titleKey: "tour.steps.optionsPanel.title",
    descriptionKey: "tour.steps.optionsPanel.description",
    placement: "left",
    interactive: true,
    onEnter: () => {
      const panel = document.querySelector('[data-tour="options-panel"]')
      if (!panel) clickTourTarget("options-button")
    },
    onLeave: () => {
      const panel = document.querySelector('[data-tour="options-panel"]')
      if (panel) clickTourTarget("options-button")
    },
  },
  {
    target: "metrics-bar",
    titleKey: "tour.steps.metricsBar.title",
    descriptionKey: "tour.steps.metricsBar.description",
    placement: "bottom",
  },
  {
    target: "flow-meter",
    titleKey: "tour.steps.flowMeter.title",
    descriptionKey: "tour.steps.flowMeter.description",
    placement: "bottom",
  },
  {
    target: "text-area",
    titleKey: "tour.steps.textArea.title",
    descriptionKey: "tour.steps.textArea.description",
    placement: "top",
  },
  {
    target: "practice-actions",
    titleKey: "tour.steps.practiceActions.title",
    descriptionKey: "tour.steps.practiceActions.description",
    placement: "top",
  },
  {
    target: "nav-bar",
    titleKey: "tour.steps.navBar.title",
    descriptionKey: "tour.steps.navBar.description",
    placement: "bottom",
  },
]

// ── localStorage key ───────────────────────────────────

const TOUR_COMPLETED_KEY = "melodytype-tour-completed"

function isTourCompleted(): boolean {
  try {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === "true"
  } catch {
    return false
  }
}

function markTourCompleted() {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true")
  } catch {
    // ignore
  }
}

// ── Spotlight geometry ─────────────────────────────────

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

function getTargetRect(target: string): SpotlightRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const padding = 8
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

function getTooltipPosition(
  rect: SpotlightRect,
  placement: TourStep["placement"] = "bottom",
) {
  const gap = 16
  const tooltipWidth = 380

  const clampLeft = (raw: number) =>
    Math.max(16, Math.min(raw, window.innerWidth - tooltipWidth - 16))

  switch (placement) {
    case "top":
      return {
        top: rect.top - gap,
        left: clampLeft(rect.left + rect.width / 2 - tooltipWidth / 2),
        transform: "translateY(-100%)",
      }
    case "left":
      return {
        top: Math.max(16, rect.top + rect.height / 2),
        left: Math.max(16, rect.left - gap - tooltipWidth),
        transform: "translateY(-50%)",
      }
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + gap,
        transform: "translateY(-50%)",
      }
    case "bottom":
    default:
      return {
        top: rect.top + rect.height + gap,
        left: clampLeft(rect.left + rect.width / 2 - tooltipWidth / 2),
        transform: "none",
      }
  }
}

// ── Welcome screen ─────────────────────────────────────

function WelcomeScreen({
  onStart,
  onSkip,
}: {
  onStart: () => void
  onSkip: () => void
}) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative mx-4 max-w-md rounded-2xl border border-border/60 bg-background p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">
              {t("tour.welcome.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {t("tour.welcome.description")}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 pt-1">
            <Button onClick={onStart} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              {t("tour.welcome.start")}
              <span className="text-xs opacity-70">{t("tour.welcome.duration")}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-muted-foreground"
            >
              {t("tour.welcome.skip")}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main GuidedTour component ──────────────────────────

export function GuidedTour() {
  const { t } = useTranslation()
  const [showWelcome, setShowWelcome] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [positionTick, setPositionTick] = useState(0)
  const rafRef = useRef<number>(0)
  const prevStepRef = useRef(-1)

  const isActive = currentStep >= 0 && currentStep < tourSteps.length

  const step = isActive ? tourSteps[currentStep] : null
  const spotlight = step ? getTargetRect(step.target) : null
  const tooltipPos = spotlight && step ? getTooltipPosition(spotlight, step.placement) : null
  void positionTick

  useEffect(() => {
    if (!isTourCompleted()) {
      const timer = setTimeout(() => setShowWelcome(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    return subscribeTour(() => {
      setShowWelcome(false)
      prevStepRef.current = -1
      setCurrentStep(0)
    })
  }, [])

  useEffect(() => {
    if (prevStepRef.current === currentStep) return
    const oldIdx = prevStepRef.current
    prevStepRef.current = currentStep

    if (oldIdx >= 0 && oldIdx < tourSteps.length) {
      const oldStep = tourSteps[oldIdx]
      if (oldStep.interactive) {
        const el = document.querySelector(`[data-tour="${oldStep.target}"]`)
        if (el instanceof HTMLElement) {
          el.style.removeProperty("z-index")
          el.style.removeProperty("position")
        }
      }
      oldStep.onLeave?.()
    }

    if (currentStep >= 0 && currentStep < tourSteps.length) {
      const timer = setTimeout(() => {
        const newStep = tourSteps[currentStep]
        newStep.onEnter?.()

        if (newStep.interactive) {
          requestAnimationFrame(() => {
            const el = document.querySelector(`[data-tour="${newStep.target}"]`)
            if (el instanceof HTMLElement) {
              el.style.zIndex = "9998"
              if (getComputedStyle(el).position === "static") {
                el.style.position = "relative"
              }
            }
            setPositionTick((tick) => tick + 1)
          })
        } else {
          setPositionTick((tick) => tick + 1)
        }
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const cleanupInteractive = useCallback(() => {
    for (const s of tourSteps) {
      if (!s.interactive) continue
      const el = document.querySelector(`[data-tour="${s.target}"]`)
      if (el instanceof HTMLElement) {
        el.style.removeProperty("z-index")
        el.style.removeProperty("position")
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive || !step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) {
      const elRect = el.getBoundingClientRect()
      if (elRect.top < 0 || elRect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [currentStep, isActive, step])

  useEffect(() => {
    if (!isActive) return
    const onResize = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => setPositionTick((tick) => tick + 1))
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [isActive])

  const finish = useCallback(() => {
    if (currentStep >= 0 && currentStep < tourSteps.length) {
      tourSteps[currentStep].onLeave?.()
    }
    cleanupInteractive()
    markTourCompleted()
    setCurrentStep(-1)
    setShowWelcome(false)
    prevStepRef.current = -1
  }, [currentStep, cleanupInteractive])

  const handleStart = useCallback(() => {
    setShowWelcome(false)
    prevStepRef.current = -1
    setCurrentStep(0)
  }, [])

  const handleSkip = useCallback(() => {
    markTourCompleted()
    setShowWelcome(false)
  }, [])

  const next = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      finish()
    }
  }, [currentStep, finish])

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }, [currentStep])

  useEffect(() => {
    if (!isActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finish()
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault()
        next()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isActive, next, prev, finish])

  if (!showWelcome && !isActive) return null

  return (
    <>
      <AnimatePresence>
        {showWelcome && !isActive && (
          <WelcomeScreen onStart={handleStart} onSkip={handleSkip} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && spotlight && tooltipPos && step && (
          <>
            {/* Overlay with spotlight cutout */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed z-[9997] pointer-events-none"
              style={{
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                borderRadius: 12,
                position: "fixed",
              }}
            />
            {/* Click catcher — covers the dark area outside the spotlight */}
            {!step.interactive && (
              <div
                className="fixed inset-0 z-[9997] pointer-events-auto"
                onClick={next}
              />
            )}

            {/* Spotlight ring */}
            <motion.div
              key="ring"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed z-[9998] pointer-events-none rounded-xl ring-2 ring-primary/60 ring-offset-2 ring-offset-transparent"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }}
            />

            {/* Tooltip card */}
            <motion.div
              key={`tooltip-${currentStep}`}
              initial={{ opacity: 0, y: step.placement === "top" ? 8 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: step.placement === "top" ? 8 : -8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-[9999] w-[380px] max-w-[calc(100vw-32px)] pointer-events-auto"
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: tooltipPos.transform,
              }}
            >
              <div
                className="rounded-xl border border-border/60 bg-background p-5 shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); finish() }}
                  className="absolute top-3 right-3 rounded-lg p-1 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 transition-colors"
                  aria-label={t("tour.close")}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="pr-6">
                  <h3 className="text-base font-semibold text-foreground">
                    {t(step.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(step.descriptionKey)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {tourSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentStep
                            ? "w-5 bg-primary"
                            : i < currentStep
                              ? "w-1.5 bg-primary/40"
                              : "w-1.5 bg-border"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); prev() }}
                        className="gap-1 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        {t("tour.prev")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); next() }}
                      className="gap-1 text-xs"
                    >
                      {currentStep < tourSteps.length - 1 ? (
                        <>
                          {t("tour.next")}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        t("tour.finish")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Replay button for header ───────────────────────────

export function TourReplayButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const handleReplay = useCallback(() => {
    if (location.pathname !== "/") {
      navigate("/")
      setTimeout(startTour, 300)
    } else {
      startTour()
    }
  }, [navigate, location.pathname])

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={handleReplay}
            className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
          />
        }
      >
        <HelpCircle className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom">{t("tour.replay")}</TooltipContent>
    </Tooltip>
  )
}
