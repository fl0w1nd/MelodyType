import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Lock, Unlock, Star, Crosshair } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KeyConfidence } from "@/engine/typing/adaptiveEngine"
import {
  CONFIDENCE_UNLOCK_THRESHOLD,
  LETTER_FREQUENCY_ORDER,
  getConfidenceColorClass,
  getConfidenceBarColorClass,
} from "@/engine/typing/adaptiveEngine"

interface KeyProgressPanelProps {
  keyConfidences: KeyConfidence[]
  focusKey: string | null
  compact?: boolean
}

function KeyProgressPanelInner({ keyConfidences, focusKey, compact = false }: KeyProgressPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const unlockedKeys = keyConfidences.filter((k) => k.unlocked)
  const lockedKeys = keyConfidences.filter((k) => !k.unlocked)
  const masteredCount = unlockedKeys.filter(
    (k) => k.confidence >= CONFIDENCE_UNLOCK_THRESHOLD,
  ).length

  const avgConfidence =
    unlockedKeys.length > 0
      ? unlockedKeys.reduce((sum, k) => sum + k.confidence, 0) / unlockedKeys.length
      : 0

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50">
        <div className="flex items-center gap-1.5">
          <Unlock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            {unlockedKeys.length}/{LETTER_FREQUENCY_ORDER.length}
          </span>
        </div>
        <div className="w-px h-5 bg-border/60" />
        <div className="flex gap-0.5">
          {keyConfidences.slice(0, 15).map((kc) => (
            <div
              key={kc.key}
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded text-[9px] font-mono font-medium border transition-colors",
                getConfidenceColorClass(kc.confidence, kc.unlocked),
                kc.focused && "ring-1 ring-primary ring-offset-1 ring-offset-background",
              )}
            >
              {kc.key.toUpperCase()}
            </div>
          ))}
          {keyConfidences.length > 15 && (
            <span className="text-[9px] text-muted-foreground self-center ml-1">
              +{keyConfidences.length - 15}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 border border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Unlock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">
              <span className="text-foreground">{unlockedKeys.length}</span>
              <span className="text-muted-foreground">/{LETTER_FREQUENCY_ORDER.length} keys</span>
            </span>
          </div>
          <div className="w-px h-5 bg-border/60" />
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium">
              <span className="text-foreground">{masteredCount}</span>
              <span className="text-muted-foreground"> mastered</span>
            </span>
          </div>
          {focusKey && (
            <>
              <div className="w-px h-5 bg-border/60" />
              <div className="flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">
                  Focus: <span className="font-mono text-primary">{focusKey.toUpperCase()}</span>
                </span>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "Collapse" : "Details"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      <div className="mt-2 flex gap-1 flex-wrap justify-center">
        {keyConfidences.map((kc) => (
          <div
            key={kc.key}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono font-medium border transition-all",
              getConfidenceColorClass(kc.confidence, kc.unlocked),
              kc.focused && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background scale-110",
            )}
            title={
              kc.unlocked
                ? `${kc.key.toUpperCase()}: ${Math.round(kc.confidence * 100)}% confidence, ${Math.round(kc.speed)} WPM, ${kc.accuracy.toFixed(0)}% accuracy`
                : `${kc.key.toUpperCase()}: Locked`
            }
          >
            {kc.unlocked ? kc.key.toUpperCase() : <Lock className="h-2.5 w-2.5" />}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 px-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-mono font-medium">{Math.round(avgConfidence * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${avgConfidence * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Unlocked Keys</span>
                <div className="grid gap-1.5">
                  {unlockedKeys.map((kc) => (
                    <KeyStatRow key={kc.key} keyConf={kc} isFocus={kc.key === focusKey} />
                  ))}
                </div>
              </div>

              {lockedKeys.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Next to Unlock
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {lockedKeys.slice(0, 5).map((kc) => (
                      <div
                        key={kc.key}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 border border-border/30"
                      >
                        <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                        <span className="text-xs font-mono text-muted-foreground/50">
                          {kc.key.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {lockedKeys.length > 5 && (
                      <span className="text-[10px] text-muted-foreground/40 self-center">
                        +{lockedKeys.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function KeyStatRow({ keyConf, isFocus }: { keyConf: KeyConfidence; isFocus: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md",
        isFocus && "bg-primary/5 border border-primary/20",
      )}
    >
      <div
        className={cn(
          "w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold border",
          getConfidenceColorClass(keyConf.confidence, true),
        )}
      >
        {keyConf.key.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", getConfidenceBarColorClass(keyConf.confidence))}
            style={{ width: `${Math.min(keyConf.confidence * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground shrink-0">
        <span>{Math.round(keyConf.speed)} wpm</span>
        <span>{keyConf.accuracy.toFixed(0)}%</span>
        <span className="font-medium">{Math.round(keyConf.confidence * 100)}%</span>
      </div>
      {isFocus && <Crosshair className="h-3 w-3 text-primary shrink-0" />}
    </div>
  )
}

export const KeyProgressPanel = memo(KeyProgressPanelInner)
