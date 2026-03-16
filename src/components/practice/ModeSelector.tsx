import { useState } from "react"
import { Clock, Quote, Brain, Hash, AtSign } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { PracticeMode, PracticeModeConfig } from "@/engine/typing/types"

interface ModeSelectorProps {
  onSelect: (config: PracticeModeConfig) => void
  currentConfig: PracticeModeConfig
}

const modeIcons: Record<PracticeMode, React.ReactNode> = {
  adaptive: <Brain className="h-3.5 w-3.5" />,
  time: <Clock className="h-3.5 w-3.5" />,
  quote: <Quote className="h-3.5 w-3.5" />,
}

const timeOptions = [15, 30, 60, 120]
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

  const handleModeChange = (newMode: string) => {
    const nextMode = newMode as PracticeMode
    setMode(nextMode)

    if (nextMode === "adaptive") {
      onSelect({ mode: "adaptive" })
      return
    }

    if (nextMode === "time") {
      onSelect({
        mode: "time",
        timeLimit: currentConfig.timeLimit ?? 30,
        difficulty: currentConfig.difficulty ?? "easy",
        punctuation: currentConfig.punctuation ?? false,
        numbers: currentConfig.numbers ?? false,
      })
      return
    }

    onSelect({ mode: "quote" })
  }

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList className="h-auto flex-wrap">
          {(["adaptive", "time", "quote"] as PracticeMode[]).map((practiceMode) => (
            <TabsTrigger
              key={practiceMode}
              value={practiceMode}
              className="gap-1.5 text-xs sm:text-sm capitalize"
            >
              {modeIcons[practiceMode]}
              {practiceMode === "adaptive" ? "Adaptive" : practiceMode}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {mode === "time" && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-1">
              Duration:
            </span>
            {timeOptions.map((timeLimit) => (
              <Button
                key={timeLimit}
                variant={currentConfig.timeLimit === timeLimit ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() =>
                  onSelect({ ...currentConfig, mode: "time", timeLimit })
                }
              >
                {timeLimit}s
              </Button>
            ))}
          </div>
          <div className="w-px h-5 bg-border/60 mx-1" />
          <div className="flex gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-1">Level:</span>
            {difficultyOptions.map((difficulty) => (
              <Button
                key={difficulty.value}
                variant={
                  currentConfig.difficulty === difficulty.value ? "default" : "ghost"
                }
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() =>
                  onSelect({ ...currentConfig, mode: "time", difficulty: difficulty.value })
                }
              >
                {difficulty.label}
              </Button>
            ))}
          </div>
          <div className="w-px h-5 bg-border/60 mx-1" />
          <div className="flex gap-1 items-center">
            <Button
              variant={currentConfig.punctuation ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() =>
                onSelect({
                  ...currentConfig,
                  mode: "time",
                  punctuation: !currentConfig.punctuation,
                })
              }
            >
              <AtSign className="h-3 w-3" />
              Punctuation
            </Button>
            <Button
              variant={currentConfig.numbers ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() =>
                onSelect({
                  ...currentConfig,
                  mode: "time",
                  numbers: !currentConfig.numbers,
                })
              }
            >
              <Hash className="h-3 w-3" />
              Numbers
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
