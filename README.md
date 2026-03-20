# MelodyType

**Where typing meets music** — A privacy-focused typing practice application that transforms every keystroke into a musical melody.

MelodyType is a fully client-side web application with MIDI-driven audio feedback and comprehensive progress tracking. All data stays in your browser — no accounts, no cloud, complete privacy.

---

## Table of Contents

- [Features](#features)
  - [Musical Typing](#musical-typing)
  - [Adaptive Learning](#adaptive-learning)
  - [Practice Modes](#practice-modes)
  - [Dashboard](#dashboard)
  - [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Data & Privacy](#data--privacy)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

### Musical Typing

Every keystroke plays a note. Practice becomes performance.

- **5 Synthesizer Instruments** — Piano, Strings, Synth, Music Box, Bell
- **Custom MIDI Files** — Upload your own melodies for personalized practice
- **Built-in Presets** — Twinkle Twinkle Little Star, Ode to Joy, Canon in D, Für Elise, C Major Scale, Chromatic Run
- **Playback Modes** — Loop, once, sequential, or random
- **Playlist Support** — Build a custom playlist from presets and uploaded files with drag-to-reorder
- **Melody Flow Meter** — Real-time visual feedback on your typing rhythm; steady typing keeps the melody flowing
- **Floating Player** — Minimizable floating MIDI player visible on all pages (except MIDI management)

### Adaptive Learning

An intelligent practice system that adapts to your skill level, inspired by [keybr.com](https://www.keybr.com).

**Progressive Key Unlocking**

You start with the 6 most common English letters. As you master each key, new letters unlock in frequency order:

```
e → n → i → t → r → l → s → a → u → o → d → y → c → h → g → m → p → b → k → v → w → f → z → x → q → j
```

**Smart Text Generation**

The system generates practice text weighted toward your weakest keys. It uses an order-4 Markov chain trained on English phonetic data, producing natural-sounding pseudo-words while prioritizing real common vocabulary. Your trouble spots get more attention without feeling repetitive.

**Per-Key Progress Tracking**

Each key has its own learning curve. The system tracks your EWMA speed (exponentially weighted moving average) and accuracy over time, then uses polynomial regression to predict how many sessions until mastery.

**Mastery Criteria**

A key is considered mastered when:
- EWMA speed reaches your target CPM (default 175, configurable 75–750)
- At least 35 correct keystrokes recorded
- Recent accuracy ≥ 90% (decay-weighted)
- Lifetime accuracy ≥ 88%

**Continuous Sessions**

In adaptive mode, rounds flow seamlessly. Complete a round and the next text appears instantly. Stats update in the background, and new key unlocks show as floating toasts. Press `Esc` to pause and review your progress.

**Settings**

- **Target Speed** — Adjust your mastery threshold (75–750 CPM) with preset quick-picks
- **Strict Current Mastery** — Require current speed (not just historical best) to count toward unlock eligibility. Helps revisit skills that have regressed.
- **Manual Unlock** — Click any locked key pill to unlock it early, skipping the normal progression gate

### Practice Modes

| Mode | Description |
|------|-------------|
| **Adaptive** | Continuous sessions with progressive key unlocking and smart text generation |
| **Time** | Structured level system with 4 tiers, letter grades (F–S), and progress tracking |
| **Quote** | Type famous quotes for variety and natural language practice |

**Time Mode Details**

Time mode features hand-crafted levels across 4 tiers — Beginner, Intermediate, Advanced, and Expert. Each level defines a specific duration, word pool difficulty, and optional punctuation / number challenges.

Earn letter grades per level:

| Grade | Description |
|-------|-------------|
| S | Outstanding — exceeds all targets |
| A | Excellent |
| B | Good |
| C | Decent |
| D | Needs work |
| F | Keep practicing |

Grades are determined by combined WPM and accuracy thresholds specific to each level. The results screen shows a WPM-over-time chart, detailed stats, and requirements for the next grade.

### Dashboard

Track your progress over time:

- **Stats Overview** — 7 hero metric cards (Avg WPM, Best WPM, Accuracy, Melody Integrity, Sessions, Practice Time, Streak) with hover tooltips
- **Activity Heatmap** — GitHub-style heatmap showing daily practice activity
- **Daily Goal Ring** — Interactive draggable ring to set and track your daily practice time target
- **WPM & Accuracy Charts** — Aggregated trends with time range selector (Recent / Day / Week / Month)
- **Keyboard Heatmap** — Three views: False Rate (error distribution), Frequency (key usage), and Transitions (bigram accuracy with arc visualizations)
- **Key Detail Panel** — Per-key statistics: success count, mis-presses, false count, key accuracy, per-session accuracy chart, and learning trend
- **Adaptive Progress Card** — Unlock status, per-key confidence map, weakest/strongest keys, session averages
- **Session History** — Recent sessions with mode, WPM, accuracy, and duration
- **Mode Tabs** — Filter all dashboard data by practice mode (Adaptive / Time / Quote)

### Documentation

The built-in Docs page (`/docs`) provides comprehensive guidance:

- Getting Started guide
- Detailed explanations of all three practice modes
- Full Metrics Glossary (every metric explained)
- Melody & MIDI integration guide
- Dashboard usage guide
- MIDI management walkthrough
- Keyboard shortcuts reference

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | [React](https://react.dev) | 19.x |
| Language | [TypeScript](https://www.typescriptlang.org) | 5.9.x |
| Build Tool | [Vite](https://vite.dev) | 8.x |
| Styling | [Tailwind CSS](https://tailwindcss.com) | 4.x |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) | — |
| Local Storage | [Dexie.js](https://dexie.org) (IndexedDB) | 4.x |
| Audio | [Tone.js](https://tonejs.github.io) | 15.x |
| MIDI Parsing | [@tonejs/midi](https://github.com/Tonejs/Midi) | 2.x |
| Charts | [Recharts](https://recharts.org) | 3.x |
| Animation | [Framer Motion](https://www.framer.com/motion/) | 12.x |
| Routing | [React Router](https://reactrouter.com) | 7.x |
| Icons | [Lucide React](https://lucide.dev) | 0.577.x |
| Testing | [Vitest](https://vitest.dev) | 4.x |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io) (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/fl0w1nd/MelodyType.git
cd MelodyType

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linting
pnpm lint

# Run tests
npx vitest run
```

The development server runs at `http://localhost:5173` by default.

> **Note**: No `.env` file or external API keys are required. The application is entirely self-contained.

---

## Project Structure

```
src/
├── engine/                         # Core business logic
│   ├── typing/                     # Typing engine
│   │   ├── math/                   # Mathematical utilities (vector, polynomial, regression, SLE)
│   │   ├── markov/                 # Order-4 Markov chain (model + English phonetic data)
│   │   ├── adaptiveEngine.ts       # Unlock logic, confidence, weights, bigram scoring
│   │   ├── adaptiveConstants.ts    # Tunable thresholds and presets
│   │   ├── accuracyMetrics.ts      # Accuracy computation for stored sessions
│   │   ├── learningRate.ts         # Polynomial regression prediction
│   │   ├── pseudoWords.ts          # Adaptive text generation
│   │   ├── useTypingEngine.ts      # Core typing state machine hook
│   │   ├── wordLists.ts            # Common words by difficulty
│   │   ├── quoteLoader.ts          # Quote fetching from public/data/
│   │   ├── timeLevels.ts           # Time mode levels & grade system
│   │   ├── markovData.ts           # Markov model data loader
│   │   └── types.ts                # Shared type definitions
│   ├── midi/                       # MIDI audio system
│   │   ├── MidiContext.tsx          # React context for MIDI state
│   │   ├── synthManager.ts         # Tone.js synth lifecycle
│   │   ├── melodyScheduler.ts      # Frame scheduling & flow state
│   │   ├── melodyIntegrity.ts      # Integrity score calculation
│   │   ├── midiParser.ts           # MIDI file → frame conversion
│   │   ├── useMidiTrigger.ts       # Hook to trigger MIDI frames
│   │   ├── presets.ts              # Built-in melody presets
│   │   └── types.ts                # MIDI type definitions
│   └── practice/                   # Practice session orchestration
│       ├── usePracticeSessionController.ts  # Main session controller hook
│       ├── practicePersistence.ts   # Session saving & goal tracking
│       └── sessionQueries.ts        # Dexie queries for session data
├── components/                     # React components
│   ├── practice/                   # Practice interface
│   │   ├── TextDisplay.tsx         # Text rendering with cursor
│   │   ├── VirtualKeyboard.tsx     # On-screen keyboard
│   │   ├── MetricsBar.tsx          # WPM, accuracy, time, raw, integrity
│   │   ├── FlowMeter.tsx           # Melody flow visualization
│   │   ├── ResultsPanel.tsx        # Session results with charts
│   │   ├── ModeSelector.tsx        # Practice mode selection with tooltips
│   │   ├── TimeLevelSelect.tsx     # Time mode level browser
│   │   ├── KeyProgressPanel.tsx    # Adaptive key progress & settings
│   │   └── NoteParticles.tsx       # Musical note particle effects
│   ├── dashboard/                  # Dashboard components
│   │   ├── StatsOverview.tsx       # 7 hero metric cards
│   │   ├── WpmChart.tsx            # Speed & accuracy charts
│   │   ├── KeyboardHeatmap.tsx     # Interactive keyboard heatmap
│   │   ├── SessionHistory.tsx      # Recent session list
│   │   ├── DailyGoalRing.tsx       # Interactive daily goal ring
│   │   ├── KeyDetailPanel.tsx      # Per-key detail stats
│   │   ├── AdaptiveProgressCard.tsx # Adaptive mode progress
│   │   ├── ActivityHeatmap.tsx     # GitHub-style activity heatmap
│   │   ├── TimeRangeSelector.tsx   # Time range filter
│   │   └── dashboardUtils.ts      # Filtering & aggregation helpers
│   ├── layout/                     # App shell
│   │   ├── AppLayout.tsx           # Header, nav, footer, page transitions
│   │   └── BackgroundDecor.tsx     # Ambient background effects
│   ├── MidiFloatingPlayer.tsx      # Floating MIDI player
│   └── ui/                         # shadcn/ui primitives
├── pages/                          # Page components (lazy-loaded)
│   ├── PracticePage.tsx            # Main practice interface
│   ├── DashboardPage.tsx           # Statistics & progress
│   ├── MidiPage.tsx                # MIDI file management
│   ├── DocsPage.tsx                # Documentation & usage guide
│   └── SettingsPage.tsx            # Data management & about
├── lib/                            # Utility libraries
│   ├── db.ts                       # Dexie.js schema & import/export
│   ├── settings.ts                 # App settings (IndexedDB-backed)
│   ├── utils.ts                    # cn() helper
│   └── date.ts                     # Date formatting utilities
├── App.tsx                         # Router & providers
├── main.tsx                        # Application entry point
└── index.css                       # Global styles (Tailwind v4)
```

---

## Data & Privacy

- **Local-First** — All data is stored in your browser's IndexedDB
- **No Tracking** — No analytics, no telemetry, no external requests (except Google Fonts)
- **Portable** — Export a full JSON backup from Settings and import on another device
- **Privacy** — Your typing data never leaves your browser

---

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [keybr.com](https://www.keybr.com) — Inspiration for the adaptive learning algorithm
