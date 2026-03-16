import { useCallback, useRef, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion } from "framer-motion"
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Database,
  Monitor,
  Info,
  Check,
  AlertTriangle,
  Music,
  Brain,
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
import { db, exportAllData, importAllData, getSetting, setSetting } from "@/lib/db"
import { useMidi } from "@/engine/midi/MidiContext"
import type { SynthType } from "@/engine/midi/types"
import {
  DEFAULT_TARGET_CPM,
  MIN_TARGET_CPM,
  MAX_TARGET_CPM,
} from "@/engine/typing/adaptiveEngine"

export default function SettingsPage() {
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sessionCount = useLiveQuery(() => db.sessions.count()) ?? 0
  const keyStatCount = useLiveQuery(() => db.keyStats.count()) ?? 0
  const midiFileCount = useLiveQuery(() => db.midiFiles.count()) ?? 0

  const showKeyboard = useLiveQuery(
    () => getSetting("showKeyboard"),
    [],
    "true",
  )
  const dailyGoalMinutes = useLiveQuery(
    () => getSetting("dailyGoalMinutes"),
    [],
    "30",
  )

  const adaptiveTargetCpm = useLiveQuery(
    () => getSetting("adaptive_targetCpm"),
    [],
    String(DEFAULT_TARGET_CPM),
  )
  const adaptiveRecoverKeys = useLiveQuery(
    () => getSetting("adaptive_recoverKeys"),
    [],
    "false",
  )
  const adaptiveAlphabetSize = useLiveQuery(
    () => getSetting("adaptive_alphabetSize"),
    [],
    "0",
  )

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
        setImportStatus("success")
        setTimeout(() => setImportStatus("idle"), 3000)
      } catch {
        setImportStatus("error")
        setTimeout(() => setImportStatus("idle"), 3000)
      }

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [],
  )

  const handleClearAll = useCallback(async () => {
    await Promise.all([
      db.sessions.clear(),
      db.keyStats.clear(),
      db.dailyGoals.clear(),
    ])
    setClearDialogOpen(false)
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight mb-1">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize your experience and manage your data
        </p>
      </motion.div>

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
              checked={showKeyboard === "true"}
              onCheckedChange={(v) =>
                setSetting("showKeyboard", v ? "true" : "false")
              }
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
              value={[Number(dailyGoalMinutes)]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v
                setSetting("dailyGoalMinutes", String(val))
              }}
              min={5}
              max={120}
              step={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Practice */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Adaptive Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Target Speed</div>
                <div className="text-xs text-muted-foreground">
                  CPM goal for key mastery
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {adaptiveTargetCpm} CPM ({Math.round(Number(adaptiveTargetCpm) / 5)} WPM)
              </Badge>
            </div>
            <Slider
              value={[Number(adaptiveTargetCpm)]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v
                setSetting("adaptive_targetCpm", String(val))
              }}
              min={MIN_TARGET_CPM}
              max={MAX_TARGET_CPM}
              step={5}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Recover Keys</div>
              <div className="text-xs text-muted-foreground">
                Require current speed (not just best) to unlock new keys
              </div>
            </div>
            <Switch
              checked={adaptiveRecoverKeys === "true"}
              onCheckedChange={(v) =>
                setSetting("adaptive_recoverKeys", v ? "true" : "false")
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Forced Unlock</div>
                <div className="text-xs text-muted-foreground">
                  Manually expand available keys beyond auto-unlock
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {Math.round(Number(adaptiveAlphabetSize) * 100)}%
              </Badge>
            </div>
            <Slider
              value={[Number(adaptiveAlphabetSize) * 100]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v
                setSetting("adaptive_alphabetSize", String(val / 100))
              }}
              min={0}
              max={100}
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
                    Delete All Data
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
