import { useState } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Brain,
  Clock,
  Quote,
  Gauge,
  Target,
  Zap,
  Music,
  Keyboard,
  BarChart3,
  Flame,
  Hash,
  Trophy,
  Activity,
  TrendingUp,
  Star,
  Lock,
  Crosshair,
  CalendarCheck,
  FileAudio,
  Settings,
  ChevronRight,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

type DocSection =
  | "overview"
  | "practice"
  | "adaptive"
  | "time"
  | "quote"
  | "metrics"
  | "melody"
  | "dashboard"
  | "midi"
  | "shortcuts"

export default function DocsPage() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<DocSection>("overview")

  const sections: { id: DocSection; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t("docsPage.nav.gettingStarted"), icon: <BookOpen className="h-4 w-4" /> },
    { id: "practice", label: t("docsPage.nav.practiceModes"), icon: <Keyboard className="h-4 w-4" /> },
    { id: "adaptive", label: t("docsPage.nav.adaptiveMode"), icon: <Brain className="h-4 w-4" /> },
    { id: "time", label: t("docsPage.nav.timeMode"), icon: <Clock className="h-4 w-4" /> },
    { id: "quote", label: t("docsPage.nav.quoteMode"), icon: <Quote className="h-4 w-4" /> },
    { id: "metrics", label: t("docsPage.nav.metricsGlossary"), icon: <Gauge className="h-4 w-4" /> },
    { id: "melody", label: t("docsPage.nav.melodyMidi"), icon: <Music className="h-4 w-4" /> },
    { id: "dashboard", label: t("docsPage.nav.dashboard"), icon: <BarChart3 className="h-4 w-4" /> },
    { id: "midi", label: t("docsPage.nav.midiManagement"), icon: <FileAudio className="h-4 w-4" /> },
    { id: "shortcuts", label: t("docsPage.nav.keyboardShortcuts"), icon: <Settings className="h-4 w-4" /> },
  ]

  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <OverviewSection onNavigate={setActiveSection} />
      case "practice": return <PracticeSection onNavigate={setActiveSection} />
      case "adaptive": return <AdaptiveSection />
      case "time": return <TimeSection />
      case "quote": return <QuoteSection />
      case "metrics": return <MetricsSection />
      case "melody": return <MelodySection />
      case "dashboard": return <DashboardSection />
      case "midi": return <MidiSection />
      case "shortcuts": return <ShortcutsSection />
    }
  }

  return (
    <div className="flex gap-8">
      {/* Sidebar Navigation */}
      <nav className="hidden lg:flex w-56 shrink-0 flex-col gap-1 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 px-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-medium">{t("nav.docs")}</span>
        </div>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-left",
              activeSection === section.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </nav>

      {/* Mobile nav */}
      <div className="lg:hidden w-full">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-medium">{t("nav.docs")}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                activeSection === section.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground bg-secondary/40",
              )}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-w-0 hidden lg:block"
      >
        {renderSection()}
      </motion.div>

      {/* Mobile content */}
      <motion.div
        key={`mobile-${activeSection}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-w-0 lg:hidden -mt-2"
      >
        {renderSection()}
      </motion.div>
    </div>
  )
}

function DocHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground mb-2">{children}</h2>
}

function DocSubheading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-base text-foreground mt-6 mb-2 flex items-center gap-2">{children}</h3>
}

function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
}

function DocCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-4 text-left transition-all duration-200",
        onClick && "hover:border-primary/30 hover:bg-card/80 hover:shadow-sm cursor-pointer",
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground flex items-center gap-1">
          {title}
          {onClick && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
      </div>
    </button>
  )
}

function MetricRow({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground/60 mt-0.5">{icon}</span>
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border/60 bg-secondary/60 px-1.5 py-0.5 text-[11px] font-mono font-medium">
      {children}
    </kbd>
  )
}

function OverviewSection({ onNavigate }: { onNavigate: (s: DocSection) => void }) {
  const { t } = useTranslation()
  const quickStartSteps = t("docsPage.overview.quickStart.step1") as unknown as string
  void quickStartSteps
  return (
    <div>
      <DocHeading>{t("docsPage.overview.title")}</DocHeading>
      <DocParagraph>{t("docsPage.overview.p1")}</DocParagraph>
      <DocParagraph>{t("docsPage.overview.p2")}</DocParagraph>

      <DocSubheading>{t("docsPage.overview.quickStart.title")}</DocSubheading>
      <div className="space-y-2 mb-6">
        {[
          t("docsPage.overview.quickStart.step1"),
          t("docsPage.overview.quickStart.step2"),
          t("docsPage.overview.quickStart.step3"),
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <DocSubheading>{t("docsPage.overview.features.title")}</DocSubheading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DocCard
          icon={<Keyboard className="h-4 w-4" />}
          title={t("docsPage.overview.features.adaptive.title")}
          description={t("docsPage.overview.features.adaptive.desc")}
          onClick={() => onNavigate("adaptive")}
        />
        <DocCard
          icon={<Gauge className="h-4 w-4" />}
          title={t("docsPage.overview.features.time.title")}
          description={t("docsPage.overview.features.time.desc")}
          onClick={() => onNavigate("time")}
        />
        <DocCard
          icon={<Music className="h-4 w-4" />}
          title={t("docsPage.overview.features.midi.title")}
          description={t("docsPage.overview.features.midi.desc")}
          onClick={() => onNavigate("midi")}
        />
        <DocCard
          icon={<BarChart3 className="h-4 w-4" />}
          title={t("docsPage.overview.features.dashboard.title")}
          description={t("docsPage.overview.features.dashboard.desc")}
          onClick={() => onNavigate("dashboard")}
        />
      </div>
    </div>
  )
}

function PracticeSection({ onNavigate }: { onNavigate: (s: DocSection) => void }) {
  const { t } = useTranslation()
  return (
    <div>
      <DocHeading>{t("docsPage.practice.title")}</DocHeading>
      <DocParagraph>{t("docsPage.practice.description")}</DocParagraph>

      <div className="grid gap-3 mt-4">
        <DocCard
          icon={<Brain className="h-4 w-4" />}
          title={t("docsPage.practice.modes.adaptive.title")}
          description={t("docsPage.practice.modes.adaptive.desc")}
          onClick={() => onNavigate("adaptive")}
        />
        <DocCard
          icon={<Clock className="h-4 w-4" />}
          title={t("docsPage.practice.modes.time.title")}
          description={t("docsPage.practice.modes.time.desc")}
          onClick={() => onNavigate("time")}
        />
        <DocCard
          icon={<Quote className="h-4 w-4" />}
          title={t("docsPage.practice.modes.quote.title")}
          description={t("docsPage.practice.modes.quote.desc")}
          onClick={() => onNavigate("quote")}
        />
      </div>

      <DocSubheading>{t("docsPage.practice.commonControls.title")}</DocSubheading>
      <DocParagraph>
        {t("docsPage.practice.commonControls.desc")} <Kbd>Tab</Kbd>
      </DocParagraph>
    </div>
  )
}

function AdaptiveSection() {
  const { t } = useTranslation()
  const masteryItems = t("docsPage.adaptive.masteryCriteria.items", { returnObjects: true }) as string[]
  return (
    <div>
      <DocHeading>{t("docsPage.adaptive.title")}</DocHeading>
      <DocParagraph>{t("docsPage.adaptive.p1")}</DocParagraph>

      <DocSubheading>
        <Lock className="h-4 w-4 text-muted-foreground" />
        {t("docsPage.adaptive.progressiveUnlocking.title")}
      </DocSubheading>
      <DocParagraph>{t("docsPage.adaptive.progressiveUnlocking.desc")}</DocParagraph>

      <DocSubheading>
        <Crosshair className="h-4 w-4 text-primary" />
        {t("docsPage.adaptive.focusKey.title")}
      </DocSubheading>
      <DocParagraph>{t("docsPage.adaptive.focusKey.desc")}</DocParagraph>

      <DocSubheading>
        <Star className="h-4 w-4 text-amber-500" />
        {t("docsPage.adaptive.masteryCriteria.title")}
      </DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        {masteryItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <DocSubheading>
        <Activity className="h-4 w-4 text-muted-foreground" />
        {t("docsPage.adaptive.options.title")}
      </DocSubheading>
      <DocParagraph>{t("docsPage.adaptive.options.desc")}</DocParagraph>
    </div>
  )
}

function TimeSection() {
  const { t } = useTranslation()
  return (
    <div>
      <DocHeading>{t("docsPage.time.title")}</DocHeading>

      <DocSubheading>{t("docsPage.time.levelSelection.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.time.levelSelection.desc")}</DocParagraph>

      <DocSubheading>
        <Trophy className="h-4 w-4 text-amber-500" />
        {t("docsPage.time.gradingSystem.title")}
      </DocSubheading>
      <DocParagraph>{t("docsPage.time.gradingSystem.desc")}</DocParagraph>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        <li>{t("docsPage.time.gradingSystem.grades.s")}</li>
        <li>{t("docsPage.time.gradingSystem.grades.a")}</li>
        <li>{t("docsPage.time.gradingSystem.grades.b")}</li>
        <li>{t("docsPage.time.gradingSystem.grades.c")}</li>
      </ul>

      <DocSubheading>{t("docsPage.time.results.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.time.results.desc")}</DocParagraph>
    </div>
  )
}

function QuoteSection() {
  const { t } = useTranslation()
  return (
    <div>
      <DocHeading>{t("docsPage.quote.title")}</DocHeading>
      <DocParagraph>{t("docsPage.quote.p1")}</DocParagraph>
      <DocParagraph>{t("docsPage.quote.p2")}</DocParagraph>
    </div>
  )
}

function MetricsSection() {
  const { t } = useTranslation()
  return (
    <div>
      <DocHeading>{t("docsPage.metrics.title")}</DocHeading>

      <DocSubheading>{t("docsPage.metrics.core.title")}</DocSubheading>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <MetricRow icon={<Gauge className="h-4 w-4" />} label={t("docsPage.metrics.core.wpm.label")} description={t("docsPage.metrics.core.wpm.desc")} />
        <MetricRow icon={<Zap className="h-4 w-4" />} label={t("docsPage.metrics.core.rawWpm.label")} description={t("docsPage.metrics.core.rawWpm.desc")} />
        <MetricRow icon={<Target className="h-4 w-4" />} label={t("docsPage.metrics.core.accuracy.label")} description={t("docsPage.metrics.core.accuracy.desc")} />
        <MetricRow icon={<Music className="h-4 w-4" />} label={t("docsPage.metrics.core.cpm.label")} description={t("docsPage.metrics.core.cpm.desc")} />
        <MetricRow icon={<TrendingUp className="h-4 w-4" />} label={t("docsPage.metrics.core.consistency.label")} description={t("docsPage.metrics.core.consistency.desc")} />
      </div>

      <DocSubheading>{t("docsPage.metrics.adaptive.title")}</DocSubheading>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <MetricRow icon={<Gauge className="h-4 w-4" />} label={t("docsPage.metrics.adaptive.keyAccuracy.label")} description={t("docsPage.metrics.adaptive.keyAccuracy.desc")} />
        <MetricRow icon={<TrendingUp className="h-4 w-4" />} label={t("docsPage.metrics.adaptive.keyScore.label")} description={t("docsPage.metrics.adaptive.keyScore.desc")} />
        <MetricRow icon={<Activity className="h-4 w-4" />} label={t("docsPage.metrics.adaptive.confidence.label")} description={t("docsPage.metrics.adaptive.confidence.desc")} />
        <MetricRow icon={<Zap className="h-4 w-4" />} label={t("docsPage.metrics.adaptive.falseCount.label")} description={t("docsPage.metrics.adaptive.falseCount.desc")} />
      </div>

      <DocSubheading>{t("docsPage.metrics.dashboard.title")}</DocSubheading>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <MetricRow icon={<Flame className="h-4 w-4" />} label={t("docsPage.metrics.dashboard.streak.label")} description={t("docsPage.metrics.dashboard.streak.desc")} />
        <MetricRow icon={<Music className="h-4 w-4" />} label={t("docsPage.metrics.dashboard.melodyIntegrity.label")} description={t("docsPage.metrics.dashboard.melodyIntegrity.desc")} />
        <MetricRow icon={<Hash className="h-4 w-4" />} label={t("docsPage.metrics.dashboard.practiceTime.label")} description={t("docsPage.metrics.dashboard.practiceTime.desc")} />
      </div>
    </div>
  )
}

function MelodySection() {
  const { t } = useTranslation()
  return (
    <div>
      <DocHeading>{t("docsPage.melody.title")}</DocHeading>
      <DocParagraph>{t("docsPage.melody.p1")}</DocParagraph>

      <DocSubheading>{t("docsPage.melody.flowStates.title")}</DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-2 ml-4 mb-4 list-none">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t("docsPage.melody.flowStates.onPace")}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {t("docsPage.melody.flowStates.fallingBehind")}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {t("docsPage.melody.flowStates.paused")}
        </li>
      </ul>

      <DocSubheading>{t("docsPage.melody.integrityScore.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.melody.integrityScore.desc")}</DocParagraph>
    </div>
  )
}

function DashboardSection() {
  const { t } = useTranslation()
  return (
    <div>
      <DocHeading>{t("docsPage.dashboard.title")}</DocHeading>
      <DocParagraph>{t("docsPage.dashboard.p1")}</DocParagraph>

      <DocSubheading>{t("docsPage.dashboard.sections.overviewStats.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.dashboard.sections.overviewStats.desc")}</DocParagraph>

      <DocSubheading>
        <CalendarCheck className="h-4 w-4 text-primary" />
        {t("docsPage.dashboard.sections.dailyGoal.title")}
      </DocSubheading>
      <DocParagraph>{t("docsPage.dashboard.sections.dailyGoal.desc")}</DocParagraph>

      <DocSubheading>
        <Activity className="h-4 w-4 text-emerald-500" />
        {t("docsPage.dashboard.sections.activityHeatmap.title")}
      </DocSubheading>
      <DocParagraph>{t("docsPage.dashboard.sections.activityHeatmap.desc")}</DocParagraph>

      <DocSubheading>{t("docsPage.dashboard.sections.charts.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.dashboard.sections.charts.desc")}</DocParagraph>

      <DocSubheading>{t("docsPage.dashboard.sections.keyboardHeatmap.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.dashboard.sections.keyboardHeatmap.desc")}</DocParagraph>
    </div>
  )
}

function MidiSection() {
  const { t } = useTranslation()
  const controlItems = t("docsPage.midi.controls.items", { returnObjects: true }) as string[]
  return (
    <div>
      <DocHeading>{t("docsPage.midi.title")}</DocHeading>
      <DocParagraph>{t("docsPage.midi.p1")}</DocParagraph>

      <DocSubheading>{t("docsPage.midi.layout.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.midi.layout.desc")}</DocParagraph>

      <DocSubheading>{t("docsPage.midi.controls.title")}</DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        {controlItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <DocSubheading>{t("docsPage.midi.uploading.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.midi.uploading.desc")}</DocParagraph>

      <DocSubheading>{t("docsPage.midi.floatingPlayer.title")}</DocSubheading>
      <DocParagraph>{t("docsPage.midi.floatingPlayer.desc")}</DocParagraph>
    </div>
  )
}

function ShortcutsSection() {
  const { t } = useTranslation()
  const rows = t("docsPage.shortcuts.rows", { returnObjects: true }) as Array<{
    action: string
    shortcut: string
    context: string
  }>
  const tips = t("docsPage.shortcuts.tips.items", { returnObjects: true }) as string[]

  return (
    <div>
      <DocHeading>{t("docsPage.shortcuts.title")}</DocHeading>

      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/20">
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {t("docsPage.shortcuts.columns.action")}
              </th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {t("docsPage.shortcuts.columns.shortcut")}
              </th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {t("docsPage.shortcuts.columns.context")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-foreground">{row.action}</td>
                <td className="px-4 py-3"><Kbd>{row.shortcut}</Kbd></td>
                <td className="px-4 py-3 text-muted-foreground">{row.context}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DocSubheading>{t("docsPage.shortcuts.tips.title")}</DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        {tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}
