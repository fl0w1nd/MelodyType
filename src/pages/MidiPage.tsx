import { useCallback, useRef, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  Music,
  Upload,
  Trash2,
  Play,
  Volume2,
  FileAudio,
  Repeat,
  Shuffle,
  ArrowRight,
  Pencil,
  Music2,
  ListOrdered,
  Plus,
  GripVertical,
  ListMusic,
  X,
} from "lucide-react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { db } from "@/lib/db"
import type { MidiFile } from "@/lib/db"
import { parseMidiToFrames, getMidiInfo } from "@/engine/midi/midiParser"
import { presetList } from "@/engine/midi/presets"
import { useMidi } from "@/engine/midi/MidiContext"
import type { SynthType } from "@/engine/midi/types"
import type { SelectedMidiSource } from "@/lib/settings"
import { cn } from "@/lib/utils"

const EMPTY_MIDI_FILES: MidiFile[] = []

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
  { value: "sequential" as const, label: "Sequential", icon: ListOrdered },
  { value: "random" as const, label: "Random", icon: Shuffle },
]

interface PendingUpload {
  name: string
  description: string
  buffer: ArrayBuffer
  frameCount: number
}

function isActivationKey(key: string) {
  return key === "Enter" || key === " "
}

export default function MidiPage() {
  const userMidiFiles = useLiveQuery(() => db.midiFiles.toArray()) ?? EMPTY_MIDI_FILES
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [testNotes, setTestNotes] = useState<string[]>([])
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [editingFile, setEditingFile] = useState<MidiFile | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const {
    config,
    updateConfig,
    selectedSource,
    triggerNextFrame,
    changeSynth,
    changeVolume,
    testFrameInfo,
    getCurrentTestFrame,
    selectPreset,
    selectMidiFile,
    resetMidiState,
    playlist,
    updatePlaylist,
  } = useMidi()

  const selectedPreset = selectedSource?.type === "preset" ? selectedSource.id : null
  const selectedFile = selectedSource?.type === "file" ? selectedSource.id : null

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const buffer = await file.arrayBuffer()
      try {
        const info = getMidiInfo(buffer)
        const frames = parseMidiToFrames(buffer)
        const name = info.name !== "Untitled" ? info.name : file.name.replace(/\.mid$/i, "")

        setPendingUpload({
          name,
          description: "",
          buffer,
          frameCount: frames.length,
        })
      } catch (err) {
        console.error("Failed to parse MIDI file:", err)
      }

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [],
  )

  const handleConfirmUpload = useCallback(async () => {
    if (!pendingUpload) return

    await db.midiFiles.add({
      name: pendingUpload.name,
      description: pendingUpload.description || undefined,
      data: pendingUpload.buffer,
      frameCount: pendingUpload.frameCount,
      uploadedAt: Date.now(),
      isPreset: false,
    })

    setPendingUpload(null)
  }, [pendingUpload])

  const handleDeleteFile = useCallback(async (id: number) => {
    await db.midiFiles.delete(id)
    if (selectedSource?.type === "file" && selectedSource.id === id) {
      const fallbackPreset = presetList[0]
      if (fallbackPreset) {
        await selectPreset(fallbackPreset.id)
      } else {
        await resetMidiState()
      }
    }
  }, [resetMidiState, selectPreset, selectedSource])

  const handleEditFile = useCallback((file: MidiFile) => {
    setEditingFile(file)
    setEditName(file.name)
    setEditDescription(file.description ?? "")
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingFile?.id) return
    await db.midiFiles.update(editingFile.id, {
      name: editName,
      description: editDescription || undefined,
    })
    setEditingFile(null)
  }, [editingFile, editName, editDescription])

  const handleSelectPreset = useCallback(
    async (presetId: string) => {
      await selectPreset(presetId)
    },
    [selectPreset],
  )

  const handleSelectFile = useCallback(
    async (file: MidiFile) => {
      if (file.id == null) return
      await selectMidiFile(file.id)
    },
    [selectMidiFile],
  )

  const getSourceName = useCallback(
    (source: SelectedMidiSource) => {
      if (source.type === "preset") {
        return presetList.find((p) => p.id === source.id)?.name ?? source.id
      }
      return userMidiFiles.find((f) => f.id === source.id)?.name ?? `File #${source.id}`
    },
    [userMidiFiles],
  )

  const isInPlaylist = useCallback(
    (source: SelectedMidiSource) =>
      playlist.some(
        (s) => s.type === source.type && s.id === source.id,
      ),
    [playlist],
  )

  const handleAddToPlaylist = useCallback(
    (source: SelectedMidiSource) => {
      if (isInPlaylist(source)) return
      void updatePlaylist([...playlist, source])
    },
    [isInPlaylist, playlist, updatePlaylist],
  )

  const handleRemoveFromPlaylist = useCallback(
    (index: number) => {
      const next = playlist.filter((_, i) => i !== index)
      void updatePlaylist(next)
    },
    [playlist, updatePlaylist],
  )

  const handleTestPlay = useCallback(() => {
    const frame = getCurrentTestFrame()
    triggerNextFrame()
    if (frame) {
      setTestNotes(frame.notes.map((n) => n.name))
      setTimeout(() => setTestNotes([]), 400)
    }
  }, [getCurrentTestFrame, triggerNextFrame])

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100vh-10rem)]">
      {/* ── Top Control Bar ── */}
      <div className="shrink-0 rounded-xl bg-card ring-1 ring-foreground/10 px-5 py-3">
        <div className="flex items-center gap-x-4">
          {/* Enable toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">MIDI</span>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(v) => updateConfig({ isEnabled: v })}
            />
          </div>

          <div className="h-6 w-px bg-border/60 shrink-0" />

          {/* Instrument */}
          <div className="shrink-0">
            <Select
              value={config.synthType}
              onValueChange={(v) => changeSynth(v as SynthType)}
            >
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {synthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-1.5">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border/60 shrink-0" />

          {/* Volume */}
          <div className="flex items-center gap-2 shrink-0">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="w-24 shrink-0">
              <Slider
                value={[config.volume]}
                onValueChange={(v) => changeVolume(Array.isArray(v) ? v[0] : v)}
                min={-30}
                max={0}
                step={1}
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-mono w-9 text-right tabular-nums shrink-0">
              {config.volume}dB
            </span>
          </div>

          <div className="h-6 w-px bg-border/60 shrink-0" />

          {/* Loop mode — icon-only with tooltips */}
          <div className="flex items-center gap-0.5 shrink-0">
            {loopOptions.map((opt) => (
              <Tooltip key={opt.value}>
                <TooltipTrigger
                  render={
                    <Button
                      variant={config.loopMode === opt.value ? "default" : "ghost"}
                      size="icon-xs"
                      onClick={() => updateConfig({ loopMode: opt.value })}
                    />
                  }
                >
                  <opt.icon className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{opt.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex-1 min-w-0" />

          {/* Test play */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <AnimatePresence>
                {testNotes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-full right-0 mb-2 flex gap-1 whitespace-nowrap"
                  >
                    {testNotes.map((n, i) => (
                      <Badge key={i} className="font-mono text-[10px] px-1.5 py-0">
                        {n}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <Badge variant="secondary" className="text-[10px] font-mono tabular-nums">
                {testFrameInfo.total > 0 ? testFrameInfo.current + 1 : 0}/{testFrameInfo.total}
              </Badge>
            </div>
            <Button
              onClick={handleTestPlay}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={testFrameInfo.total === 0}
            >
              <Play className="h-3 w-3" />
              Test
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Content: Three-Column Layout ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        {/* Presets Column */}
        <div className="flex-[3] min-w-0 flex flex-col">
          <div className="shrink-0 flex items-center gap-2 mb-3">
            <Music className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Presets</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-tight">
              {presetList.length}
            </Badge>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(color.border)_transparent] pr-1">
            <div className="flex flex-col gap-2">
              {presetList.map((preset) => (
                <div
                  key={preset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectPreset(preset.id)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (!isActivationKey(event.key)) return
                    event.preventDefault()
                    handleSelectPreset(preset.id)
                  }}
                  className={cn(
                    "group relative flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all duration-150",
                    selectedPreset === preset.id
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:border-primary/25 hover:bg-card",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                        selectedPreset === preset.id
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                      )}
                    >
                      <Music className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate leading-tight">
                        {preset.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className={cn(
                          "text-muted-foreground",
                          isInPlaylist({ type: "preset", id: preset.id })
                            ? "text-primary/50 pointer-events-none"
                            : "hover:text-primary",
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToPlaylist({ type: "preset", id: preset.id })
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
                      {preset.frameCount} frames
                    </span>
                    {selectedPreset === preset.id && (
                      <Badge className="text-[10px] px-1.5 py-0">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Your Files Column */}
        <div className="flex-[3] min-w-0 flex flex-col">
          <div className="shrink-0 flex items-center gap-2 mb-3">
            <FileAudio className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Your Files</span>
            {userMidiFiles.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-tight">
                {userMidiFiles.length}
              </Badge>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              size="xs"
              className="gap-1 text-xs shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mid,.midi"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(color.border)_transparent] pr-1">
            {userMidiFiles.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-full rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground/80">
                  Upload your MIDI files
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[180px] text-center">
                  Drop .mid files here or click to browse. Your files play alongside presets.
                </p>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {userMidiFiles.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "group relative flex flex-col gap-1.5 rounded-xl border p-3 transition-all duration-150 cursor-pointer",
                      selectedFile === file.id
                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60 hover:border-primary/25 hover:bg-card",
                    )}
                    onClick={() => handleSelectFile(file)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          selectedFile === file.id
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                      >
                        <FileAudio className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate leading-tight">
                          {file.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {file.id != null && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className={cn(
                              "text-muted-foreground",
                              isInPlaylist({ type: "file", id: file.id })
                                ? "text-primary/50 pointer-events-none"
                                : "hover:text-primary",
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToPlaylist({ type: "file", id: file.id! })
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditFile(file)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (file.id) handleDeleteFile(file.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {file.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
                        {file.frameCount} frames · {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                      {selectedFile === file.id && (
                        <Badge className="text-[10px] px-1.5 py-0">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 p-3 hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">Add more</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Playlist Column */}
        <div className="flex-[2] min-w-0 flex flex-col rounded-xl border border-border/60 bg-card/50">
          <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
            <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Playlist</span>
            {playlist.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-tight">
                {playlist.length}
              </Badge>
            )}
            <div className="flex-1" />
            {playlist.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => void updatePlaylist([])}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(color.border)_transparent]">
            {playlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full h-full px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-2">
                  <ListMusic className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-foreground/70">
                  Playlist is empty
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 text-center">
                  Use <Plus className="inline h-3 w-3 -mt-px" /> to add tracks
                </p>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={playlist}
                onReorder={(newOrder) => void updatePlaylist(newOrder)}
                className="flex flex-col gap-1 p-2"
              >
                {playlist.map((source, index) => {
                  const isActive =
                    selectedSource?.type === source.type &&
                    selectedSource?.id === source.id
                  return (
                    <Reorder.Item
                      key={`${source.type}-${source.id}`}
                      value={source}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors cursor-pointer select-none",
                        isActive
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/60 hover:border-primary/25 hover:bg-card",
                      )}
                      whileDrag={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      onClick={() => {
                        if (source.type === "preset") {
                          void selectPreset(source.id)
                        } else {
                          void selectMidiFile(source.id)
                        }
                      }}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />
                      <span className="text-muted-foreground/40 text-xs font-mono tabular-nums w-4 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {source.type === "preset" ? (
                          <Music className="h-3 w-3" />
                        ) : (
                          <FileAudio className="h-3 w-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium truncate block">
                          {getSourceName(source)}
                        </span>
                      </div>
                      {isActive && (
                        <Badge className="text-[9px] px-1 py-0 shrink-0">Playing</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromPlaylist(index)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
            )}
          </div>
          {playlist.length > 0 && (
            <div className="shrink-0 px-3 py-2 border-t border-border/40">
              <span className="text-[11px] text-muted-foreground">
                {playlist.length} item{playlist.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Upload Dialog ── */}
      <Dialog
        open={pendingUpload !== null}
        onOpenChange={(open) => { if (!open) setPendingUpload(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload MIDI File</DialogTitle>
            <DialogDescription>
              Edit the name and add a description before saving.
            </DialogDescription>
          </DialogHeader>
          {pendingUpload && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={pendingUpload.name}
                  onChange={(e) =>
                    setPendingUpload({ ...pendingUpload, name: e.target.value })
                  }
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={pendingUpload.description}
                  onChange={(e) =>
                    setPendingUpload({ ...pendingUpload, description: e.target.value })
                  }
                  placeholder="Optional description..."
                  rows={2}
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileAudio className="h-3.5 w-3.5" />
                <span>{pendingUpload.frameCount} frames detected</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleConfirmUpload}
              disabled={!pendingUpload?.name.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog
        open={editingFile !== null}
        onOpenChange={(open) => { if (!open) setEditingFile(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit MIDI File</DialogTitle>
            <DialogDescription>
              Update the name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
