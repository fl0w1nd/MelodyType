import { useCallback, useRef, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"
import {
  Settings,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Database,
  Info,
  Check,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { resetAppSettings, setAppSetting } from "@/lib/settings"
import { useMidi } from "@/engine/midi/MidiContext"
import {
  INITIAL_UNLOCK_COUNT,
  LETTER_FREQUENCY_ORDER,
} from "@/engine/typing/adaptiveEngine"

export default function SettingsPage() {
  const { t } = useTranslation()
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [resetSettingsDialogOpen, setResetSettingsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sessionCount = useLiveQuery(() => db.sessions.count()) ?? 0
  const keyStatCount = useLiveQuery(() => db.keyStats.count()) ?? 0
  const bigramStatCount = useLiveQuery(() => db.bigramStats.count()) ?? 0
  const midiFileCount = useLiveQuery(() => db.midiFiles.count()) ?? 0

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
      db.bigramStats.clear(),
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
      {/* Data Management */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            {t("settingsPage.dataManagement.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{t("settingsPage.dataManagement.sessions", { count: sessionCount })}</span>
            <span>&middot;</span>
            <span>{t("settingsPage.dataManagement.keyRecords", { count: keyStatCount })}</span>
            <span>&middot;</span>
            <span>{t("settingsPage.dataManagement.transitionRecords", { count: bigramStatCount })}</span>
            <span>&middot;</span>
            <span>{t("settingsPage.dataManagement.midiFiles", { count: midiFileCount })}</span>
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
              {exportStatus === "success"
                ? t("settingsPage.dataManagement.exported")
                : t("settingsPage.dataManagement.exportBackup")}
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
                ? t("settingsPage.dataManagement.imported")
                : importStatus === "error"
                  ? t("settingsPage.dataManagement.invalidFile")
                  : t("settingsPage.dataManagement.importBackup")}
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
                {t("settingsPage.dataManagement.clearStatistics")}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("settingsPage.dataManagement.clearDialog.title")}</DialogTitle>
                  <DialogDescription>
                    {t("settingsPage.dataManagement.clearDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setClearDialogOpen(false)}
                  >
                    {t("settingsPage.dataManagement.clearDialog.cancel")}
                  </Button>
                  <Button variant="destructive" onClick={handleClearAll}>
                    {t("settingsPage.dataManagement.clearDialog.confirm")}
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
                {t("settingsPage.dataManagement.resetSettings")}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("settingsPage.dataManagement.resetDialog.title")}</DialogTitle>
                  <DialogDescription>
                    {t("settingsPage.dataManagement.resetDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setResetSettingsDialogOpen(false)}
                  >
                    {t("settingsPage.dataManagement.resetDialog.cancel")}
                  </Button>
                  <Button variant="destructive" onClick={handleResetSettings}>
                    {t("settingsPage.dataManagement.resetDialog.confirm")}
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
            {t("settingsPage.about.title")}
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
                {t("settingsPage.about.tagline")}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("settingsPage.about.description")}
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
          <div className="mt-4 rounded-xl border border-border/50 bg-secondary/20 p-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("settingsPage.about.docsHint")}
            </p>
            <a
              href="/docs"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap ml-3"
            >
              {t("settingsPage.about.viewDocs")}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
