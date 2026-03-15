export type PracticeMode =
  | "time"
  | "words"
  | "quote"
  | "lesson"
  | "free"
  | "custom"

export interface PracticeModeConfig {
  mode: PracticeMode
  timeLimit?: number
  wordCount?: number
  difficulty?: "easy" | "medium" | "hard"
  lessonId?: string
  customText?: string
}

export interface CharState {
  char: string
  status: "pending" | "correct" | "incorrect" | "extra"
  typedChar?: string
  timestamp?: number
}

export interface WordState {
  chars: CharState[]
  completed: boolean
}

export interface TypingState {
  words: WordState[]
  currentWordIndex: number
  currentCharIndex: number
  startTime: number | null
  endTime: number | null
  isStarted: boolean
  isFinished: boolean
  totalKeystrokes: number
  correctKeystrokes: number
  errorKeystrokes: number
  keystrokeLog: KeystrokeEntry[]
}

export interface KeystrokeEntry {
  key: string
  correct: boolean
  timestamp: number
  wordIndex: number
  charIndex: number
}

export interface TypingMetrics {
  wpm: number
  rawWpm: number
  accuracy: number
  correctChars: number
  incorrectChars: number
  totalChars: number
  elapsedTime: number
  consistency: number
}
