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

const sections: { id: DocSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Getting Started", icon: <BookOpen className="h-4 w-4" /> },
  { id: "practice", label: "Practice Modes", icon: <Keyboard className="h-4 w-4" /> },
  { id: "adaptive", label: "Adaptive Mode", icon: <Brain className="h-4 w-4" /> },
  { id: "time", label: "Time Mode", icon: <Clock className="h-4 w-4" /> },
  { id: "quote", label: "Quote Mode", icon: <Quote className="h-4 w-4" /> },
  { id: "metrics", label: "Metrics Glossary", icon: <Gauge className="h-4 w-4" /> },
  { id: "melody", label: "Melody & MIDI", icon: <Music className="h-4 w-4" /> },
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "midi", label: "MIDI Management", icon: <FileAudio className="h-4 w-4" /> },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: <Settings className="h-4 w-4" /> },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("overview")

  return (
    <div className="flex gap-8">
      {/* Sidebar Navigation */}
      <nav className="hidden lg:flex w-56 shrink-0 flex-col gap-1 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 px-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-medium">Docs</span>
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
          <span className="font-serif text-lg font-medium">Documentation</span>
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
        {activeSection === "overview" && <OverviewSection onNavigate={setActiveSection} />}
        {activeSection === "practice" && <PracticeSection onNavigate={setActiveSection} />}
        {activeSection === "adaptive" && <AdaptiveSection />}
        {activeSection === "time" && <TimeSection />}
        {activeSection === "quote" && <QuoteSection />}
        {activeSection === "metrics" && <MetricsSection />}
        {activeSection === "melody" && <MelodySection />}
        {activeSection === "dashboard" && <DashboardSection />}
        {activeSection === "midi" && <MidiSection />}
        {activeSection === "shortcuts" && <ShortcutsSection />}
      </motion.div>

      {/* Mobile content (same but visible) */}
      <motion.div
        key={`mobile-${activeSection}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-w-0 lg:hidden -mt-2"
      >
        {activeSection === "overview" && <OverviewSection onNavigate={setActiveSection} />}
        {activeSection === "practice" && <PracticeSection onNavigate={setActiveSection} />}
        {activeSection === "adaptive" && <AdaptiveSection />}
        {activeSection === "time" && <TimeSection />}
        {activeSection === "quote" && <QuoteSection />}
        {activeSection === "metrics" && <MetricsSection />}
        {activeSection === "melody" && <MelodySection />}
        {activeSection === "dashboard" && <DashboardSection />}
        {activeSection === "midi" && <MidiSection />}
        {activeSection === "shortcuts" && <ShortcutsSection />}
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
  return (
    <div>
      <DocHeading>Welcome to MelodyType</DocHeading>
      <DocParagraph>
        MelodyType is a typing practice application that turns your keyboard training into a musical experience.
        Every keystroke triggers MIDI notes, so your practice sessions become melodies. The faster and more accurately
        you type, the smoother the music flows.
      </DocParagraph>
      <DocParagraph>
        All your data is stored locally in your browser using IndexedDB — no accounts, no cloud uploads, complete privacy.
        You can export and import your data at any time from the Settings page.
      </DocParagraph>

      <DocSubheading>Quick Start</DocSubheading>
      <div className="space-y-2 mb-6">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
          <span>Choose a practice mode — <strong className="text-foreground">Adaptive</strong> is recommended for beginners as it learns your weaknesses</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
          <span>Start typing the displayed text — the MIDI melody plays along with your keystrokes</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
          <span>Review your results and track progress in the Dashboard</span>
        </div>
      </div>

      <DocSubheading>Explore Features</DocSubheading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DocCard icon={<Keyboard className="h-4 w-4" />} title="Practice Modes" description="Three distinct modes: Adaptive, Time, and Quote" onClick={() => onNavigate("practice")} />
        <DocCard icon={<Gauge className="h-4 w-4" />} title="Metrics Glossary" description="Understand WPM, accuracy, integrity, and more" onClick={() => onNavigate("metrics")} />
        <DocCard icon={<Music className="h-4 w-4" />} title="Melody & MIDI" description="How the musical integration works" onClick={() => onNavigate("melody")} />
        <DocCard icon={<BarChart3 className="h-4 w-4" />} title="Dashboard" description="Charts, heatmaps, and progress tracking" onClick={() => onNavigate("dashboard")} />
      </div>
    </div>
  )
}

function PracticeSection({ onNavigate }: { onNavigate: (s: DocSection) => void }) {
  return (
    <div>
      <DocHeading>Practice Modes</DocHeading>
      <DocParagraph>
        MelodyType offers three practice modes, each designed for different learning goals.
        Switch between modes using the tabs at the top of the Practice page.
      </DocParagraph>

      <div className="grid gap-3 mt-4">
        <DocCard
          icon={<Brain className="h-4 w-4" />}
          title="Adaptive Mode"
          description="AI-driven practice that learns your weak keys and generates text targeting them. Keys unlock progressively as you improve — the system focuses on what you need most."
          onClick={() => onNavigate("adaptive")}
        />
        <DocCard
          icon={<Clock className="h-4 w-4" />}
          title="Time Mode"
          description="Structured difficulty levels with time limits. Race against the clock and earn grades from F to S based on your speed and accuracy. Great for benchmarking."
          onClick={() => onNavigate("time")}
        />
        <DocCard
          icon={<Quote className="h-4 w-4" />}
          title="Quote Mode"
          description="Practice typing famous quotes and real passages. A more natural and relaxed experience that builds real-world typing patterns."
          onClick={() => onNavigate("quote")}
        />
      </div>

      <DocSubheading>Common Controls</DocSubheading>
      <DocParagraph>
        During any practice session, you can press <Kbd>Tab</Kbd> to restart the current round,
        or use the Restart button below the typing area. The virtual keyboard at the bottom
        shows which key to press next and highlights your key confidence levels in Adaptive mode.
        Toggle it with the &quot;Show/Hide Keyboard&quot; button.
      </DocParagraph>
    </div>
  )
}

function AdaptiveSection() {
  return (
    <div>
      <DocHeading>Adaptive Mode</DocHeading>
      <DocParagraph>
        Adaptive mode is MelodyType&apos;s core learning system. It tracks your performance on every key
        and dynamically generates practice text that focuses on the keys you need to improve.
      </DocParagraph>

      <DocSubheading>
        <Lock className="h-4 w-4 text-muted-foreground" /> Progressive Key Unlocking
      </DocSubheading>
      <DocParagraph>
        You start with a small set of unlocked keys (the most common letters). As you demonstrate mastery —
        meeting the target speed and accuracy thresholds — new keys unlock automatically. This prevents
        overwhelm and ensures you build a solid foundation.
      </DocParagraph>

      <DocSubheading>
        <Crosshair className="h-4 w-4 text-primary" /> Focus Key
      </DocSubheading>
      <DocParagraph>
        The system identifies your weakest unlocked key as the &quot;Focus Key&quot; and generates text with
        higher frequency of that letter. The focus key is highlighted in the Key Progress panel and on the
        virtual keyboard with a ring indicator.
      </DocParagraph>

      <DocSubheading>
        <Star className="h-4 w-4 text-amber-500" /> Key Mastery Criteria
      </DocSubheading>
      <DocParagraph>
        Each key must meet four criteria before the next key unlocks:
      </DocParagraph>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        <li><strong className="text-foreground">Target CPM</strong> — Reach the configured Characters Per Minute speed (default 175 CPM / 35 WPM)</li>
        <li><strong className="text-foreground">Minimum hits</strong> — Accumulate enough practice samples (minimum 15 hits)</li>
        <li><strong className="text-foreground">Recent accuracy</strong> — Maintain ≥85% accuracy in recent attempts</li>
        <li><strong className="text-foreground">Lifetime accuracy</strong> — Maintain ≥75% accuracy across all attempts</li>
      </ul>

      <DocSubheading>
        <Activity className="h-4 w-4 text-muted-foreground" /> Options
      </DocSubheading>
      <DocParagraph>
        Click &quot;Options&quot; in the Key Progress panel to adjust the target CPM (speed threshold for mastery)
        and toggle &quot;Require Current Mastery&quot; which ensures previously mastered keys still meet the threshold
        before new keys unlock.
      </DocParagraph>
      <DocParagraph>
        You can also manually unlock any locked key by clicking on it in the key pill row — this skips
        the normal progression gate and immediately adds it to practice.
      </DocParagraph>
    </div>
  )
}

function TimeSection() {
  return (
    <div>
      <DocHeading>Time Mode</DocHeading>
      <DocParagraph>
        Time mode provides structured difficulty levels where you race against a countdown timer.
        Each level has a target WPM and accuracy requirement, and you earn a letter grade based on performance.
      </DocParagraph>

      <DocSubheading>Level Selection</DocSubheading>
      <DocParagraph>
        The level browser organizes levels into tiers (Beginner, Intermediate, Advanced, Expert).
        Each level card shows its difficulty, time limit, whether it includes punctuation or numbers,
        and your best grade if you&apos;ve played it before. Click any level to start.
      </DocParagraph>

      <DocSubheading>
        <Trophy className="h-4 w-4 text-amber-500" /> Grading System
      </DocSubheading>
      <DocParagraph>
        After each run, you receive a grade from F to S based on combined WPM and accuracy thresholds
        specific to each level. Grades are: <strong className="text-foreground">S</strong> (outstanding),{" "}
        <strong className="text-foreground">A</strong> (excellent),{" "}
        <strong className="text-foreground">B</strong> (good),{" "}
        <strong className="text-foreground">C</strong> (decent),{" "}
        <strong className="text-foreground">D</strong> (needs work),{" "}
        <strong className="text-foreground">F</strong> (keep practicing).
      </DocParagraph>

      <DocSubheading>Results & Progress</DocSubheading>
      <DocParagraph>
        The results screen shows your grade, a WPM-over-time chart, detailed stats, and your level record
        including best WPM, best grade, and number of attempts. Personal bests are celebrated with a
        &quot;New PB!&quot; badge. You can see what&apos;s needed for the next grade tier.
      </DocParagraph>
    </div>
  )
}

function QuoteSection() {
  return (
    <div>
      <DocHeading>Quote Mode</DocHeading>
      <DocParagraph>
        Quote mode presents famous quotes and passages for a more natural typing experience.
        There&apos;s no time pressure — just type the displayed text accurately and build real-world
        typing muscle memory with varied vocabulary.
      </DocParagraph>
      <DocParagraph>
        After completing each quote, you see your results including WPM, accuracy, and melody integrity.
        The quote author is displayed below the text area for attribution. Press <Kbd>Tab</Kbd> or
        click &quot;Next Lesson&quot; to get a new quote.
      </DocParagraph>
    </div>
  )
}

function MetricsSection() {
  return (
    <div>
      <DocHeading>Metrics Glossary</DocHeading>
      <DocParagraph>
        Understanding your metrics is key to improving. Here&apos;s what each measurement means:
      </DocParagraph>

      <DocSubheading>Core Metrics</DocSubheading>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <MetricRow icon={<Gauge className="h-4 w-4" />} label="WPM (Words Per Minute)" description="Your net typing speed. Calculated as (correct characters ÷ 5) ÷ elapsed minutes. This is the standard measure — a 'word' is defined as 5 characters including spaces." />
        <MetricRow icon={<Zap className="h-4 w-4" />} label="Raw WPM" description="Your total typing speed including errors, before any accuracy penalty. The gap between Raw WPM and WPM shows how much errors are costing you." />
        <MetricRow icon={<Target className="h-4 w-4" />} label="Accuracy" description="Percentage of characters typed correctly. Calculated as correct characters ÷ total characters typed. Aim for 95%+ before pushing for higher speed." />
        <MetricRow icon={<Music className="h-4 w-4" />} label="Melody Integrity" description="How well your typing rhythm maintains the musical flow. Consistent, steady typing produces higher integrity. Pausing, hesitating, or making bursts of errors drains it." />
        <MetricRow icon={<TrendingUp className="h-4 w-4" />} label="Consistency" description="How stable your typing speed is throughout the session. Lower variance between your fastest and slowest moments means higher consistency." />
      </div>

      <DocSubheading>Adaptive Mode Metrics</DocSubheading>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <MetricRow icon={<Gauge className="h-4 w-4" />} label="Speed (Adaptive)" description="Your typing speed for the current adaptive round, in WPM. Tracks your real-time performance on the generated text." />
        <MetricRow icon={<TrendingUp className="h-4 w-4" />} label="Score" description="A combined performance metric factoring both speed and accuracy. Higher scores mean better overall performance." />
        <MetricRow icon={<Activity className="h-4 w-4" />} label="Target CPM" description="Target speed in Characters Per Minute that each key must reach for mastery. Configurable in Options — default is 175 CPM (~35 WPM)." />
        <MetricRow icon={<Keyboard className="h-4 w-4" />} label="Clicks" description="Total keystrokes recorded in the current adaptive round, including both correct and incorrect presses." />
        <MetricRow icon={<Zap className="h-4 w-4" />} label="CPS (Characters Per Second)" description="Your raw input speed measured in characters per second. CPS × 60 ÷ 5 ≈ WPM." />
        <MetricRow icon={<Target className="h-4 w-4" />} label="Confidence" description="Per-key confidence level (0–100%) representing how close that key is to meeting all mastery criteria. 100% means the key is fully mastered." />
      </div>

      <DocSubheading>Dashboard Key Stats</DocSubheading>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <MetricRow icon={<Target className="h-4 w-4" />} label="Success" description="Times a key was correctly pressed when it was the expected target character in the text." />
        <MetricRow icon={<Zap className="h-4 w-4" />} label="Mis-presses" description="Times a key was physically pressed when a different key was expected — you hit the wrong key." />
        <MetricRow icon={<Flame className="h-4 w-4" />} label="False" description="Number of times you failed to press the expected key correctly on the first attempt. Indicates difficulty with that key position." />
        <MetricRow icon={<Target className="h-4 w-4" />} label="Key Accuracy" description="Ratio of successful presses to total target occurrences: Success ÷ (Success + False). Shows how reliably you hit this key." />
        <MetricRow icon={<TrendingUp className="h-4 w-4" />} label="Learning Rate" description="Trend direction comparing your recent accuracy to earlier accuracy for this key. Positive means improving, negative means regressing." />
        <MetricRow icon={<Hash className="h-4 w-4" />} label="False Rate" description="On the keyboard heatmap: the ratio of false presses to total target occurrences. Higher rates appear redder on the heatmap." />
      </div>
    </div>
  )
}

function MelodySection() {
  return (
    <div>
      <DocHeading>Melody &amp; Musical Flow</DocHeading>
      <DocParagraph>
        MelodyType&apos;s unique feature is its MIDI integration. Each correct keystroke advances through a
        musical sequence, turning your practice into a melody. The better you type, the better the music sounds.
      </DocParagraph>

      <DocSubheading>
        <Music className="h-4 w-4 text-primary" /> How It Works
      </DocSubheading>
      <DocParagraph>
        A MIDI file (preset or uploaded) is broken into &quot;frames&quot; — groups of notes. Each correct
        keystroke triggers the next frame. If you type steadily at a good pace, the melody flows smoothly.
        If you pause, slow down, or make errors, the flow degrades.
      </DocParagraph>

      <DocSubheading>Flow States</DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-2 ml-4 mb-4 list-none">
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> <strong className="text-foreground">Flowing (On Pace)</strong> — You&apos;re typing steadily; melody plays smoothly</li>
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> <strong className="text-foreground">Fading (Falling Behind)</strong> — Your pace has slowed; melody is losing momentum</li>
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> <strong className="text-foreground">Stalled (Paused)</strong> — You&apos;ve stopped or slowed significantly; melody has paused</li>
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted" /> <strong className="text-foreground">Idle (Ready)</strong> — Waiting for you to start typing</li>
      </ul>

      <DocSubheading>Melody Integrity Score</DocSubheading>
      <DocParagraph>
        Melody Integrity (shown as a percentage) measures how much time you spent in the &quot;Flowing&quot; state
        versus fading or stalled. A 100% integrity means you maintained perfect flow throughout the entire session.
        This metric encourages consistent, rhythmic typing rather than burst-and-pause patterns.
      </DocParagraph>
    </div>
  )
}

function DashboardSection() {
  return (
    <div>
      <DocHeading>Dashboard</DocHeading>
      <DocParagraph>
        The Dashboard aggregates all your practice data into charts, heatmaps, and statistics.
        Use the mode tabs (Adaptive / Time / Quote) to filter data by practice mode.
      </DocParagraph>

      <DocSubheading>Overview Stats</DocSubheading>
      <DocParagraph>
        The top row shows seven key statistics: Average WPM, Best WPM, Accuracy, Melody Integrity,
        total Sessions, total Practice time, and your current Streak (consecutive days practiced).
        Hover any card for a detailed description.
      </DocParagraph>

      <DocSubheading>
        <CalendarCheck className="h-4 w-4 text-primary" /> Daily Goal
      </DocSubheading>
      <DocParagraph>
        The circular ring on the right tracks your daily practice time goal. Drag the thumb around
        the ring to set your target (in minutes). The ring fills as you practice.
        Stats below show today&apos;s progress percentage, session count, best WPM, and average accuracy.
      </DocParagraph>

      <DocSubheading>
        <Activity className="h-4 w-4 text-emerald-500" /> Activity Heatmap
      </DocSubheading>
      <DocParagraph>
        The GitHub-style heatmap shows your practice activity over the past weeks. Darker green squares
        mean more sessions on that day. Hover any square for details.
      </DocParagraph>

      <DocSubheading>Charts</DocSubheading>
      <DocParagraph>
        The Speed Progress and Accuracy Trend charts show your metrics over time. Use the time range
        selector (Recent / Day / Week / Month) to zoom in or out. The &quot;Recent&quot; view shows
        individual sessions; other views aggregate by time period.
      </DocParagraph>

      <DocSubheading>Keyboard Heatmap</DocSubheading>
      <DocParagraph>
        The interactive keyboard visualization offers three views:
      </DocParagraph>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        <li><strong className="text-foreground">False Rate</strong> — Shows which keys you struggle with most. Red = high error rate, green = low</li>
        <li><strong className="text-foreground">Frequency</strong> — Shows which keys you press most often. Darker = more presses</li>
        <li><strong className="text-foreground">Transitions</strong> (Adaptive only) — Shows bigram accuracy. Click a key to see arc visualizations of transition success rates between key pairs</li>
      </ul>
      <DocParagraph>
        Click any letter key on the heatmap to see its detailed stats panel below, including per-session
        accuracy chart, press counts, and learning trend.
      </DocParagraph>
    </div>
  )
}

function MidiSection() {
  return (
    <div>
      <DocHeading>MIDI Management</DocHeading>
      <DocParagraph>
        The MIDI page lets you manage the musical content that plays while you type. You can choose from
        built-in presets or upload your own .mid files.
      </DocParagraph>

      <DocSubheading>Layout</DocSubheading>
      <DocParagraph>
        The page is divided into three columns: Presets (built-in melodies), Your Files (uploaded MIDI files),
        and Playlist (your custom play order). On mobile, these stack vertically.
      </DocParagraph>

      <DocSubheading>Controls</DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        <li><strong className="text-foreground">Enable toggle</strong> — Turn MIDI audio on or off globally</li>
        <li><strong className="text-foreground">Instrument</strong> — Choose between Piano, Strings, Synth, Music Box, and Bell sounds</li>
        <li><strong className="text-foreground">Volume</strong> — Adjust playback volume (-30 dB to 0 dB)</li>
        <li><strong className="text-foreground">Loop mode</strong> — Loop (repeat current), Once (play once), Sequential (play in order), Random (shuffle)</li>
        <li><strong className="text-foreground">Test button</strong> — Preview the next frame from the selected melody</li>
      </ul>

      <DocSubheading>Uploading Files</DocSubheading>
      <DocParagraph>
        Click &quot;Upload&quot; or drag a .mid file into the Your Files area. You can edit the name and
        description after upload. Files are stored locally in your browser&apos;s IndexedDB.
        Use the + button on any preset or file to add it to your playlist.
      </DocParagraph>

      <DocSubheading>Floating Player</DocSubheading>
      <DocParagraph>
        When MIDI is enabled and you&apos;re not on the MIDI page, a floating player appears in the bottom-right
        corner. It shows the currently playing track, volume control, loop mode toggle, and a next-track button.
        Expand it to see and switch between all available tracks.
      </DocParagraph>
    </div>
  )
}

function ShortcutsSection() {
  return (
    <div>
      <DocHeading>Keyboard Shortcuts</DocHeading>
      <DocParagraph>
        Use these shortcuts during practice sessions:
      </DocParagraph>

      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/20">
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Action</th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Shortcut</th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            <tr>
              <td className="px-4 py-3 text-foreground">Restart current session</td>
              <td className="px-4 py-3"><Kbd>Tab</Kbd></td>
              <td className="px-4 py-3 text-muted-foreground">During practice</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-foreground">Back to level selection</td>
              <td className="px-4 py-3"><Kbd>Esc</Kbd></td>
              <td className="px-4 py-3 text-muted-foreground">Time mode only</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-foreground">Reset adaptive session</td>
              <td className="px-4 py-3"><Kbd>Esc</Kbd></td>
              <td className="px-4 py-3 text-muted-foreground">Adaptive mode</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-foreground">Type next character</td>
              <td className="px-4 py-3 text-muted-foreground">Any key</td>
              <td className="px-4 py-3 text-muted-foreground">During practice</td>
            </tr>
          </tbody>
        </table>
      </div>

      <DocSubheading>Tips</DocSubheading>
      <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 mb-4 list-disc">
        <li>Focus on accuracy first, then speed — errors cost more than slow typing</li>
        <li>In Adaptive mode, don&apos;t rush to unlock new keys — master the current set first</li>
        <li>Use the virtual keyboard as a visual guide but try not to look at your physical keyboard</li>
        <li>The melody flow meter rewards consistent pacing — avoid burst-and-pause typing</li>
        <li>Review your Dashboard regularly to identify weak keys and track progress</li>
        <li>Try different MIDI presets to keep practice sessions fresh and enjoyable</li>
      </ul>
    </div>
  )
}
