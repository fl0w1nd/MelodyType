import { memo, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { WordState } from "@/engine/typing/types"

interface TextDisplayProps {
  words: WordState[]
  currentWordIndex: number
  currentCharIndex: number
  isFinished: boolean
}

function TextDisplayInner({
  words,
  currentWordIndex,
  currentCharIndex,
  isFinished,
}: TextDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (cursorRef.current && scrollRef.current) {
      const container = scrollRef.current
      const cursor = cursorRef.current
      const containerRect = container.getBoundingClientRect()
      const cursorRect = cursor.getBoundingClientRect()

      const relativeTop =
        cursorRect.top - containerRect.top + container.scrollTop

      if (
        relativeTop > container.clientHeight * 0.6 ||
        relativeTop < container.clientHeight * 0.2
      ) {
        container.scrollTo({
          top: relativeTop - container.clientHeight * 0.35,
          behavior: "smooth",
        })
      }
    }
  }, [currentWordIndex, currentCharIndex])

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Select a mode to start practicing...
      </div>
    )
  }

  return (
    <div className="relative rounded-xl bg-card/60 border border-border/50 max-h-48 sm:max-h-56 overflow-hidden flex flex-col">
      <div className="shrink-0 h-5 sm:h-6" />

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-hidden px-6 sm:px-8 font-mono text-lg sm:text-xl leading-relaxed tracking-wide"
      >
        <div className="flex flex-wrap items-baseline">
          {words.map((word, wi) => (
            <span
              key={wi}
              className={cn(
                "inline-flex transition-opacity duration-200",
                wi < currentWordIndex && "opacity-50",
              )}
            >
              {word.chars.map((char, ci) => {
                const isCursor =
                  wi === currentWordIndex &&
                  ci === currentCharIndex &&
                  !isFinished

                return (
                  <span
                    key={ci}
                    ref={isCursor ? cursorRef : undefined}
                    className={cn(
                      "relative transition-colors duration-75",
                      isCursor && "current-char",
                    )}
                  >
                    <span
                      className={cn(
                        char.status === "pending" && "text-muted-foreground/60",
                        char.status === "correct" &&
                          !char.hadError &&
                          "text-foreground",
                        char.status === "correct" &&
                          char.hadError &&
                          "text-amber-600",
                        char.status === "incorrect" &&
                          "text-destructive bg-destructive/10 rounded-sm",
                      )}
                    >
                      {char.char}
                    </span>
                    {isCursor && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-pulse rounded-full" />
                    )}
                  </span>
                )
              })}
              {wi < words.length - 1 &&
                (() => {
                  const isSpaceCursor =
                    wi === currentWordIndex &&
                    currentCharIndex >= word.chars.length &&
                    !isFinished
                  return (
                    <span
                      ref={isSpaceCursor ? cursorRef : undefined}
                      className={cn(
                        "relative mx-0.5 select-none",
                        isSpaceCursor
                          ? "text-primary"
                          : wi < currentWordIndex
                            ? "text-muted-foreground/30"
                            : "text-muted-foreground/40",
                      )}
                    >
                      &middot;
                      {isSpaceCursor && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-pulse rounded-full" />
                      )}
                    </span>
                  )
                })()}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 h-5 sm:h-6" />
    </div>
  )
}

export const TextDisplay = memo(TextDisplayInner)
