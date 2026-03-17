import { useCallback, useRef, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  Settings,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Database,
  Monitor,
  Info,
  Check,
  AlertTriangle,
  Music,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { db, exportAllData, importAllData } from "@/lib/db"
import { resetAppSettings, setAppSetting, useAppSetting } from "@/lib/settings"
import { useMidi } from "@/engine/midi/MidiContext"
import type { SynthType } from "@/engine/midi/types"
import {
  INITIAL_UNLOCK_COUNT,
  LETTER_FREQUENCY_ORDER,
} from "@/engine/typing/adaptiveEngine"

export default function SettingsPage() {
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [resetSettingsDialogOpen, setResetSettingsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sessionCount = useLiveQuery(() => db.sessions.count()) ?? 0
  const keyStatCount = useLiveQuery(() => db.keyStats.count()) ?? 0
  const midiFileCount = useLiveQuery(() => db.midiFiles.count()) ?? 0

  const showKeyboard = useAppSetting("showKeyboard")
  const dailyGoalMinutes = useAppSetting("dailyGoalMinutes")

  const midi = useMidi()

  const handleExport = useCallback(async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `melodytype-backup-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus("success")
      setTimeout(() => setExportStatus("idle"), 3000)
    } catch {
      setExportStatus("error")
      setTimeout(() => setExportStatus("idle"), 3000)
    }
  }, [])

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        await importAllData(text)
        await midi.resetMidiState()
        setImportStatus("success")
        setTimeout(() => setImportStatus("idle"), 3000)
      } catch {
        setImportStatus("error")
        setTimeout(() => setImportStatus("idle"), 3000)
      }

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [midi],
  )

  const handleClearAll = useCallback(async () => {
    await Promise.all([
      db.sessions.clear(),
      db.keyStats.clear(),
      db.dailyGoals.clear(),
      setAppSetting("adaptiveForcedKeys", []),
      setAppSetting(
        "adaptiveUnlocked",
        LETTER_FREQUENCY_ORDER.slice(0, INITIAL_UNLOCK_COUNT),
      ),
    ])
    setClearDialogOpen(false)
  }, [])

  const handleResetSettings = useCallback(async () => {
    await resetAppSettings()
    await midi.resetMidiState()
    setResetSettingsDialogOpen(false)
  }, [midi])

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Display Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4 text-primary" />
            Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Virtual Keyboard</div>
              <div className="text-xs text-muted-foreground">
                Show keyboard during practice
              </div>
            </div>
            <Switch
              checked={showKeyboard}
              onCheckedChange={(value) => void setAppSetting("showKeyboard", value)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Daily Goal</div>
                <div className="text-xs text-muted-foreground">
                  Target practice minutes per day
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {dailyGoalMinutes} min
              </Badge>
            </div>
            <Slider
              value={[dailyGoalMinutes]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v
                void setAppSetting("dailyGoalMinutes", val)
              }}
              min={5}
              max={120}
              step={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* MIDI Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="h-4 w-4 text-primary" />
            MIDI Sound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Enable MIDI</div>
              <div className="text-xs text-muted-foreground">
                Play notes as you type
              </div>
            </div>
            <Switch
              checked={midi.config.isEnabled}
              onCheckedChange={(v) => midi.updateConfig({ isEnabled: v })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Instrument</label>
            <Select
              value={midi.config.synthType}
              onValueChange={(v) => midi.changeSynth(v as SynthType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piano">🎹 Piano</SelectItem>
                <SelectItem value="strings">🎻 Strings</SelectItem>
                <SelectItem value="synth">🎛️ Synth</SelectItem>
                <SelectItem value="musicBox">🎵 Music Box</SelectItem>
                <SelectItem value="bell">🔔 Bell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-xs text-muted-foreground font-mono">
                {midi.config.volume}dB
              </span>
            </div>
            <Slider
              value={[midi.config.volume]}
              onValueChange={(v) => midi.changeVolume(Array.isArray(v) ? v[0] : v)}
              min={-30}
              max={0}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{sessionCount} sessions</span>
            <span>&middot;</span>
            <span>{keyStatCount} key records</span>
            <span>&middot;</span>
            <span>{midiFileCount} MIDI files</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
            >
              {exportStatus === "success" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportStatus === "success" ? "Exported!" : "Export Backup"}
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              {importStatus === "success" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : importStatus === "error" ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importStatus === "success"
                ? "Imported!"
                : importStatus === "error"
                  ? "Invalid File"
                  : "Import Backup"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setClearDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Clear Statistics
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Statistics?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your typing sessions, key
                    statistics, and daily goals. MIDI files and settings will be
                    preserved. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setClearDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleClearAll}>
                    Delete Statistics
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={resetSettingsDialogOpen}
              onOpenChange={setResetSettingsDialogOpen}
            >
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setResetSettingsDialogOpen(true)}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Settings
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset All Settings?</DialogTitle>
                  <DialogDescription>
                    This restores MelodyType to its default configuration,
                    including adaptive practice, display, and MIDI preferences.
                    Your practice statistics and MIDI files will be preserved.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setResetSettingsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleResetSettings}>
                    Reset Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-lg">MelodyType</div>
              <div className="text-xs text-muted-foreground">
                Where typing meets music
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MelodyType is a typing practice application that combines keyboard
            training with musical enjoyment. Each keystroke triggers MIDI notes,
            turning your practice sessions into melodies. All your data is stored
            locally in your browser — no accounts, no cloud, complete privacy.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "React",
              "Shadcn/ui",
              "Tone.js",
              "Dexie.js",
              "Recharts",
              "Framer Motion",
            ].map((tech) => (
              <Badge
                key={tech}
                variant="secondary"
                className="text-[10px]"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
