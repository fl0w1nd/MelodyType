import { RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { TextDisplay } from "@/components/practice/TextDisplay"
import { FlowMeter } from "@/components/practice/FlowMeter"
import { MetricsBar } from "@/components/practice/MetricsBar"
import { VirtualKeyboard } from "@/components/practice/VirtualKeyboard"
import { ModeSelector } from "@/components/practice/ModeSelector"
import { ResultsPanel } from "@/components/practice/ResultsPanel"
import { KeyProgressPanel } from "@/components/practice/KeyProgressPanel"
import { TimeLevelSelect } from "@/components/practice/TimeLevelSelect"
import {
  NoteParticles,
  useNoteParticles,
} from "@/components/practice/NoteParticles"
import { usePracticeSessionController } from "@/engine/practice/usePracticeSessionController"
import { setAppSetting, useAppSetting } from "@/lib/settings"

export default function PracticePage() {
  const { t } = useTranslation()
  const { particles, emit } = useNoteParticles()
  const showKeyboard = useAppSetting("showKeyboard")
  const {
    config,
    state,
    metrics,
    completedMetrics,
    adaptiveState,
    adaptiveDisplayMetrics,
    melodyState,
    activeLevel,
    quoteAuthor,
    newlyUnlocked,
    roundCount,
    timeResultSummary,
    timeLevelKey,
    nextKey,
    isAdaptive,
    isTimeLevelSelect,
    showResults,
    actions,
  } = usePracticeSessionController({
    onCorrectInput: emit,
  })

  return (
    <div className="flex flex-col items-center gap-6">
      <section className="w-full rounded-[28px] border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">
              {t("landing.eyebrow")}
            </p>
            <h1 className="mt-3 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              {t("landing.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("landing.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/docs"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("landing.docsCta")}
            </Link>
            <a
              href="https://github.com/fl0w1nd/MelodyType"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
            >
              {t("landing.githubCta")}
            </a>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            t("landing.highlights.adaptive"),
            t("landing.highlights.rhythm"),
            t("landing.highlights.privacy"),
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-foreground/85"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <div data-tour="mode-selector">
        <ModeSelector
          onSelect={actions.handleConfigChange}
          currentConfig={config}
        />
      </div>

      {isAdaptive && adaptiveState && (
        <KeyProgressPanel
          keyConfidences={adaptiveState.keyConfidences}
          focusKey={adaptiveState.focusKey}
          globalSummary={adaptiveState.globalSummary}
          phase={adaptiveState.phase}
          targetCpm={adaptiveState.settings.targetCpm}
          recoverKeys={adaptiveState.settings.recoverKeys}
          includeNumbers={adaptiveState.settings.includeNumbers}
          includePunctuation={adaptiveState.settings.includePunctuation}
          includeSpecialCharacters={adaptiveState.settings.includeSpecialCharacters}
          totalSessions={adaptiveState.totalSessions}
          roundNumber={roundCount + 1}
          onUnlockKey={actions.handleManualUnlock}
          onTargetChange={(targetCpm) => {
            void actions.updateAdaptiveSettings({ targetCpm })
          }}
          onRecoverChange={(recoverKeys) => {
            void actions.updateAdaptiveSettings({ recoverKeys })
          }}
          onIncludeNumbersChange={(includeNumbers) => {
            void actions.updateAdaptiveSettings({ includeNumbers })
          }}
          onIncludePunctuationChange={(includePunctuation) => {
            void actions.updateAdaptiveSettings({ includePunctuation })
          }}
          onIncludeSpecialCharactersChange={(includeSpecialCharacters) => {
            void actions.updateAdaptiveSettings({ includeSpecialCharacters })
          }}
        />
      )}

      <AnimatePresence>
        {isAdaptive && newlyUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg dark:text-emerald-400"
          >
            {t("practice.newKeyUnlocked")}{" "}
            <span className="font-mono text-base font-bold">
              {newlyUnlocked.toUpperCase()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {isTimeLevelSelect && (
        <TimeLevelSelect
          key={timeLevelKey}
          onSelectLevel={actions.handleSelectLevel}
        />
      )}

      {!isTimeLevelSelect && (
        <AnimatePresence mode="wait">
          {showResults ? (
            <ResultsPanel
              key="results"
              metrics={completedMetrics ?? metrics}
              onRestart={actions.handleRestart}
              onBackToLevels={activeLevel ? actions.handleBackToLevels : undefined}
              onNextLevel={activeLevel ? actions.handleNextLevel : undefined}
              modeConfig={config}
              keystrokeLog={state.keystrokeLog}
              isNewPersonalBest={timeResultSummary?.isNewPersonalBest ?? false}
              levelRecord={timeResultSummary?.levelRecord ?? null}
              wordsCompleted={state.words.filter((word) => word.completed).length}
            />
          ) : (
            <motion.div
              key="practice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col gap-4"
            >
              <div data-tour="metrics-bar">
                <MetricsBar
                  metrics={isAdaptive ? adaptiveDisplayMetrics : metrics}
                  isStarted={
                    isAdaptive
                      ? state.isStarted && !state.isFinished
                      : state.isStarted
                  }
                  timeLimit={config.mode === "time" ? config.timeLimit : undefined}
                />
              </div>

              <div data-tour="flow-meter">
                <FlowMeter melodyState={melodyState} isStarted={state.isStarted} />
              </div>

              <div className="relative" data-tour="text-area">
                <TextDisplay
                  words={state.words}
                  currentWordIndex={state.currentWordIndex}
                  currentCharIndex={state.currentCharIndex}
                  isFinished={state.isFinished}
                />
                <NoteParticles particles={particles} />
              </div>

              {quoteAuthor && (
                <div className="text-center text-xs italic text-muted-foreground/70">
                  — {quoteAuthor}
                </div>
              )}

              <div className="flex justify-center gap-2" data-tour="practice-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={actions.handleRestart}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("practice.restart")}
                  <kbd className="ml-1 rounded border border-border/60 bg-secondary/60 px-1 py-0.5 text-[10px] font-mono">
                    Tab
                  </kbd>
                </Button>
                {activeLevel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={actions.handleBackToLevels}
                  >
                    {t("practice.allLevels")}
                    <kbd className="ml-1 rounded border border-border/60 bg-secondary/60 px-1 py-0.5 text-[10px] font-mono">
                      Esc
                    </kbd>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => void setAppSetting("showKeyboard", !showKeyboard)}
                >
                  {showKeyboard ? t("practice.hideKeyboard") : t("practice.showKeyboard")}{" "}
                  {t("practice.keyboard")}
                </Button>
              </div>

              {isAdaptive && roundCount > 0 && (
                <div className="text-center font-mono text-[10px] text-muted-foreground/60">
                  {t("practice.roundSession", { round: roundCount + 1 })}
                </div>
              )}

              <AnimatePresence>
                {showKeyboard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VirtualKeyboard
                      nextKey={nextKey}
                      keyConfidences={
                        isAdaptive ? adaptiveState?.keyConfidences : undefined
                      }
                      adaptiveMode={isAdaptive}
                      recoverKeys={adaptiveState?.settings.recoverKeys}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
