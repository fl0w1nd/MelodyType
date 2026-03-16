export type TimeTier = "beginner" | "intermediate" | "advanced" | "expert"

export interface TimeLevel {
  id: string
  name: string
  description: string
  tier: TimeTier
  timeLimit: number
  difficulty: "easy" | "medium" | "hard"
  punctuation: boolean
  numbers: boolean
  wordCount: number
  order: number
}

export interface LevelRecord {
  bestWpm: number
  bestAccuracy: number
  attempts: number
}

export const TIER_META: Record<TimeTier, { label: string; color: string; gradient: string }> = {
  beginner: {
    label: "Beginner",
    color: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500/10 to-blue-500/5",
  },
  advanced: {
    label: "Advanced",
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
  expert: {
    label: "Expert",
    color: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500/10 to-rose-500/5",
  },
}

export const TIME_LEVELS: TimeLevel[] = [
  // ── Beginner ──────────────────────────────────────────
  {
    id: "b-1",
    name: "First Steps",
    description: "Short & sweet — common words only",
    tier: "beginner",
    timeLimit: 15,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 60,
    order: 1,
  },
  {
    id: "b-2",
    name: "Quick Dash",
    description: "Pick up speed with simple vocabulary",
    tier: "beginner",
    timeLimit: 30,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 120,
    order: 2,
  },
  {
    id: "b-3",
    name: "Steady Flow",
    description: "Build rhythm over a full minute",
    tier: "beginner",
    timeLimit: 60,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 200,
    order: 3,
  },
  {
    id: "b-4",
    name: "Number Intro",
    description: "Easy words sprinkled with digits",
    tier: "beginner",
    timeLimit: 30,
    difficulty: "easy",
    punctuation: false,
    numbers: true,
    wordCount: 120,
    order: 4,
  },
  {
    id: "b-5",
    name: "Long Run",
    description: "Two minutes of easy-going typing",
    tier: "beginner",
    timeLimit: 120,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 350,
    order: 5,
  },

  // ── Intermediate ──────────────────────────────────────
  {
    id: "i-1",
    name: "Stepping Up",
    description: "Longer words enter the mix",
    tier: "intermediate",
    timeLimit: 15,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    wordCount: 60,
    order: 1,
  },
  {
    id: "i-2",
    name: "Word Power",
    description: "Medium vocabulary, steady pace",
    tier: "intermediate",
    timeLimit: 30,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    wordCount: 120,
    order: 2,
  },
  {
    id: "i-3",
    name: "Full Sentences",
    description: "Capitals, commas, and periods",
    tier: "intermediate",
    timeLimit: 30,
    difficulty: "easy",
    punctuation: true,
    numbers: false,
    wordCount: 120,
    order: 3,
  },
  {
    id: "i-4",
    name: "Number Crunch",
    description: "Words mixed with numbers",
    tier: "intermediate",
    timeLimit: 30,
    difficulty: "easy",
    punctuation: false,
    numbers: true,
    wordCount: 120,
    order: 4,
  },
  {
    id: "i-5",
    name: "Mixed Bag",
    description: "Medium words with punctuation",
    tier: "intermediate",
    timeLimit: 60,
    difficulty: "medium",
    punctuation: true,
    numbers: false,
    wordCount: 200,
    order: 5,
  },
  {
    id: "i-6",
    name: "Endurance",
    description: "Two minutes, no shortcuts",
    tier: "intermediate",
    timeLimit: 120,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    wordCount: 350,
    order: 6,
  },

  // ── Advanced ──────────────────────────────────────────
  {
    id: "a-1",
    name: "Complex Words",
    description: "Tackle longer, harder vocabulary",
    tier: "advanced",
    timeLimit: 30,
    difficulty: "hard",
    punctuation: false,
    numbers: false,
    wordCount: 120,
    order: 1,
  },
  {
    id: "a-2",
    name: "Punctuation Pro",
    description: "Full sentences with medium words & digits",
    tier: "advanced",
    timeLimit: 60,
    difficulty: "medium",
    punctuation: true,
    numbers: true,
    wordCount: 200,
    order: 2,
  },
  {
    id: "a-3",
    name: "Data Entry",
    description: "Hard words riddled with numbers",
    tier: "advanced",
    timeLimit: 30,
    difficulty: "hard",
    punctuation: false,
    numbers: true,
    wordCount: 120,
    order: 3,
  },
  {
    id: "a-4",
    name: "The Challenge",
    description: "Hard vocabulary in proper sentences",
    tier: "advanced",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: false,
    wordCount: 200,
    order: 4,
  },
  {
    id: "a-5",
    name: "Full Combo",
    description: "Hard words, punctuation, and numbers",
    tier: "advanced",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 200,
    order: 5,
  },
  {
    id: "a-6",
    name: "Marathon",
    description: "Two minutes of complex typing",
    tier: "advanced",
    timeLimit: 120,
    difficulty: "hard",
    punctuation: false,
    numbers: false,
    wordCount: 350,
    order: 6,
  },

  // ── Expert ────────────────────────────────────────────
  {
    id: "e-1",
    name: "Speed Demon",
    description: "Everything at once — 15 seconds!",
    tier: "expert",
    timeLimit: 15,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 60,
    order: 1,
  },
  {
    id: "e-2",
    name: "Precision Test",
    description: "Accuracy matters most here",
    tier: "expert",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 200,
    order: 2,
  },
  {
    id: "e-3",
    name: "The Gauntlet",
    description: "Two-minute all-features endurance",
    tier: "expert",
    timeLimit: 120,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 350,
    order: 3,
  },
]

export function getLevelById(id: string): TimeLevel | undefined {
  return TIME_LEVELS.find((l) => l.id === id)
}

export function getLevelsByTier(tier: TimeTier): TimeLevel[] {
  return TIME_LEVELS.filter((l) => l.tier === tier).sort((a, b) => a.order - b.order)
}

export const TIER_ORDER: TimeTier[] = ["beginner", "intermediate", "advanced", "expert"]

export function getStars(record: LevelRecord | null): number {
  if (!record || record.attempts === 0) return 0
  if (record.bestWpm >= 60 && record.bestAccuracy >= 95) return 3
  if (record.bestWpm >= 30) return 2
  return 1
}
