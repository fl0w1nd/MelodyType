import { memo, useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { fingerForKey } from "@/engine/typing/wordLists"
import type { KeyConfidence } from "@/engine/typing/adaptiveEngine"
import {
  getAdaptiveKeyColorClass,
  getConfidenceBarColorClass,
} from "@/engine/typing/adaptiveEngine"

const rows = [
  [
    { key: "`", w: 1 }, { key: "1", w: 1 }, { key: "2", w: 1 }, { key: "3", w: 1 },
    { key: "4", w: 1 }, { key: "5", w: 1 }, { key: "6", w: 1 }, { key: "7", w: 1 },
    { key: "8", w: 1 }, { key: "9", w: 1 }, { key: "0", w: 1 }, { key: "-", w: 1 },
    { key: "=", w: 1 }, { key: "Backspace", w: 1.75, label: "⌫" },
  ],
  [
    { key: "Tab", w: 1.4, label: "Tab" }, { key: "q", w: 1 }, { key: "w", w: 1 },
    { key: "e", w: 1 }, { key: "r", w: 1 }, { key: "t", w: 1 }, { key: "y", w: 1 },
    { key: "u", w: 1 }, { key: "i", w: 1 }, { key: "o", w: 1 }, { key: "p", w: 1 },
    { key: "[", w: 1 }, { key: "]", w: 1 }, { key: "\\", w: 1.35 },
  ],
  [
    { key: "CapsLock", w: 1.65, label: "Caps" }, { key: "a", w: 1 }, { key: "s", w: 1 },
    { key: "d", w: 1 }, { key: "f", w: 1, home: true }, { key: "g", w: 1 },
    { key: "h", w: 1 }, { key: "j", w: 1, home: true }, { key: "k", w: 1 },
    { key: "l", w: 1 }, { key: ";", w: 1 }, { key: "'", w: 1 },
    { key: "Enter", w: 2.1, label: "⏎" },
  ],
  [
    { key: "Shift", w: 2.15, label: "Shift" }, { key: "z", w: 1 }, { key: "x", w: 1 },
    { key: "c", w: 1 }, { key: "v", w: 1 }, { key: "b", w: 1 }, { key: "n", w: 1 },
    { key: "m", w: 1 }, { key: ",", w: 1 }, { key: ".", w: 1 }, { key: "/", w: 1 },
    { key: "ShiftRight", w: 2.6, label: "Shift" },
  ],
  [
    { key: "Ctrl", w: 1.25, label: "Ctrl" },
    { key: "Alt", w: 1.25, label: "Alt" },
    { key: "Meta", w: 1.25, label: "⌘" },
    { key: " ", w: 6.25, label: "" },
    { key: "MetaRight", w: 1.25, label: "⌘" },
    { key: "AltRight", w: 1.25, label: "Alt" },
    { key: "CtrlRight", w: 1.25, label: "Ctrl" },
  ],
]

const fingerColors: Record<string, string> = {
  "Left Pinky": "bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700",
  "Left Ring": "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
  "Left Middle": "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  "Left Index": "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700",
  "Right Index": "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700",
  "Right Middle": "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  "Right Ring": "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700",
  "Right Pinky": "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700",
}

interface VirtualKeyboardProps {
  activeKeys?: Set<string>
  highlightKeys?: Set<string>
  nextKey?: string
  showFingerHints?: boolean
  keyConfidences?: KeyConfidence[]
  adaptiveMode?: boolean
}

function VirtualKeyboardInner({
  activeKeys = new Set(),
  highlightKeys,
  nextKey,
  showFingerHints = true,
  keyConfidences,
  adaptiveMode = false,
}: VirtualKeyboardProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())

  const confidenceMap = useMemo(() => {
    if (!keyConfidences) return new Map<string, KeyConfidence>()
    const m = new Map<string, KeyConfidence>()
    for (const kc of keyConfidences) {
      m.set(kc.key, kc)
    }
    return m
  }, [keyConfidences])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => new Set(prev).add(e.key.toLowerCase()))
    }
    const onUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev)
        next.delete(e.key.toLowerCase())
        return next
      })
    }
    window.addEventListener("keydown", onDown)
    window.addEventListener("keyup", onUp)
    return () => {
      window.removeEventListener("keydown", onDown)
      window.removeEventListener("keyup", onUp)
    }
  }, [])

  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-secondary/40 border border-border/60 w-full max-w-2xl mx-auto">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1 justify-center">
          {row.map((keyDef) => {
            const keyLower = keyDef.key.toLowerCase()
            const isPressed = pressedKeys.has(keyLower) || (keyLower === " " && pressedKeys.has(" "))
            const isActive = activeKeys.has(keyLower)
            const isHighlighted = highlightKeys?.has(keyLower)
            const isNext = nextKey?.toLowerCase() === keyLower
            const finger = fingerForKey[keyLower]
            const fingerColor = finger ? fingerColors[finger] : ""
            const kc = confidenceMap.get(keyLower)
            const adaptiveColor = adaptiveMode && kc ? getAdaptiveKeyColorClass(kc) : ""
            const isFocused = adaptiveMode && kc?.focused

            return (
              <div
                key={keyDef.key}
                style={{ flex: `${keyDef.w} 0 0%` }}
                className={cn(
                  "relative flex items-center justify-center rounded-md border text-xs font-mono transition-all duration-100 select-none",
                  "h-9 sm:h-10",
                  isPressed
                    ? "bg-primary text-primary-foreground border-primary scale-95 shadow-inner"
                    : isNext
                      ? "bg-primary/20 border-primary/50 text-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
                      : adaptiveMode && adaptiveColor
                        ? adaptiveColor
                        : isHighlighted
                          ? "bg-accent/30 border-accent/50 text-accent-foreground"
                          : isActive && showFingerHints && fingerColor
                            ? fingerColor
                            : "bg-card border-border/80 text-muted-foreground",
                  isFocused && !isPressed && !isNext && "ring-1 ring-primary/40",
                )}
              >
                <span className="relative z-10">
                  {keyDef.label ?? keyDef.key.toUpperCase()}
                </span>
                {keyDef.home && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/50" />
                )}
                {adaptiveMode && kc && kc.unlocked && kc.confidence > 0 && !isPressed && (
                  <div
                    className={cn(
                      "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all",
                      getConfidenceBarColorClass(kc.confidence),
                    )}
                    style={{ width: `${Math.min(kc.confidence * 100, 100) * 0.7}%` }}
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}

      {adaptiveMode && (
        <div className="flex items-center justify-center gap-3 mt-1.5 pt-1.5 border-t border-border/30">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500/60" />
            <span className="text-[9px] text-muted-foreground">Weak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500/60" />
            <span className="text-[9px] text-muted-foreground">Learning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500/60" />
            <span className="text-[9px] text-muted-foreground">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
            <span className="text-[9px] text-muted-foreground">Mastered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted/40" />
            <span className="text-[9px] text-muted-foreground">Locked</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const VirtualKeyboard = memo(VirtualKeyboardInner)
