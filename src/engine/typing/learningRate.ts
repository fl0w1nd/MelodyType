import type { KeySample } from "@/lib/db"
import { Vector, polynomialRegression, r2 } from "./math/index.ts"
import type { Polynomial } from "./math/index.ts"

const SESSION_GAP_MS = 60 * 60 * 1000
const MIN_SESSION_SAMPLES = 5
const MAX_LEARNING_RATE_SAMPLES = 30
const MAX_REMAINING_LESSONS = 50

export interface LearningRateResult {
  certainty: number
  learningRate: number
  remainingLessons: number | null
  model: Polynomial
}

// Mirror keybr's heuristic: keep the latest uninterrupted run of samples,
// splitting on a long gap or a sustained downward trend.
function findSession(samples: readonly KeySample[]): KeySample[] {
  const { length } = samples
  for (let i = length - 1; i > 0; i--) {
    const a = samples[i - 1]
    const b = samples[i]
    if (b.timestamp - a.timestamp > SESSION_GAP_MS) {
      return samples.slice(i)
    }
    if (b.filteredCpm < a.filteredCpm && length - i >= MIN_SESSION_SAMPLES) {
      return samples.slice(i)
    }
  }
  return samples.slice(0)
}

function getPolynomialDegree(length: number): number {
  if (length > 20) return 3
  if (length > 10) return 2
  return 1
}

export function computeLearningRate(
  samples: readonly KeySample[],
  targetSpeed: number,
): LearningRateResult | null {
  if (samples.length < MIN_SESSION_SAMPLES) return null

  const recent = samples.slice(-MAX_LEARNING_RATE_SAMPLES)
  let sessionSamples: KeySample[] = findSession(recent)
  if (sessionSamples.length < MIN_SESSION_SAMPLES) {
    sessionSamples = recent.slice(0) as KeySample[]
  }
  if (sessionSamples.length < MIN_SESSION_SAMPLES) return null

  const vIndex = new Vector()
  const vSpeed = new Vector()
  for (const sample of sessionSamples) {
    vIndex.add(sample.index + 1)
    vSpeed.add(sample.filteredCpm)
  }

  const degree = getPolynomialDegree(sessionSamples.length)
  const model = polynomialRegression(vIndex, vSpeed, degree)
  const certainty = r2(vIndex, vSpeed, model)

  if (certainty < 0.5) {
    return { certainty, learningRate: NaN, remainingLessons: null, model }
  }

  const lastIndex = sessionSamples[sessionSamples.length - 1].index + 1
  const learningRate = model.derivative().eval(lastIndex)

  let remainingLessons: number | null = null
  for (let i = 1; i <= MAX_REMAINING_LESSONS; i++) {
    if (model.eval(lastIndex + i) >= targetSpeed) {
      remainingLessons = i
      break
    }
  }

  return { certainty, learningRate, remainingLessons, model }
}
