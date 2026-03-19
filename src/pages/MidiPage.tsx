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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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

interface PendingUpload {
  name: string
  description: string
  buffer: ArrayBuffer
  frameCount: number
}

export default function MidiPage() {
  const userMidiFiles = useLiveQuery(() => db.midiFiles.toArray()) ?? []
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

  const handleTestPlay = useCallback(() => {
    const frame = getCurrentTestFrame()
    triggerNextFrame()
    if (frame) {
      setTestNotes(frame.notes.map((n) => n.name))
      setTimeout(() => setTestNotes([]), 400)
    }
  }, [getCurrentTestFrame, triggerNextFrame])

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-10rem)]">
      {/* ── Top Control Bar ── */}
      <div className="shrink-0 rounded-xl bg-card ring-1 ring-foreground/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Enable toggle */}
          <div className="flex items-center gap-2.5">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">MIDI</span>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(v) => updateConfig({ isEnabled: v })}
            />
          </div>

          <div className="h-6 w-px bg-border/60 hidden sm:block" />

          {/* Instrument */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Instrument</label>
            <Select
              value={config.synthType}
              onValueChange={(v) => changeSynth(v as SynthType)}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs">
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

          <div className="h-6 w-px bg-border/60 hidden sm:block" />

          {/* Volume */}
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="w-28 shrink-0">
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

          <div className="h-6 w-px bg-border/60 hidden sm:block" />

          {/* Loop mode */}
          <div className="flex items-center gap-1">
            {loopOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={config.loopMode === opt.value ? "default" : "ghost"}
                size="xs"
                className="gap-1"
                onClick={() => updateConfig({ loopMode: opt.value })}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </Button>
            ))}
          </div>

          <div className="flex-1" />

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

      {/* ── Main Content: Tabbed Melody Browser ── */}
      <Tabs defaultValue="presets" className="flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="presets">
              <Music className="h-3.5 w-3.5" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileAudio className="h-3.5 w-3.5" />
              Your Files
              {userMidiFiles.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 leading-tight">
                  {userMidiFiles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
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
            onChange={handleFileSelected}
          />
        </div>

        {/* Presets Tab */}
        <TabsContent value="presets" className="flex-1 min-h-0 mt-3">
          <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(color.border)_transparent] pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {presetList.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-150",
                    selectedPreset === preset.id
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:border-primary/25 hover:bg-card",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        selectedPreset === preset.id
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                      )}
                    >
                      <Music className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate leading-tight">
                        {preset.name}
                      </div>
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
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Your Files Tab */}
        <TabsContent value="files" className="flex-1 min-h-0 mt-3">
          {userMidiFiles.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full h-full rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground/80">
                Drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .mid and .midi files
              </p>
            </button>
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(color.border)_transparent] pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userMidiFiles.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 cursor-pointer",
                      selectedFile === file.id
                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60 hover:border-primary/25 hover:bg-card",
                    )}
                    onClick={() => handleSelectFile(file)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          selectedFile === file.id
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                      >
                        <FileAudio className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate leading-tight">
                          {file.name}
                        </div>
                      </div>
                      {/* Actions — visible on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

                {/* Upload card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 p-4 min-h-[100px] hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">Add more</span>
                </button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
