import modelData from "./en-model.json"

interface ModelData {
  order: number
  alphabet: number[]
  segments: [number, number][][]
}

const data: ModelData = modelData as ModelData

const MIN_WORD_LENGTH = 3
const MAX_WORD_LENGTH = 10

const alphabetChars = data.alphabet.map((cp) => String.fromCodePoint(cp))
const charToIndex = new Map<string, number>()
for (let i = 0; i < alphabetChars.length; i++) {
  charToIndex.set(alphabetChars[i], i)
}

function segmentIndex(chain: number[]): number {
  const { order, alphabet } = data
  const size = alphabet.length
  let index = 0
  for (let i = 0; i < order - 1; i++) {
    const pos = chain.length - order + i + 1
    const ci = pos >= 0 && pos < chain.length ? chain[pos] : charToIndex.get(" ") ?? 0
    let offset = 1
    for (let j = 0; j < order - i - 2; j++) offset *= size
    index += ci * offset
  }
  return index
}

function weightedRandomSample(
  entries: [number, number][],
  filter: Set<string> | null,
  wordLength: number,
): number | null {
  let totalWeight = 0
  const filtered: { idx: number; weight: number }[] = []

  for (const [idx, freq] of entries) {
    const ch = alphabetChars[idx]
    if (ch === " ") {
      if (wordLength < MIN_WORD_LENGTH) continue
      const boosted = freq * Math.pow(1.3, wordLength)
      filtered.push({ idx, weight: boosted })
      totalWeight += boosted
    } else {
      if (filter && !filter.has(ch)) continue
      filtered.push({ idx, weight: freq })
      totalWeight += freq
    }
  }

  if (filtered.length === 0) return null

  let r = Math.random() * totalWeight
  for (const { idx, weight } of filtered) {
    r -= weight
    if (r <= 0) return idx
  }
  return filtered[filtered.length - 1].idx
}

export function generateMarkovWord(
  availableKeys: Set<string>,
  focusKey: string | null,
): string {
  const filter = new Set<string>()
  for (const k of availableKeys) {
    const idx = charToIndex.get(k)
    if (idx !== undefined) filter.add(k)
  }

  const spaceIdx = charToIndex.get(" ") ?? 0
  let bestWord = ""

  for (let attempt = 0; attempt < 5; attempt++) {
    const chain: number[] = []

    if (focusKey && filter.has(focusKey) && Math.random() < 0.3) {
      const fi = charToIndex.get(focusKey)
      if (fi !== undefined) chain.push(fi)
    }

    if (chain.length === 0) {
      const startEntries = data.segments[segmentIndex([spaceIdx])]
      if (startEntries && startEntries.length > 0) {
        const picked = weightedRandomSample(startEntries, filter, 0)
        if (picked !== null && alphabetChars[picked] !== " ") {
          chain.push(picked)
        }
      }
    }

    if (chain.length === 0) {
      const available = Array.from(filter)
      if (available.length === 0) break
      const ch = available[Math.floor(Math.random() * available.length)]
      chain.push(charToIndex.get(ch)!)
    }

    while (chain.length <= MAX_WORD_LENGTH) {
      const seg = data.segments[segmentIndex(chain)]
      if (!seg || seg.length === 0) break

      const picked = weightedRandomSample(seg, filter, chain.length)
      if (picked === null) break
      if (alphabetChars[picked] === " ") break
      chain.push(picked)
    }

    const word = chain.map((i) => alphabetChars[i]).join("")
    if (word.length >= MIN_WORD_LENGTH) {
      if (focusKey && word.includes(focusKey)) {
        if (word.indexOf(focusKey) > 0) return word
        if (word.length > bestWord.length) bestWord = word
        continue
      }
      if (!focusKey) return word
      if (word.length > bestWord.length) bestWord = word
    }
  }

  if (bestWord.length > 0) {
    if (focusKey && filter.has(focusKey)) {
      const idx = bestWord.indexOf(focusKey)
      if (idx < 0) {
        const pos = bestWord.length > 1
          ? 1 + Math.floor(Math.random() * (bestWord.length - 1))
          : 0
        bestWord = bestWord.slice(0, pos) + focusKey + bestWord.slice(pos + 1)
      } else if (idx === 0 && bestWord.length > 1) {
        const newPos = 1 + Math.floor(Math.random() * (bestWord.length - 1))
        const chars = bestWord.split("")
        chars[0] = chars[newPos]
        chars[newPos] = focusKey
        bestWord = chars.join("")
      }
    }
    return bestWord
  }

  const fallback = Array.from(filter)
  const len = Math.floor(Math.random() * 4) + 3
  let word = ""
  for (let i = 0; i < len; i++) {
    word += fallback[Math.floor(Math.random() * fallback.length)]
  }
  return word
}
