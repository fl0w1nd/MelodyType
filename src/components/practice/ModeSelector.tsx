import { Clock, Quote, Brain } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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
  const { t } = useTranslation()

  const modeLabels: Record<PracticeMode, string> = {
    adaptive: t("modeSelector.adaptive"),
    time: t("modeSelector.time"),
    quote: t("modeSelector.quote"),
  }

  const modeDescriptions: Record<PracticeMode, string> = {
    adaptive: t("modeSelector.adaptiveDesc"),
    time: t("modeSelector.timeDesc"),
    quote: t("modeSelector.quoteDesc"),
  }

  const handleModeChange = (newMode: string) => {
    const nextMode = newMode as PracticeMode

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
      <Tabs value={currentConfig.mode} onValueChange={handleModeChange}>
        <TabsList className="h-auto flex-wrap">
          {(["adaptive", "time", "quote"] as PracticeMode[]).map((practiceMode) => (
            <Tooltip key={practiceMode}>
              <TooltipTrigger
                render={
                  <TabsTrigger
                    value={practiceMode}
                    className="gap-1.5 text-xs sm:text-sm transition-all duration-200"
                  />
                }
              >
                {modeIcons[practiceMode]}
                {modeLabels[practiceMode]}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-center">
                {modeDescriptions[practiceMode]}
              </TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
