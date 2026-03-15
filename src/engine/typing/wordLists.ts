export const homeRowKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"]
export const topRowKeys = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
export const bottomRowKeys = ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]
export const numberRowKeys = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
]

export const fingerZones: Record<string, string[]> = {
  "Left Pinky": ["q", "a", "z", "1"],
  "Left Ring": ["w", "s", "x", "2"],
  "Left Middle": ["e", "d", "c", "3"],
  "Left Index": ["r", "f", "v", "t", "g", "b", "4", "5"],
  "Right Index": ["y", "h", "n", "u", "j", "m", "6", "7"],
  "Right Middle": ["i", "k", ",", "8"],
  "Right Ring": ["o", "l", ".", "9"],
  "Right Pinky": ["p", ";", "/", "0", "[", "]", "'"],
}

export const fingerForKey: Record<string, string> = {}
for (const [finger, keys] of Object.entries(fingerZones)) {
  for (const key of keys) {
    fingerForKey[key] = finger
  }
}

export interface LessonDefinition {
  id: string
  name: string
  description: string
  category: "homeRow" | "topRow" | "bottomRow" | "numbers" | "full" | "custom"
  keys: string[]
  level: number
}

export const beginnerLessons: LessonDefinition[] = [
  {
    id: "home-jf",
    name: "Home Row: J & F",
    description: "Start with the two index finger home keys",
    category: "homeRow",
    keys: ["j", "f"],
    level: 1,
  },
  {
    id: "home-jfkd",
    name: "Home Row: J F K D",
    description: "Add the middle finger keys",
    category: "homeRow",
    keys: ["j", "f", "k", "d"],
    level: 2,
  },
  {
    id: "home-jfkdls",
    name: "Home Row: + L & S",
    description: "Add the ring finger keys",
    category: "homeRow",
    keys: ["j", "f", "k", "d", "l", "s"],
    level: 3,
  },
  {
    id: "home-full",
    name: "Full Home Row",
    description: "All home row keys including pinkies",
    category: "homeRow",
    keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
    level: 4,
  },
  {
    id: "top-er",
    name: "Top Row: E & R",
    description: "Common top row keys for index and middle fingers",
    category: "topRow",
    keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", "e", "r"],
    level: 5,
  },
  {
    id: "top-ti",
    name: "Top Row: + T & I",
    description: "Add T and I to your repertoire",
    category: "topRow",
    keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", "e", "r", "t", "i"],
    level: 6,
  },
  {
    id: "top-full",
    name: "Full Top Row",
    description: "All top row keys combined with home row",
    category: "topRow",
    keys: [
      ...homeRowKeys,
      ...topRowKeys,
    ],
    level: 7,
  },
  {
    id: "bottom-nm",
    name: "Bottom Row: N & M",
    description: "Start the bottom row with index finger keys",
    category: "bottomRow",
    keys: [
      ...homeRowKeys,
      ...topRowKeys,
      "n", "m",
    ],
    level: 8,
  },
  {
    id: "bottom-full",
    name: "Full Bottom Row",
    description: "All three rows combined",
    category: "bottomRow",
    keys: [
      ...homeRowKeys,
      ...topRowKeys,
      ...bottomRowKeys,
    ],
    level: 9,
  },
  {
    id: "numbers",
    name: "Number Row",
    description: "Add number keys to complete the keyboard",
    category: "numbers",
    keys: [
      ...homeRowKeys,
      ...topRowKeys,
      ...bottomRowKeys,
      ...numberRowKeys,
    ],
    level: 10,
  },
]

export const commonWords: Record<string, string[]> = {
  easy: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
    "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
    "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
    "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know",
    "take", "come", "could", "than", "look", "day", "did", "ask", "back",
    "use", "way", "may", "well", "also", "play", "run", "move", "live",
    "has", "see", "had", "was", "are", "new", "old", "big", "long",
  ],
  medium: [
    "people", "think", "after", "because", "other", "these", "first",
    "right", "being", "still", "where", "before", "should", "through",
    "great", "every", "world", "between", "never", "place", "same",
    "another", "while", "change", "might", "again", "point", "house",
    "something", "number", "water", "found", "always", "together",
    "important", "family", "system", "country", "follow", "second",
    "under", "problem", "during", "without", "begin", "group", "often",
    "already", "until", "program", "company", "example", "small",
    "large", "better", "question", "really", "different", "around",
    "develop", "interest", "student", "answer", "several", "possible",
    "morning", "evening", "friend", "simple", "letter", "market",
  ],
  hard: [
    "government", "experience", "education", "environment", "information",
    "development", "technology", "understanding", "organization", "particular",
    "international", "significant", "responsibility", "communication",
    "professional", "opportunity", "relationship", "performance", "management",
    "community", "situation", "difference", "knowledge", "individual",
    "political", "certainly", "everything", "especially", "necessary",
    "consequence", "acknowledge", "demonstrate", "approximately",
    "accomplish", "circumstance", "independent", "infrastructure",
    "comprehensive", "sophisticated", "extraordinary", "nevertheless",
    "collaboration", "consciousness", "transformation", "philosophical",
    "unfortunately", "simultaneously", "representative", "recommendation",
  ],
}

export const quotes = [
  "The only way to do great work is to love what you do.",
  "In the middle of difficulty lies opportunity.",
  "Life is what happens when you are busy making other plans.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "It does not matter how slowly you go as long as you do not stop.",
  "The best time to plant a tree was twenty years ago. The second best time is now.",
  "Your time is limited so do not waste it living someone else's life.",
  "Believe you can and you are halfway there.",
  "The only impossible journey is the one you never begin.",
  "Success is not final and failure is not fatal. It is the courage to continue that counts.",
  "What you get by achieving your goals is not as important as what you become by achieving your goals.",
  "The way to get started is to quit talking and begin doing.",
  "If you look at what you have in life you will always have more.",
  "Life is really simple but we insist on making it complicated.",
  "The purpose of our lives is to be happy.",
  "You only live once but if you do it right once is enough.",
  "Many of life's failures are people who did not realize how close they were to success when they gave up.",
  "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
  "The greatest glory in living lies not in never falling but in rising every time we fall.",
  "Do not go where the path may lead. Go instead where there is no path and leave a trail.",
]

export function generateTextFromKeys(
  keys: string[],
  wordCount: number,
): string {
  const words: string[] = []
  const letterKeys = keys.filter((k) => /^[a-z]$/.test(k))

  if (letterKeys.length === 0) return ""

  for (let i = 0; i < wordCount; i++) {
    const len = Math.floor(Math.random() * 4) + 2
    let word = ""
    for (let j = 0; j < len; j++) {
      word += letterKeys[Math.floor(Math.random() * letterKeys.length)]
    }
    words.push(word)
  }
  return words.join(" ")
}

export function generateWordText(
  difficulty: "easy" | "medium" | "hard",
  wordCount: number,
): string {
  const pool = commonWords[difficulty]
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return words.join(" ")
}

export function getRandomQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)]
}
