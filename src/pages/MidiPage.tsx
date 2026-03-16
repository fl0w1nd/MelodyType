import { useCallback, useEffect, useRef, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  Music,
  Upload,
  Trash2,
  Play,
  Volume2,
  Sparkles,
  FileAudio,
  Repeat,
  Shuffle,
  ArrowRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { db } from "@/lib/db"
import type { MidiFile } from "@/lib/db"
import { parseMidiToFrames, getMidiInfo } from "@/engine/midi/midiParser"
import { presetMelodies, presetList } from "@/engine/midi/presets"
import { useMidi } from "@/engine/midi/MidiContext"
import type { SynthType } from "@/engine/midi/types"
import { cn } from "@/lib/utils"

const synthOptions: { value: SynthType; label: string; icon: string }[] = [
  { value: "piano", label: "Piano", icon: "🎹" },
  { value: "strings", label: "Strings", icon: "🎻" },
  { value: "synth", label: "Synth", icon: "🎛️" },
  { value: "musicBox", label: "Music Box", icon: "🎵" },
  { value: "bell", label: "Bell", icon: "🔔" },
]

const loopOptions = [
  { value: "loop" as const, label: "Loop", icon: Repeat },
  { value: "once" as const, label: "Once", icon: ArrowRight },
  { value: "random" as const, label: "Random", icon: Shuffle },
]

export default function MidiPage() {
  const userMidiFiles = useLiveQuery(() => db.midiFiles.toArray()) ?? []
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<number | null>(null)
  const [testNotes, setTestNotes] = useState<string[]>([])
  const {
    config,
    updateConfig,
    loadFrames,
    triggerNextFrame,
    changeSynth,
    changeVolume,
    currentIndex,
    totalFrames,
    getFrameInfo,
    initSynth,
  } = useMidi()

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const buffer = await file.arrayBuffer()
      try {
        const info = getMidiInfo(buffer)
        const frames = parseMidiToFrames(buffer)

        await db.midiFiles.add({
          name: info.name !== "Untitled" ? info.name : file.name.replace(/\.mid$/i, ""),
          data: buffer,
          frameCount: frames.length,
          uploadedAt: Date.now(),
          isPreset: false,
        })
      } catch (err) {
        console.error("Failed to parse MIDI file:", err)
      }

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [],
  )

  const handleDeleteFile = useCallback(async (id: number) => {
    await db.midiFiles.delete(id)
    setSelectedFile((prev) => (prev === id ? null : prev))
  }, [])

  const handleSelectPreset = useCallback(
    async (presetId: string) => {
      setSelectedPreset(presetId)
      setSelectedFile(null)
      const preset = presetMelodies[presetId]
      if (preset) {
        await initSynth()
        await loadFrames(preset.frames)
      }
    },
    [loadFrames, initSynth],
  )

  const handleSelectFile = useCallback(
    async (file: MidiFile) => {
      setSelectedFile(file.id ?? null)
      setSelectedPreset(null)
      const frames = parseMidiToFrames(file.data)
      await initSynth()
      await loadFrames(frames)
    },
    [loadFrames, initSynth],
  )

  const handleTestPlay = useCallback(() => {
    const info = getFrameInfo()
    triggerNextFrame()
    const frame =
      selectedPreset && presetMelodies[selectedPreset]
        ? presetMelodies[selectedPreset].frames[info.current]
        : null
    if (frame) {
      setTestNotes(frame.notes.map((n) => n.name))
      setTimeout(() => setTestNotes([]), 400)
    }
  }, [triggerNextFrame, getFrameInfo, selectedPreset])

  useEffect(() => {
    if (!selectedPreset && presetList.length > 0) {
      handleSelectPreset(presetList[0].id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Synth Settings */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="h-4 w-4 text-primary" />
              Sound Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">MIDI Enabled</span>
              <Switch
                checked={config.isEnabled}
                onCheckedChange={(v) => updateConfig({ isEnabled: v })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Instrument</label>
              <Select
                value={config.synthType}
                onValueChange={(v) => changeSynth(v as SynthType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {synthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-xs text-muted-foreground font-mono">
                  {config.volume}dB
                </span>
              </div>
              <Slider
                value={[config.volume]}
                onValueChange={(v) => changeVolume(Array.isArray(v) ? v[0] : v)}
                min={-30}
                max={0}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Playback Mode</label>
              <div className="flex gap-2">
                {loopOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={
                      config.loopMode === opt.value ? "default" : "outline"
                    }
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => updateConfig({ loopMode: opt.value })}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Test Play</label>
                <Badge variant="secondary" className="text-xs font-mono">
                  {currentIndex + 1} / {totalFrames}
                </Badge>
              </div>
              <Button
                onClick={handleTestPlay}
                variant="outline"
                className="w-full gap-2"
                disabled={totalFrames === 0}
              >
                <Play className="h-4 w-4" />
                Play Next Frame
              </Button>
              <AnimatePresence>
                {testNotes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-1.5 justify-center flex-wrap"
                  >
                    {testNotes.map((n, i) => (
                      <Badge key={i} className="font-mono text-xs">
                        {n}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Preset Melodies */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Melodies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Built-in Presets
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetList.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                      selectedPreset === preset.id
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border/60 hover:border-primary/20 hover:bg-secondary/30",
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {preset.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {preset.description}
                      </div>
                      <Badge
                        variant="secondary"
                        className="mt-1 text-[10px]"
                      >
                        {preset.frameCount} frames
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Your MIDI Files
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload .mid
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mid,.midi"
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>

              {userMidiFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border/60">
                  <FileAudio className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No uploaded MIDI files yet
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Upload a .mid file to use your own melodies
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userMidiFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                        selectedFile === file.id
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/60 hover:border-primary/20",
                      )}
                      onClick={() => handleSelectFile(file)}
                    >
                      <FileAudio className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {file.frameCount} frames &middot;{" "}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (file.id) handleDeleteFile(file.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
