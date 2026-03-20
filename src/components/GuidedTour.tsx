import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Sparkles, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { startTour, subscribeTour } from "@/lib/tourEmitter"

// ── Tour step definitions ──────────────────────────────

interface TourStep {
  target: string
  title: string
  description: string
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
    title: "欢迎来到 MelodyType 🎵",
    description:
      "这是一款将打字练习与音乐旋律融合的应用。你的每一次击键都会驱动旋律流动，让练习不再枯燥。",
    placement: "bottom",
  },
  {
    target: "mode-selector",
    title: "选择练习模式",
    description:
      "三种模式任你选择：Adaptive（智能适应你的薄弱按键）、Time（限时挑战，获取 S 级评分）、Quote（名言名句打字练习）。",
    placement: "bottom",
  },
  {
    target: "options-button",
    title: "⚙️ 这个按钮很重要！",
    description:
      "这是 Adaptive 模式的隐藏选项入口。点击它可以设定你的目标打字速度（CPM），系统会据此调整练习难度和按键解锁节奏。接下来我们帮你打开它。",
    placement: "bottom",
  },
  {
    target: "options-panel",
    title: "设定你的目标速度 🎯",
    description:
      "在这里选择适合你的目标 CPM（每分钟字符数）。可以用预设快速选择，也可以拖动滑块精确调节。目标越高，解锁新按键的门槛越高。试试点击选择一个吧！",
    placement: "left",
    interactive: true,
    onEnter: () => {
      // Open the options panel
      const panel = document.querySelector('[data-tour="options-panel"]')
      if (!panel) clickTourTarget("options-button")
    },
    onLeave: () => {
      // Close the panel
      const panel = document.querySelector('[data-tour="options-panel"]')
      if (panel) clickTourTarget("options-button")
    },
  },
  {
    target: "metrics-bar",
    title: "实时数据面板",
    description:
      "这里实时显示你的 WPM（每分钟字数）、准确率、用时、原始速度以及旋律完整度。帮你全方位了解打字状态。",
    placement: "bottom",
  },
  {
    target: "flow-meter",
    title: "旋律流量计",
    description:
      "保持稳定的打字节奏，旋律就会持续流动。暂停或频繁出错会消耗旋律能量——这是 MelodyType 的独特机制。",
    placement: "bottom",
  },
  {
    target: "text-area",
    title: "开始打字",
    description:
      "直接在键盘上打字即可开始练习，不需要点击任何地方。光标会自动跟随你的输入，打错的字符会标红。",
    placement: "top",
  },
  {
    target: "practice-actions",
    title: "快捷操作",
    description:
      "按 Tab 可快速重新开始，也可以切换虚拟键盘的显示。这些小按钮虽然不起眼，但非常实用。",
    placement: "top",
  },
  {
    target: "nav-bar",
    title: "探索更多功能",
    description:
      "Dashboard 查看历史统计，MIDI 管理背景音乐，Docs 阅读使用文档，Settings 管理数据与偏好。慢慢探索吧！",
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
              欢迎使用 MelodyType
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              让打字练习与音乐旋律相伴。
              <br />
              只需不到一分钟，快速了解核心功能。
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 pt-1">
            <Button onClick={onStart} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              开始引导
              <span className="text-xs opacity-70">（约 30 秒）</span>
            </Button>
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-muted-foreground"
            >
              跳过，我自己探索
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main GuidedTour component ──────────────────────────

export function GuidedTour() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [positionTick, setPositionTick] = useState(0)
  const rafRef = useRef<number>(0)
  const prevStepRef = useRef(-1)

  const isActive = currentStep >= 0 && currentStep < tourSteps.length

  // Derive spotlight & tooltip position from tick + step
  const step = isActive ? tourSteps[currentStep] : null
  const spotlight = step ? getTargetRect(step.target) : null
  const tooltipPos = spotlight && step ? getTooltipPosition(spotlight, step.placement) : null
  void positionTick

  // Check first visit on mount
  useEffect(() => {
    if (!isTourCompleted()) {
      const timer = setTimeout(() => setShowWelcome(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Register global replay listener
  useEffect(() => {
    return subscribeTour(() => {
      setShowWelcome(false)
      prevStepRef.current = -1
      setCurrentStep(0)
    })
  }, [])

  // Fire onEnter / onLeave when step changes; manage interactive z-index
  useEffect(() => {
    if (prevStepRef.current === currentStep) return
    const oldIdx = prevStepRef.current
    prevStepRef.current = currentStep

    // Restore z-index for previous interactive step's target
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

    // onEnter for the new step (with a small delay so DOM updates first)
    if (currentStep >= 0 && currentStep < tourSteps.length) {
      const timer = setTimeout(() => {
        const newStep = tourSteps[currentStep]
        newStep.onEnter?.()

        // Boost z-index for interactive step's target above overlay
        if (newStep.interactive) {
          // Wait a frame for onEnter DOM changes to apply
          requestAnimationFrame(() => {
            const el = document.querySelector(`[data-tour="${newStep.target}"]`)
            if (el instanceof HTMLElement) {
              el.style.zIndex = "9998"
              if (getComputedStyle(el).position === "static") {
                el.style.position = "relative"
              }
            }
            setPositionTick((t) => t + 1)
          })
        } else {
          setPositionTick((t) => t + 1)
        }
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  // Cleanup interactive z-index on unmount / finish
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

  // Scroll target into view when step changes
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

  // Re-measure on resize / scroll
  useEffect(() => {
    if (!isActive) return
    const onResize = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => setPositionTick((t) => t + 1))
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
    // Fire onLeave for the current step before finishing
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

  // Keyboard navigation
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
                  aria-label="关闭引导"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="pr-6">
                  <h3 className="text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
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
                        上一步
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); next() }}
                      className="gap-1 text-xs"
                    >
                      {currentStep < tourSteps.length - 1 ? (
                        <>
                          下一步
                          <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        "开始练习 🎹"
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
  const navigate = useNavigate()
  const location = useLocation()

  const handleReplay = useCallback(() => {
    if (location.pathname !== "/") {
      navigate("/")
      // Wait for page transition to render before starting tour
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
      <TooltipContent side="bottom">重新查看引导教程</TooltipContent>
    </Tooltip>
  )
}
