export const SHIFT_PHYSICAL_KEY = "shift"

export const PRINTABLE_KEY_ROWS: string[][] = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
]

type PhysicalKeySpec = {
  base: string
  shifted?: string
}

const NON_LETTER_KEY_SPECS: Record<string, PhysicalKeySpec> = {
  "`": { base: "`", shifted: "~" },
  "1": { base: "1", shifted: "!" },
  "2": { base: "2", shifted: "@" },
  "3": { base: "3", shifted: "#" },
  "4": { base: "4", shifted: "$" },
  "5": { base: "5", shifted: "%" },
  "6": { base: "6", shifted: "^" },
  "7": { base: "7", shifted: "&" },
  "8": { base: "8", shifted: "*" },
  "9": { base: "9", shifted: "(" },
  "0": { base: "0", shifted: ")" },
  "-": { base: "-", shifted: "_" },
  "=": { base: "=", shifted: "+" },
  "[": { base: "[", shifted: "{" },
  "]": { base: "]", shifted: "}" },
  "\\": { base: "\\", shifted: "|" },
  ";": { base: ";", shifted: ":" },
  "'": { base: "'", shifted: "\"" },
  ",": { base: ",", shifted: "<" },
  ".": { base: ".", shifted: ">" },
  "/": { base: "/", shifted: "?" },
  " ": { base: " " },
}

function isLowerLetter(char: string): boolean {
  return char.length === 1 && char >= "a" && char <= "z"
}

function isUpperLetter(char: string): boolean {
  return char.length === 1 && char >= "A" && char <= "Z"
}

export interface PhysicalKeyMapping {
  physicalKey: string
  shift: boolean
  displayLabel: string
}

export function getPhysicalKeyDisplay(
  physicalKey: string,
): PhysicalKeySpec | null {
  if (NON_LETTER_KEY_SPECS[physicalKey]) {
    return NON_LETTER_KEY_SPECS[physicalKey]
  }
  if (isLowerLetter(physicalKey)) {
    return {
      base: physicalKey,
      shifted: physicalKey.toUpperCase(),
    }
  }
  return null
}

export function getPhysicalKeyForLogicalChar(
  char: string | null | undefined,
): PhysicalKeyMapping | null {
  if (!char || char.length !== 1) return null

  if (char === " ") {
    return {
      physicalKey: " ",
      shift: false,
      displayLabel: char,
    }
  }

  if (isLowerLetter(char)) {
    return {
      physicalKey: char,
      shift: false,
      displayLabel: char.toUpperCase(),
    }
  }

  if (isUpperLetter(char)) {
    return {
      physicalKey: char.toLowerCase(),
      shift: true,
      displayLabel: char,
    }
  }

  for (const [physicalKey, spec] of Object.entries(NON_LETTER_KEY_SPECS)) {
    if (spec.base === char) {
      return {
        physicalKey,
        shift: false,
        displayLabel: char,
      }
    }
    if (spec.shifted === char) {
      return {
        physicalKey,
        shift: true,
        displayLabel: char,
      }
    }
  }

  return null
}

export function getLogicalCandidatesForPhysicalKey(
  physicalKey: string,
): string[] {
  const display = getPhysicalKeyDisplay(physicalKey)
  if (!display) return []
  if (isLowerLetter(physicalKey) || physicalKey === " ") {
    return [display.base]
  }
  return display.shifted ? [display.base, display.shifted] : [display.base]
}

export function isAmbiguousPhysicalKey(physicalKey: string): boolean {
  return getLogicalCandidatesForPhysicalKey(physicalKey).length > 1
}

export function getRequiredPhysicalKeysForLogicalChar(
  char: string | null | undefined,
): string[] {
  const mapping = getPhysicalKeyForLogicalChar(char)
  if (!mapping) return []
  return mapping.shift
    ? [mapping.physicalKey, SHIFT_PHYSICAL_KEY]
    : [mapping.physicalKey]
}

export function getRequiredPhysicalKeysForInput(
  key: string,
): string[] {
  if (key === "Shift") return [SHIFT_PHYSICAL_KEY]
  return getRequiredPhysicalKeysForLogicalChar(key)
}

export const PROSE_PUNCTUATION_CHARS = [
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  "-",
  "'",
  "\"",
] as const

export const DIGIT_CHARS = "0123456789".split("")

const ALL_PRINTABLE_LOGICAL_CHARS = [
  ...new Set(
    [...PRINTABLE_KEY_ROWS.flat(), " "]
      .flatMap((physicalKey) => getLogicalCandidatesForPhysicalKey(physicalKey)),
  ),
]

export const SPECIAL_CHARACTER_CHARS = ALL_PRINTABLE_LOGICAL_CHARS.filter((char) => {
  if (char === " ") return false
  if (DIGIT_CHARS.includes(char)) return false
  if (PROSE_PUNCTUATION_CHARS.includes(
    char as (typeof PROSE_PUNCTUATION_CHARS)[number],
  )) return false
  if (isLowerLetter(char) || isUpperLetter(char)) return false
  return true
})

export type LogicalCharCategory =
  | "letter"
  | "digit"
  | "punctuation"
  | "special"
  | "space"
  | "other"

export function getLogicalCharCategory(char: string): LogicalCharCategory {
  if (char === " ") return "space"
  if (isLowerLetter(char) || isUpperLetter(char)) return "letter"
  if (DIGIT_CHARS.includes(char)) return "digit"
  if (PROSE_PUNCTUATION_CHARS.includes(
    char as (typeof PROSE_PUNCTUATION_CHARS)[number],
  )) return "punctuation"
  if (SPECIAL_CHARACTER_CHARS.includes(char)) return "special"
  return "other"
}
