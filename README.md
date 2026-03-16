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
  - [Settings](#settings)
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
- **Playback Modes** — Loop, once, or random

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

Each key has its own learning curve. The system tracks your EWMA speed (exponentially weighted moving average) and accuracy over time, then uses polynomial regression to predict how many sessions until mastery. When you see a prediction, it means the model has enough data to be confident (R² ≥ 0.5).

**Mastery Criteria**

A key is considered mastered when:
- EWMA speed reaches your target CPM (default 175, configurable 75–750)
- At least 10 correct keystrokes recorded
- Recent accuracy ≥ 92% (decay-weighted)
- Lifetime accuracy ≥ 85%

**Continuous Sessions**

In adaptive mode, rounds flow seamlessly. Complete a round and the next text appears instantly. Stats update in the background, and new key unlocks show as floating toasts. Press `Esc` to pause and review your progress.

**Weight System**

Text generation uses a 4-tier confidence-based weighting:

| Confidence | Weight |
|------------|--------|
| Weak (< 0.4) | 4.0× |
| Learning (0.4–0.7) | 2.5× |
| Good (0.7–1.0) | 1.5× |
| Mastered (≥ 1.0) | 1.0× |

Your focus key (the weakest unlocked) gets an additional 2× boost.

**Settings**

- **Target Speed** — Adjust your mastery threshold (75–750 CPM)
- **Recover Keys** — Require current speed (not just historical best) to count toward unlock eligibility. Helps revisit skills that have regressed.
- **Forced Unlock** — Manually expand available letters via slider (0–100%) without waiting for auto-unlock. Forced keys join practice but don't block progress.

### Practice Modes

| Mode | Description |
|------|-------------|
| **Adaptive** | Continuous sessions with progressive key unlocking and smart text generation |
| **Time** | Structured level system with 4 tiers, star ratings, and progress tracking |
| **Quote** | Type famous quotes for variety |

**Time Mode Details**

Time mode features 20 hand-crafted levels across 4 tiers — Beginner, Intermediate, Advanced, and Expert. Each level defines a specific duration, word pool difficulty, and optional punctuation / number challenges.

Earn up to 3 stars per level:

| Stars | Requirement |
|-------|-------------|
| ★☆☆ | Complete an attempt |
| ★★☆ | WPM ≥ 30 and Accuracy ≥ 80% |
| ★★★ | WPM ≥ 60 and Accuracy ≥ 95% |

Stars are awarded based on single-session performance — your best WPM and accuracy must come from the same attempt. Session results also show a letter grade (S / A / B / C / D / F) based on a combined WPM × Accuracy score.

### Dashboard

Track your progress over time:

- **Stats Overview** — Total sessions, average WPM, best WPM, accuracy
- **WPM & Accuracy Charts** — Session-by-session trends
- **Keyboard Heatmap** — Visual distribution of errors and speed across all keys
- **Key Detail Panel** — Per-key statistics: hit count, error rate, average speed
- **Adaptive Progress Card** — Unlock status, per-key confidence levels, learning rate predictions
- **Daily Goal Ring** — Configurable daily practice target with visual progress

### Settings

| Category | Options |
|----------|---------|
| Display | Virtual keyboard toggle |
| Goals | Daily practice target (5–120 minutes) |
| Adaptive | Target speed, recover keys, forced unlock |
| Audio | Instrument, volume, playback mode |
| Data | Export/import JSON backup, reset statistics |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | [React](https://react.dev) | 19.x |
| Language | [TypeScript](https://www.typescriptlang.org) | 5.9.x |
| Build Tool | [Vite](https://vite.dev) | 8.x |
| Styling | [Tailwind CSS](https://tailwindcss.com) | 4.x |
| UI Components | [shadcn/ui](https://ui.shadcn.com) | 4.x |
| Local Storage | [Dexie.js](https://dexie.org) (IndexedDB) | 4.x |
| Audio | [Tone.js](https://tonejs.github.io) | 15.x |
| MIDI Parsing | [@tonejs/midi](https://github.com/Tonejs/Midi) | 2.x |
| Charts | [Recharts](https://recharts.org) | 3.x |
| Animation | [Framer Motion](https://www.framer.com/motion/) | 12.x |
| Routing | [React Router](https://reactrouter.com) | 7.x |
| Icons | [Lucide React](https://lucide.dev) | 0.577.x |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io) (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/melody-type.git
cd melody-type

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
```

The development server runs at `http://localhost:5173` by default.

> **Note**: No `.env` file or external API keys are required. The application is entirely self-contained.

---

## Project Structure

```
src/
├── engine/                      # Core business logic
│   ├── typing/                  # Typing engine
│   │   ├── math/                # Mathematical utilities
│   │   │   ├── vector.ts        # Vector operations
│   │   │   ├── polynomial.ts    # Polynomial functions
│   │   │   ├── regression.ts    # Linear regression
│   │   │   └── sle.ts           # System of linear equations
│   │   ├── markov/              # Markov chain implementation
│   │   │   ├── markovModel.ts   # Order-4 Markov model
│   │   │   └── en-model.json    # English phonetic data (~157KB)
│   │   ├── adaptiveEngine.ts    # Unlock logic, confidence, weights
│   │   ├── learningRate.ts      # Polynomial regression prediction
│   │   ├── pseudoWords.ts       # Adaptive text generation
│   │   ├── useTypingEngine.ts   # Core typing state machine hook
│   │   ├── wordLists.ts         # Common words, quotes
│   │   ├── timeLevels.ts       # Time mode levels & star ratings
│   │   └── types.ts             # Shared type definitions
│   ├── midi/                    # MIDI audio system
│   │   ├── MidiContext.tsx      # React context for MIDI state
│   │   ├── synthManager.ts      # Tone.js synth lifecycle
│   │   ├── midiParser.ts        # MIDI file → frame conversion
│   │   ├── presets.ts           # Built-in melody presets
│   │   └── types.ts             # MIDI type definitions
│   └── stats/                   # Statistics utilities
├── components/                  # React components
│   ├── practice/                # Practice interface
│   │   ├── TextDisplay.tsx      # Text rendering with cursor
│   │   ├── VirtualKeyboard.tsx  # On-screen keyboard
│   │   ├── MetricsBar.tsx       # WPM, accuracy display
│   │   ├── ResultsPanel.tsx     # Session results
│   │   ├── ModeSelector.tsx     # Practice mode selection
│   │   ├── TimeLevelSelect.tsx  # Time mode level selection
│   │   ├── KeyProgressPanel.tsx # Adaptive key progress
│   │   └── NoteParticles.tsx    # Musical note animations
│   ├── dashboard/               # Dashboard components
│   ├── layout/                  # App shell, navigation
│   └── ui/                      # shadcn/ui primitives
├── pages/                       # Page components
│   ├── PracticePage.tsx         # Main practice interface
│   ├── DashboardPage.tsx        # Statistics & progress
│   ├── MidiPage.tsx             # MIDI file management
│   └── SettingsPage.tsx         # App configuration
├── lib/                         # Utility libraries
│   ├── db.ts                    # Dexie.js schema & operations
│   └── utils.ts                 # Utility functions
├── App.tsx                      # Router & providers
├── main.tsx                     # Application entry point
└── index.css                    # Global styles (Tailwind)
```

---

## Data & Privacy

- **Local-First** — All data is stored in your browser's IndexedDB
- **No Tracking** — No analytics, no telemetry, no external requests
- **Portable** — Export a full JSON backup from Settings and import on another device
- **Privacy** — Your typing data never leaves your browser

---

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [keybr.com](https://www.keybr.com) — Inspiration for the adaptive learning algorithm