export type TimeTier = "beginner" | "intermediate" | "advanced" | "expert"
export type TimeGrade = "C" | "B" | "A" | "S"

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
  targetWpm: number
  targetAccuracy: number
}

export interface LevelRecord {
  attempts: number
  bestWpm: number
  bestAccuracy: number
  bestGrade: TimeGrade
  lastWpm: number
  lastAccuracy: number
  lastGrade: TimeGrade
  lastPlayedAt: number
}

export interface GradeRequirement {
  grade: Exclude<TimeGrade, "C">
  wpm: number
  accuracy: number
}

export interface NextGradeRequirement extends GradeRequirement {
  wpmGap: number
  accuracyGap: number
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

export const TIME_GRADE_ORDER: TimeGrade[] = ["C", "B", "A", "S"]

export const TIME_GRADE_META: Record<
  TimeGrade,
  { color: string; badge: string; message: string }
> = {
  S: {
    color: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
    message: "Top-tier clear. Rhythm and precision both held up.",
  },
  A: {
    color: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/25",
    message: "Strong run. The level target was met cleanly.",
  },
  B: {
    color: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
    message: "Solid clear. A little more speed or accuracy will push it higher.",
  },
  C: {
    color: "text-blue-500",
    badge: "bg-blue-500/12 text-blue-700 border-blue-500/25 dark:text-blue-400",
    message: "Baseline clear. Build consistency before chasing faster grades.",
  },
}

export const TIME_LEVELS: TimeLevel[] = [
  {
    id: "b-1",
    name: "First Steps",
    description: "Short, forgiving bursts to lock in the basics.",
    tier: "beginner",
    timeLimit: 15,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 18,
    order: 1,
    targetWpm: 20,
    targetAccuracy: 92,
  },
  {
    id: "b-2",
    name: "Quick Dash",
    description: "A slightly longer easy run focused on stable tempo.",
    tier: "beginner",
    timeLimit: 30,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 40,
    order: 2,
    targetWpm: 24,
    targetAccuracy: 93,
  },
  {
    id: "b-3",
    name: "Steady Flow",
    description: "A full minute of simple words to build staying power.",
    tier: "beginner",
    timeLimit: 60,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 80,
    order: 3,
    targetWpm: 26,
    targetAccuracy: 93.5,
  },
  {
    id: "b-4",
    name: "Number Intro",
    description: "Bring digits into the mix without raising the word difficulty.",
    tier: "beginner",
    timeLimit: 30,
    difficulty: "easy",
    punctuation: false,
    numbers: true,
    wordCount: 42,
    order: 4,
    targetWpm: 28,
    targetAccuracy: 94,
  },
  {
    id: "b-5",
    name: "Long Run",
    description: "Two minutes of easy text to prepare for longer tests.",
    tier: "beginner",
    timeLimit: 120,
    difficulty: "easy",
    punctuation: false,
    numbers: false,
    wordCount: 180,
    order: 5,
    targetWpm: 30,
    targetAccuracy: 94,
  },
  {
    id: "i-1",
    name: "Stepping Up",
    description: "Medium vocabulary in a short burst to raise baseline speed.",
    tier: "intermediate",
    timeLimit: 15,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    wordCount: 28,
    order: 1,
    targetWpm: 32,
    targetAccuracy: 94.5,
  },
  {
    id: "i-2",
    name: "Word Power",
    description: "Medium words over 30 seconds with a steadier pace target.",
    tier: "intermediate",
    timeLimit: 30,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    wordCount: 55,
    order: 2,
    targetWpm: 36,
    targetAccuracy: 95,
  },
  {
    id: "i-3",
    name: "Full Sentences",
    description: "Punctuation enters while the vocabulary stays manageable.",
    tier: "intermediate",
    timeLimit: 30,
    difficulty: "medium",
    punctuation: true,
    numbers: false,
    wordCount: 60,
    order: 3,
    targetWpm: 38,
    targetAccuracy: 95,
  },
  {
    id: "i-4",
    name: "Number Crunch",
    description: "Digits plus medium words to sharpen visual transitions.",
    tier: "intermediate",
    timeLimit: 30,
    difficulty: "medium",
    punctuation: false,
    numbers: true,
    wordCount: 60,
    order: 4,
    targetWpm: 40,
    targetAccuracy: 95,
  },
  {
    id: "i-5",
    name: "Mixed Bag",
    description: "Longer medium runs where punctuation pressure starts to matter.",
    tier: "intermediate",
    timeLimit: 60,
    difficulty: "medium",
    punctuation: true,
    numbers: false,
    wordCount: 120,
    order: 5,
    targetWpm: 44,
    targetAccuracy: 95.5,
  },
  {
    id: "i-6",
    name: "Endurance",
    description: "A two-minute medium test that rewards control over panic.",
    tier: "intermediate",
    timeLimit: 120,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    wordCount: 220,
    order: 6,
    targetWpm: 46,
    targetAccuracy: 95.5,
  },
  {
    id: "a-1",
    name: "Complex Words",
    description: "Hard vocabulary becomes the new normal.",
    tier: "advanced",
    timeLimit: 30,
    difficulty: "hard",
    punctuation: false,
    numbers: false,
    wordCount: 75,
    order: 1,
    targetWpm: 48,
    targetAccuracy: 95.5,
  },
  {
    id: "a-2",
    name: "Punctuation Pro",
    description: "Harder sentences where punctuation can no longer be ignored.",
    tier: "advanced",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: false,
    wordCount: 135,
    order: 2,
    targetWpm: 52,
    targetAccuracy: 96,
  },
  {
    id: "a-3",
    name: "Data Entry",
    description: "Hard words and digits in a shorter, sharper burst.",
    tier: "advanced",
    timeLimit: 30,
    difficulty: "hard",
    punctuation: false,
    numbers: true,
    wordCount: 80,
    order: 3,
    targetWpm: 54,
    targetAccuracy: 96,
  },
  {
    id: "a-4",
    name: "The Challenge",
    description: "Long-form hard text that punishes sloppy punctuation handling.",
    tier: "advanced",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: false,
    wordCount: 145,
    order: 4,
    targetWpm: 58,
    targetAccuracy: 96.5,
  },
  {
    id: "a-5",
    name: "Full Combo",
    description: "Hard words, punctuation, and numbers all at once.",
    tier: "advanced",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 150,
    order: 5,
    targetWpm: 60,
    targetAccuracy: 96.5,
  },
  {
    id: "a-6",
    name: "Marathon",
    description: "A long advanced run that tests whether pace survives fatigue.",
    tier: "advanced",
    timeLimit: 120,
    difficulty: "hard",
    punctuation: false,
    numbers: false,
    wordCount: 280,
    order: 6,
    targetWpm: 62,
    targetAccuracy: 96.5,
  },
  {
    id: "e-1",
    name: "Speed Demon",
    description: "A short all-features burst that rewards explosive control.",
    tier: "expert",
    timeLimit: 15,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 55,
    order: 1,
    targetWpm: 68,
    targetAccuracy: 97,
  },
  {
    id: "e-2",
    name: "Precision Test",
    description: "The expert benchmark: speed is high, but misses are punished harder.",
    tier: "expert",
    timeLimit: 60,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 190,
    order: 2,
    targetWpm: 74,
    targetAccuracy: 97.5,
  },
  {
    id: "e-3",
    name: "The Gauntlet",
    description: "Two minutes of expert text where both pace and focus must hold.",
    tier: "expert",
    timeLimit: 120,
    difficulty: "hard",
    punctuation: true,
    numbers: true,
    wordCount: 340,
    order: 3,
    targetWpm: 80,
    targetAccuracy: 98,
  },
]

function roundAccuracy(value: number): number {
  return Math.round(value * 10) / 10
}

export function getLevelById(id: string): TimeLevel | undefined {
  return TIME_LEVELS.find((l) => l.id === id)
}

export function getLevelsByTier(tier: TimeTier): TimeLevel[] {
  return TIME_LEVELS.filter((l) => l.tier === tier).sort((a, b) => a.order - b.order)
}

export const TIER_ORDER: TimeTier[] = ["beginner", "intermediate", "advanced", "expert"]

export function getGradeRequirements(level: TimeLevel): Record<Exclude<TimeGrade, "C">, GradeRequirement> {
  return {
    B: {
      grade: "B",
      wpm: Math.max(10, level.targetWpm - 6),
      accuracy: roundAccuracy(Math.max(80, level.targetAccuracy - 2.5)),
    },
    A: {
      grade: "A",
      wpm: level.targetWpm,
      accuracy: roundAccuracy(level.targetAccuracy),
    },
    S: {
      grade: "S",
      wpm: level.targetWpm + 8,
      accuracy: roundAccuracy(Math.min(99, level.targetAccuracy + 1.5)),
    },
  }
}

export function getTimeGrade(level: TimeLevel, wpm: number, accuracy: number): TimeGrade {
  const requirements = getGradeRequirements(level)
  if (wpm >= requirements.S.wpm && accuracy >= requirements.S.accuracy) return "S"
  if (wpm >= requirements.A.wpm && accuracy >= requirements.A.accuracy) return "A"
  if (wpm >= requirements.B.wpm && accuracy >= requirements.B.accuracy) return "B"
  return "C"
}

export function compareTimeGrades(left: TimeGrade, right: TimeGrade): number {
  return TIME_GRADE_ORDER.indexOf(left) - TIME_GRADE_ORDER.indexOf(right)
}

export function getNextGradeRequirement(
  level: TimeLevel,
  wpm: number,
  accuracy: number,
): NextGradeRequirement | null {
  const currentGrade = getTimeGrade(level, wpm, accuracy)
  if (currentGrade === "S") return null

  const requirements = getGradeRequirements(level)
  const targetGrade = currentGrade === "C" ? "B" : currentGrade === "B" ? "A" : "S"
  const target = requirements[targetGrade]

  return {
    ...target,
    wpmGap: Math.max(0, Math.round((target.wpm - wpm) * 10) / 10),
    accuracyGap: Math.max(0, roundAccuracy(target.accuracy - accuracy)),
  }
}
