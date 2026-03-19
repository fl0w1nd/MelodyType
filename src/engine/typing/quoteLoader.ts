export interface Quote {
  text: string
  author: string
  length: "short" | "medium" | "long"
}

interface QuoteData {
  quotes: Quote[]
}

const fallbackQuote: Quote = {
  text: "Practice steadily and the rhythm will follow.",
  author: "MelodyType",
  length: "short",
}

let cachedQuotes: Quote[] | null = null
let loadingPromise: Promise<Quote[]> | null = null

async function fetchQuotes(): Promise<Quote[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/quotes.json`)
  if (!res.ok) throw new Error(`Failed to load quotes: ${res.status}`)
  const data: QuoteData = await res.json()
  return data.quotes
}

export async function loadQuotes(): Promise<Quote[]> {
  if (cachedQuotes) return cachedQuotes
  if (!loadingPromise) {
    loadingPromise = fetchQuotes().then((quotes) => {
      cachedQuotes = quotes
      loadingPromise = null
      return quotes
    }).catch((err) => {
      loadingPromise = null
      throw err
    })
  }
  return loadingPromise
}

export async function getRandomQuoteAsync(
  length?: "short" | "medium" | "long",
): Promise<Quote> {
  const quotes = await loadQuotes()
  const pool = length ? quotes.filter((q) => q.length === length) : quotes
  const list = pool.length > 0 ? pool : quotes
  // Keep quote mode functional even if the bundled data file is unexpectedly
  // empty after filtering or during local development.
  if (list.length === 0) return fallbackQuote
  return list[Math.floor(Math.random() * list.length)]
}

export function preloadQuotes(): void {
  loadQuotes().catch(() => {})
}
