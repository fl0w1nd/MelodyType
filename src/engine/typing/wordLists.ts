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
