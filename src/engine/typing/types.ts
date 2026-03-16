export type PracticeMode =
  | "adaptive"
  | "time"
  | "quote"

export interface PracticeModeConfig {
  mode: PracticeMode
  timeLimit?: number
  difficulty?: "easy" | "medium" | "hard"
  punctuation?: boolean
  numbers?: boolean
}

export interface CharState {
  char: string
  status: "pending" | "correct" | "incorrect"
  typedChar?: string
  timestamp?: number
  hadError?: boolean
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
