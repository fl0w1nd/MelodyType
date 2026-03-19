import { useState, useCallback, useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  Music,
  Volume2,
  VolumeX,
  Repeat,
  ArrowRight,
  ListOrdered,
  Shuffle,
  ChevronUp,
  ChevronDown,
  FileAudio,
  Music2,
  SkipForward,
  ListMusic,
  Minus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { useMidi } from "@/engine/midi/MidiContext"
import { presetList } from "@/engine/midi/presets"
import { db } from "@/lib/db"
import type { SelectedMidiSource } from "@/lib/settings"
import { cn } from "@/lib/utils"

const loopModeIcons = {
  loop: Repeat,
  once: ArrowRight,
  sequential: ListOrdered,
  random: Shuffle,
} as const

const loopModeLabels = {
  loop: "Loop",
  once: "Once",
  sequential: "Sequential",
  random: "Random",
} as const

const loopModeOrder: Array<"loop" | "once" | "sequential" | "random"> = [
  "loop",
  "once",
  "sequential",
  "random",
]

export function MidiFloatingPlayer() {
  const {
    config,
    updateConfig,
    selectedSource,
    changeVolume,
    selectPreset,
    selectMidiFile,
    playlist,
    melodyState,
  } = useMidi()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const userMidiFiles = useLiveQuery(() => db.midiFiles.toArray()) ?? []

  const getSourceName = useCallback(
    (source: SelectedMidiSource | null) => {
      if (!source) return "No selection"
      if (source.type === "preset") {
        return presetList.find((p) => p.id === source.id)?.name ?? source.id
      }
      return userMidiFiles.find((f) => f.id === source.id)?.name ?? `File #${source.id}`
    },
    [userMidiFiles],
  )

  const cycleLoopMode = useCallback(() => {
    const currentIdx = loopModeOrder.indexOf(config.loopMode)
    const nextIdx = (currentIdx + 1) % loopModeOrder.length
    updateConfig({ loopMode: loopModeOrder[nextIdx] })
  }, [config.loopMode, updateConfig])

  const playlistSources = useMemo(() => {
    if (playlist.length > 0) return playlist
    return [
      ...presetList.map((p) => ({ type: "preset" as const, id: p.id })),
      ...userMidiFiles
        .filter((f) => f.id != null)
        .map((f) => ({ type: "file" as const, id: f.id! })),
    ]
  }, [playlist, userMidiFiles])

  const handleNext = useCallback(() => {
    if (playlistSources.length === 0) return
    const currentIdx = selectedSource
      ? playlistSources.findIndex(
          (s) => s.type === selectedSource.type && s.id === selectedSource.id,
        )
      : -1
    const nextIdx = (currentIdx + 1) % playlistSources.length
    const next = playlistSources[nextIdx]
    if (next.type === "preset") {
      void selectPreset(next.id)
    } else {
      void selectMidiFile(next.id)
    }
  }, [playlistSources, selectedSource, selectPreset, selectMidiFile])

  if (!config.isEnabled) return null

  const LoopIcon = loopModeIcons[config.loopMode]
  const flowActive = melodyState.flowState === "flowing" || melodyState.flowState === "fading"

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full shadow-lg bg-card border-border/60",
                  flowActive && "ring-2 ring-primary/30",
                )}
                onClick={() => setIsMinimized(false)}
              />
            }
          >
            <Music2 className={cn("h-4 w-4", flowActive && "text-primary")} />
          </TooltipTrigger>
          <TooltipContent side="left">
            {getSourceName(selectedSource)}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-6 right-6 z-40 w-72"
    >
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              flowActive
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {selectedSource?.type === "file" ? (
              <FileAudio className="h-3.5 w-3.5" />
            ) : (
              <Music className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate leading-tight">
              {getSourceName(selectedSource)}
            </div>
            {flowActive && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-primary font-medium">♪ Playing</span>
                {melodyState.totalFrames > 0 && (
                  <span className="text-[10px] text-primary/60 font-mono tabular-nums">
                    {melodyState.frameIndex + 1}/{melodyState.totalFrames}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsMinimized(true)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded((v) => !v)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Frame progress bar */}
        {flowActive && melodyState.totalFrames > 0 && (
          <div className="h-0.5 bg-border/30">
            <motion.div
              className="h-full bg-primary/50"
              initial={false}
              animate={{ width: `${((melodyState.frameIndex + 1) / melodyState.totalFrames) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Volume */}
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => changeVolume(config.volume === -30 ? -6 : -30)}
          >
            {config.volume <= -30 ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
          <div className="w-20 shrink-0">
            <Slider
              value={[config.volume]}
              onValueChange={(v) => changeVolume(Array.isArray(v) ? v[0] : v)}
              min={-30}
              max={0}
              step={1}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-8 text-right shrink-0">
            {config.volume}dB
          </span>

          <div className="flex-1" />

          {/* Loop mode */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={cycleLoopMode}
                />
              }
            >
              <LoopIcon className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent side="top">
              {loopModeLabels[config.loopMode]}
            </TooltipContent>
          </Tooltip>

          {/* Next track */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleNext}
                />
              }
            >
              <SkipForward className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent side="top">Next track</TooltipContent>
          </Tooltip>
        </div>

        {/* Expanded: Playlist / Track list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <ListMusic className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {playlist.length > 0 ? "Playlist" : "All Tracks"}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">
                    {playlistSources.length}
                  </Badge>
                </div>
                <div className="max-h-48 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(color.border)_transparent] -mx-1 px-1">
                  <div className="flex flex-col gap-0.5">
                    {playlistSources.map((source, index) => {
                      const isActive =
                        selectedSource?.type === source.type &&
                        selectedSource?.id === source.id
                      return (
                        <button
                          key={`${source.type}-${source.id}-${index}`}
                          onClick={() => {
                            if (source.type === "preset") {
                              void selectPreset(source.id)
                            } else {
                              void selectMidiFile(source.id)
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/80 hover:bg-muted",
                          )}
                        >
                          <span className="text-[10px] font-mono text-muted-foreground/50 w-4 text-center tabular-nums shrink-0">
                            {index + 1}
                          </span>
                          {source.type === "preset" ? (
                            <Music className="h-3 w-3 shrink-0 text-muted-foreground" />
                          ) : (
                            <FileAudio className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                          <span className="text-xs truncate flex-1">
                            {getSourceName(source)}
                          </span>
                          {isActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
