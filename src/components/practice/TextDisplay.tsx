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
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (cursorRef.current && containerRef.current) {
      const container = containerRef.current
      const cursor = cursorRef.current
      const containerRect = container.getBoundingClientRect()
      const cursorRect = cursor.getBoundingClientRect()

      const relativeTop = cursorRect.top - containerRect.top + container.scrollTop

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
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl bg-card/60 border border-border/50 p-6 sm:p-8 font-mono text-lg sm:text-xl leading-relaxed tracking-wide max-h-48 sm:max-h-56"
    >
      <div className="flex flex-wrap gap-x-2.5 gap-y-2">
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
                <span key={ci} className="relative">
                  {isCursor && (
                    <span
                      ref={cursorRef}
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary animate-pulse rounded-full"
                    />
                  )}
                  <span
                    className={cn(
                      "transition-colors duration-75",
                      char.status === "pending" && "text-muted-foreground/60",
                      char.status === "correct" && "text-foreground",
                      char.status === "incorrect" &&
                        "text-destructive bg-destructive/10 rounded-sm",
                      char.status === "extra" &&
                        "text-destructive/70 bg-destructive/5 rounded-sm",
                    )}
                  >
                    {char.status === "extra" ? char.typedChar : char.char}
                  </span>
                </span>
              )
            })}
            {wi === currentWordIndex &&
              currentCharIndex >= word.chars.length &&
              !isFinished && (
                <span
                  ref={cursorRef}
                  className="w-0.5 bg-primary animate-pulse rounded-full self-stretch"
                />
              )}
          </span>
        ))}
      </div>
    </div>
  )
}

export const TextDisplay = memo(TextDisplayInner)
