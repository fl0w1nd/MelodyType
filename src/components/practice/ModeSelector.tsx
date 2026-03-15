import { useState } from "react"
import {
  Clock,
  Hash,
  Quote,
  GraduationCap,
  Infinity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  beginnerLessons,
  type LessonDefinition,
} from "@/engine/typing/wordLists"
import type { PracticeMode, PracticeModeConfig } from "@/engine/typing/types"

interface ModeSelectorProps {
  onSelect: (config: PracticeModeConfig) => void
  currentConfig: PracticeModeConfig
}

const modeIcons: Record<PracticeMode, React.ReactNode> = {
  adaptive: <Brain className="h-3.5 w-3.5" />,
  time: <Clock className="h-3.5 w-3.5" />,
  words: <Hash className="h-3.5 w-3.5" />,
  quote: <Quote className="h-3.5 w-3.5" />,
  lesson: <GraduationCap className="h-3.5 w-3.5" />,
  free: <Infinity className="h-3.5 w-3.5" />,
  custom: <BookOpen className="h-3.5 w-3.5" />,
}

const timeOptions = [15, 30, 60, 120]
const wordOptions = [10, 25, 50, 100]
const difficultyOptions: Array<{
  value: "easy" | "medium" | "hard"
  label: string
}> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

export function ModeSelector({ onSelect, currentConfig }: ModeSelectorProps) {
  const [mode, setMode] = useState<PracticeMode>(currentConfig.mode)
  const [showLessons, setShowLessons] = useState(false)

  const currentLesson =
    currentConfig.lessonId
      ? beginnerLessons.find((l) => l.id === currentConfig.lessonId)
      : null

  const handleModeChange = (newMode: string) => {
    const m = newMode as PracticeMode
    setMode(m)
    setShowLessons(false)

    if (m === "adaptive") {
      onSelect({ mode: "adaptive" })
      return
    }

    if (m === "lesson") {
      if (currentConfig.lessonId) return
      const first = beginnerLessons[0]
      if (first) onSelect({ mode: "lesson", lessonId: first.id })
      return
    }

    const config: PracticeModeConfig = { mode: m }
    if (m === "time") config.timeLimit = currentConfig.timeLimit ?? 30
    if (m === "words") config.wordCount = currentConfig.wordCount ?? 25
    if (m === "time" || m === "words")
      config.difficulty = currentConfig.difficulty ?? "easy"
    onSelect(config)
  }

  const selectLesson = (lesson: LessonDefinition) => {
    onSelect({ mode: "lesson", lessonId: lesson.id })
    setShowLessons(false)
  }

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList className="h-auto flex-wrap">
          {(
            ["adaptive", "time", "words", "quote", "lesson", "free"] as PracticeMode[]
          ).map((m) => (
            <TabsTrigger
              key={m}
              value={m}
              className="gap-1.5 text-xs sm:text-sm capitalize"
            >
              {modeIcons[m]}
              {m === "adaptive" ? "Adaptive" : m === "lesson" ? "Lessons" : m}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {(mode === "time" || mode === "words") && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {mode === "time" && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground mr-1">
                Duration:
              </span>
              {timeOptions.map((t) => (
                <Button
                  key={t}
                  variant={currentConfig.timeLimit === t ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() =>
                    onSelect({ ...currentConfig, mode: "time", timeLimit: t })
                  }
                >
                  {t}s
                </Button>
              ))}
            </div>
          )}
          {mode === "words" && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground mr-1">
                Words:
              </span>
              {wordOptions.map((w) => (
                <Button
                  key={w}
                  variant={
                    currentConfig.wordCount === w ? "default" : "ghost"
                  }
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() =>
                    onSelect({ ...currentConfig, mode, wordCount: w })
                  }
                >
                  {w}
                </Button>
              ))}
            </div>
          )}
          <div className="w-px h-5 bg-border/60 mx-1" />
          <div className="flex gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-1">Level:</span>
            {difficultyOptions.map((d) => (
              <Button
                key={d.value}
                variant={
                  currentConfig.difficulty === d.value ? "default" : "ghost"
                }
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() =>
                  onSelect({ ...currentConfig, mode, difficulty: d.value })
                }
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {mode === "lesson" && (
        <div className="flex items-center gap-2">
          {currentLesson && (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs font-medium px-2.5 py-0.5"
              >
                Lv.{currentLesson.level}
              </Badge>
              <span className="text-sm font-medium">{currentLesson.name}</span>
              <span className="text-xs text-muted-foreground">
                [{currentLesson.keys.join(", ")}]
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={() => setShowLessons(!showLessons)}
          >
            {showLessons ? (
              <>
                Collapse <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Browse <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}

      {showLessons && (
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 max-h-64 overflow-y-auto">
          {beginnerLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isActive={currentConfig.lessonId === lesson.id}
              onClick={() => selectLesson(lesson)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LessonCard({
  lesson,
  isActive,
  onClick,
}: {
  lesson: LessonDefinition
  isActive: boolean
  onClick: () => void
}) {
  const categoryColors = {
    homeRow: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    topRow: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    bottomRow: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    numbers: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    full: "bg-primary/10 text-primary",
    custom: "bg-secondary text-secondary-foreground",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
        isActive
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border/60 hover:border-primary/20 hover:bg-secondary/30",
      )}
    >
      <Badge
        variant="secondary"
        className={cn(
          "mt-0.5 text-[10px] shrink-0",
          categoryColors[lesson.category],
        )}
      >
        Lv.{lesson.level}
      </Badge>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{lesson.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {lesson.description}
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {lesson.keys.slice(0, 12).map((k) => (
            <span
              key={k}
              className="inline-flex h-5 w-5 items-center justify-center rounded bg-secondary text-[10px] font-mono font-medium"
            >
              {k.toUpperCase()}
            </span>
          ))}
          {lesson.keys.length > 12 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{lesson.keys.length - 12}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
