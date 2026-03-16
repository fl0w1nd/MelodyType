import { Polynomial } from "./polynomial.ts"
import { Sle } from "./sle.ts"
import { type Vector } from "./vector.ts"

export function linearRegression(vx: Vector, vy: Vector): Polynomial {
  const { length } = vx
  if (length !== vy.length) {
    throw new Error()
  }
  if (length === 0) {
    throw new Error()
  }

  let sx = 0
  let sy = 0
  for (let i = 0; i < length; i++) {
    sx = sx + vx.at(i)
    sy = sy + vy.at(i)
  }
  const mx = sx / length
  const my = sy / length

  let s1 = 0
  let s2 = 0
  for (let i = 0; i < length; i++) {
    const t0 = vx.at(i) - mx
    const t1 = vy.at(i) - my
    s1 = s1 + t0 * t1
    s2 = s2 + t0 * t0
  }
  const a = my - (s1 / s2) * mx
  const b = s1 / s2

  return Polynomial.from([a, b])
}

export function polynomialRegression(
  vx: Vector,
  vy: Vector,
  degree: number,
): Polynomial {
  if (degree === 1) {
    return linearRegression(vx, vy)
  }

  const { length } = vx
  if (length !== vy.length) {
    throw new Error()
  }
  if (length === 0) {
    throw new Error()
  }

  const size = degree + 1
  const sle = new Sle(size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let t = 0
      for (let l = 0; l < length; l++) {
        t += vx.at(l) ** (i + j)
      }
      sle.A[i][j] = t
    }
  }
  for (let i = 0; i < size; i++) {
    let t = 0
    for (let l = 0; l < length; l++) {
      t += vx.at(l) ** i * vy.at(l)
    }
    sle.y[i] = t
  }
  return Polynomial.from(sle.solve())
}

/**
 * Coefficient of determination (R²).
 * @see https://en.wikipedia.org/wiki/Coefficient_of_determination
 */
export function r2(
  vx: Vector,
  vy: Vector,
  model: { eval(x: number): number },
): number {
  const { length } = vx
  if (length !== vy.length) {
    throw new Error()
  }
  if (length === 0) {
    throw new Error()
  }

  let sy = 0
  for (let i = 0; i < length; i++) {
    sy = sy + vy.at(i)
  }
  const my = sy / length
  let ssres = 0
  let sstot = 0
  for (let i = 0; i < length; i++) {
    const t0 = vy.at(i) - model.eval(vx.at(i))
    const t1 = vy.at(i) - my
    ssres = ssres + t0 * t0
    sstot = sstot + t1 * t1
  }
  return 1 - ssres / sstot
}
