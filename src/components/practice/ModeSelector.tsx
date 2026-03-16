import { useState } from "react"
import { Clock, Quote, Brain } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      onSelect({ mode: "time" })
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
    </div>
  )
}
