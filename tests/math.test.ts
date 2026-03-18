import { describe, it, expect } from "vitest"
import {
  Vector,
  Polynomial,
  Polynomial0,
  Polynomial1,
  Polynomial2,
  Polynomial3,
  PolynomialN,
  Sle,
  linearRegression,
  polynomialRegression,
  r2,
} from "../src/engine/typing/math/index"

// ---------------------------------------------------------------------------
// Vector
// ---------------------------------------------------------------------------

describe("Vector", () => {
  it("constructs empty vector", () => {
    const v = new Vector()
    expect(v.length).toBe(0)
  })

  it("constructs from iterable", () => {
    const v = new Vector([1, 2, 3])
    expect(v.length).toBe(3)
    expect(v.at(0)).toBe(1)
    expect(v.at(1)).toBe(2)
    expect(v.at(2)).toBe(3)
  })

  it("adds values", () => {
    const v = new Vector()
    v.add(10)
    v.add(20)
    expect(v.length).toBe(2)
    expect(v.at(0)).toBe(10)
    expect(v.at(1)).toBe(20)
  })

  it("rejects NaN", () => {
    const v = new Vector()
    expect(() => v.add(NaN)).toThrow()
  })

  it("rejects NaN during construction", () => {
    expect(() => new Vector([1, NaN, 3])).toThrow()
  })

  it("at() throws RangeError on negative index", () => {
    const v = new Vector([1, 2])
    expect(() => v.at(-1)).toThrow(RangeError)
  })

  it("at() throws RangeError on out-of-range index", () => {
    const v = new Vector([1, 2])
    expect(() => v.at(2)).toThrow(RangeError)
    expect(() => v.at(100)).toThrow(RangeError)
  })

  it("at() throws RangeError on non-integer index", () => {
    const v = new Vector([1, 2])
    expect(() => v.at(0.5)).toThrow(RangeError)
    expect(() => v.at(Infinity)).toThrow(RangeError)
  })

  it("is iterable", () => {
    const v = new Vector([10, 20, 30])
    expect([...v]).toEqual([10, 20, 30])
  })

  it("spread of empty vector is empty array", () => {
    const v = new Vector()
    expect([...v]).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Polynomial
// ---------------------------------------------------------------------------

describe("Polynomial", () => {
  describe("Polynomial.from()", () => {
    it("picks Polynomial0 for single coefficient", () => {
      expect(Polynomial.from([5])).toBeInstanceOf(Polynomial0)
    })

    it("picks Polynomial1 for two coefficients", () => {
      expect(Polynomial.from([1, 2])).toBeInstanceOf(Polynomial1)
    })

    it("picks Polynomial2 for three coefficients", () => {
      expect(Polynomial.from([1, 2, 3])).toBeInstanceOf(Polynomial2)
    })

    it("picks Polynomial3 for four coefficients", () => {
      expect(Polynomial.from([1, 2, 3, 4])).toBeInstanceOf(Polynomial3)
    })

    it("picks PolynomialN for five or more coefficients", () => {
      expect(Polynomial.from([1, 2, 3, 4, 5])).toBeInstanceOf(PolynomialN)
    })

    it("trims trailing zeros", () => {
      const p = Polynomial.from([1, 2, 0, 0])
      expect(p).toBeInstanceOf(Polynomial1)
      expect(p.coef).toEqual([1, 2])
    })

    it("trims all zeros except first", () => {
      const p = Polynomial.from([0, 0, 0])
      expect(p).toBeInstanceOf(Polynomial0)
      expect(p.coef).toEqual([0])
    })

    it("throws on empty coefficients", () => {
      expect(() => Polynomial.from([])).toThrow()
    })
  })

  describe("Polynomial0", () => {
    it("eval returns constant regardless of x", () => {
      const p = new Polynomial0(5)
      expect(p.eval(0)).toBe(5)
      expect(p.eval(100)).toBe(5)
      expect(p.eval(-42)).toBe(5)
    })

    it("derivative is zero", () => {
      const p = new Polynomial0(7)
      const d = p.derivative()
      expect(d).toBeInstanceOf(Polynomial0)
      expect(d.eval(999)).toBe(0)
    })

    it("degree is 0", () => {
      expect(new Polynomial0(3).degree).toBe(0)
    })
  })

  describe("Polynomial1", () => {
    it("eval computes a + b*x", () => {
      const p = new Polynomial1(2, 3)
      expect(p.eval(0)).toBe(2)
      expect(p.eval(1)).toBe(5)
      expect(p.eval(-1)).toBe(-1)
      expect(p.eval(10)).toBe(32)
    })

    it("derivative is constant b", () => {
      const p = new Polynomial1(2, 3)
      const d = p.derivative()
      expect(d).toBeInstanceOf(Polynomial0)
      expect(d.eval(0)).toBe(3)
    })

    it("degree is 1", () => {
      expect(new Polynomial1(0, 1).degree).toBe(1)
    })
  })

  describe("Polynomial2", () => {
    it("eval computes a + b*x + c*x^2", () => {
      const p = new Polynomial2(1, 0, 1) // 1 + x^2
      expect(p.eval(0)).toBe(1)
      expect(p.eval(1)).toBe(2)
      expect(p.eval(2)).toBe(5)
      expect(p.eval(-3)).toBe(10)
    })

    it("derivative is b + 2c*x", () => {
      const p = new Polynomial2(1, 3, 5) // 1 + 3x + 5x^2
      const d = p.derivative()
      expect(d).toBeInstanceOf(Polynomial1)
      expect(d.eval(0)).toBe(3)
      expect(d.eval(1)).toBe(13) // 3 + 10*1
    })

    it("degree is 2", () => {
      expect(new Polynomial2(0, 0, 1).degree).toBe(2)
    })
  })

  describe("Polynomial3", () => {
    it("eval computes a + b*x + c*x^2 + d*x^3", () => {
      const p = new Polynomial3(0, 0, 0, 1) // x^3
      expect(p.eval(0)).toBe(0)
      expect(p.eval(2)).toBe(8)
      expect(p.eval(-2)).toBe(-8)
    })

    it("eval with all coefficients", () => {
      const p = new Polynomial3(1, 2, 3, 4) // 1 + 2x + 3x^2 + 4x^3
      expect(p.eval(1)).toBe(10)
      expect(p.eval(2)).toBe(1 + 4 + 12 + 32) // 49
    })

    it("derivative is b + 2c*x + 3d*x^2", () => {
      const p = new Polynomial3(1, 2, 3, 4) // 1 + 2x + 3x^2 + 4x^3
      const d = p.derivative()
      expect(d).toBeInstanceOf(Polynomial2)
      expect(d.eval(0)).toBe(2)
      expect(d.eval(1)).toBe(2 + 6 + 12) // 20
    })

    it("degree is 3", () => {
      expect(new Polynomial3(0, 0, 0, 1).degree).toBe(3)
    })
  })

  describe("PolynomialN", () => {
    it("eval uses Horner's method correctly", () => {
      // 1 + 0x + 0x^2 + 0x^3 + 1x^4 = 1 + x^4
      const p = new PolynomialN([1, 0, 0, 0, 1])
      expect(p.eval(0)).toBe(1)
      expect(p.eval(1)).toBe(2)
      expect(p.eval(2)).toBe(17) // 1 + 16
      expect(p.eval(-1)).toBe(2)
    })

    it("derivative reduces degree", () => {
      // x^4 → 4x^3
      const p = new PolynomialN([0, 0, 0, 0, 1])
      const d = p.derivative()
      expect(d).toBeInstanceOf(Polynomial3)
      expect(d.eval(1)).toBe(4)
      expect(d.eval(2)).toBe(32) // 4 * 8
    })
  })

  describe("chained derivatives", () => {
    it("second derivative of cubic is linear", () => {
      const p = new Polynomial3(1, 2, 3, 4) // 1 + 2x + 3x^2 + 4x^3
      const d1 = p.derivative() // 2 + 6x + 12x^2
      const d2 = d1.derivative() // 6 + 24x
      expect(d2).toBeInstanceOf(Polynomial1)
      expect(d2.eval(0)).toBe(6)
      expect(d2.eval(1)).toBe(30)
    })

    it("third derivative of cubic is constant", () => {
      const p = new Polynomial3(1, 2, 3, 4)
      const d3 = p.derivative().derivative().derivative()
      expect(d3).toBeInstanceOf(Polynomial0)
      expect(d3.eval(0)).toBe(24)
    })

    it("fourth derivative of cubic is zero", () => {
      const p = new Polynomial3(1, 2, 3, 4)
      const d4 = p.derivative().derivative().derivative().derivative()
      expect(d4).toBeInstanceOf(Polynomial0)
      expect(d4.eval(0)).toBe(0)
    })
  })

  describe("base class eval (Horner)", () => {
    it("matches specialized eval for degree 2", () => {
      const p = Polynomial.from([3, -2, 5]) // 3 - 2x + 5x^2
      const base = new Polynomial([3, -2, 5])
      for (const x of [-2, -1, 0, 1, 2, 10]) {
        expect(base.eval(x)).toBe(p.eval(x))
      }
    })
  })
})

// ---------------------------------------------------------------------------
// Sle (System of Linear Equations)
// ---------------------------------------------------------------------------

describe("Sle", () => {
  it("solves 2x2 system", () => {
    // 2x + y = 5
    // x + 3y = 7
    // Solution: x = 8/5 = 1.6, y = 9/5 = 1.8
    const sle = new Sle(2)
    // A is stored transposed: A[col][row]
    sle.A[0][0] = 2 // col 0, row 0
    sle.A[0][1] = 1 // col 0, row 1
    sle.A[1][0] = 1 // col 1, row 0
    sle.A[1][1] = 3 // col 1, row 1
    sle.y[0] = 5
    sle.y[1] = 7

    const x = sle.solve()
    expect(x[0]).toBeCloseTo(1.6, 10)
    expect(x[1]).toBeCloseTo(1.8, 10)
  })

  it("solves 3x3 system", () => {
    // x + y + z = 6
    // 2x + 3y + z = 14
    // x + y + 3z = 12
    // Solution: x = -2, y = 5, z = 3
    const sle = new Sle(3)
    // Column 0 (coefficients of x)
    sle.A[0][0] = 1
    sle.A[0][1] = 2
    sle.A[0][2] = 1
    // Column 1 (coefficients of y)
    sle.A[1][0] = 1
    sle.A[1][1] = 3
    sle.A[1][2] = 1
    // Column 2 (coefficients of z)
    sle.A[2][0] = 1
    sle.A[2][1] = 1
    sle.A[2][2] = 3
    // RHS
    sle.y[0] = 6
    sle.y[1] = 14
    sle.y[2] = 12

    const x = sle.solve()
    expect(x[0]).toBeCloseTo(-2, 10)
    expect(x[1]).toBeCloseTo(5, 10)
    expect(x[2]).toBeCloseTo(3, 10)
  })

  it("solves identity matrix system", () => {
    const sle = new Sle(3)
    sle.A[0][0] = 1
    sle.A[1][1] = 1
    sle.A[2][2] = 1
    sle.y[0] = 7
    sle.y[1] = 11
    sle.y[2] = 13

    const x = sle.solve()
    expect(x[0]).toBeCloseTo(7, 10)
    expect(x[1]).toBeCloseTo(11, 10)
    expect(x[2]).toBeCloseTo(13, 10)
  })
})

// ---------------------------------------------------------------------------
// Regression
// ---------------------------------------------------------------------------

describe("Regression", () => {
  describe("linearRegression", () => {
    it("fits a perfect line y = 2x + 1", () => {
      const vx = new Vector([0, 1, 2, 3, 4])
      const vy = new Vector([1, 3, 5, 7, 9])
      const p = linearRegression(vx, vy)
      expect(p).toBeInstanceOf(Polynomial1)
      expect(p.coef[0]).toBeCloseTo(1, 10) // intercept
      expect(p.coef[1]).toBeCloseTo(2, 10) // slope
    })

    it("throws on mismatched vector lengths", () => {
      const vx = new Vector([1, 2, 3])
      const vy = new Vector([1, 2])
      expect(() => linearRegression(vx, vy)).toThrow()
    })

    it("throws on empty vectors", () => {
      const vx = new Vector()
      const vy = new Vector()
      expect(() => linearRegression(vx, vy)).toThrow()
    })
  })

  describe("polynomialRegression", () => {
    it("fits a perfect parabola y = 1 + 2x + 3x^2", () => {
      const xs = [-2, -1, 0, 1, 2, 3]
      const vx = new Vector(xs)
      const vy = new Vector(xs.map((x) => 1 + 2 * x + 3 * x * x))
      const p = polynomialRegression(vx, vy, 2)
      expect(p.coef[0]).toBeCloseTo(1, 5)
      expect(p.coef[1]).toBeCloseTo(2, 5)
      expect(p.coef[2]).toBeCloseTo(3, 5)
    })

    it("delegates degree 1 to linearRegression", () => {
      const vx = new Vector([0, 1, 2])
      const vy = new Vector([3, 5, 7]) // y = 3 + 2x
      const p = polynomialRegression(vx, vy, 1)
      expect(p.coef[0]).toBeCloseTo(3, 10)
      expect(p.coef[1]).toBeCloseTo(2, 10)
    })

    it("throws on mismatched vector lengths", () => {
      const vx = new Vector([1, 2, 3])
      const vy = new Vector([1, 2])
      expect(() => polynomialRegression(vx, vy, 2)).toThrow()
    })

    it("throws on empty vectors", () => {
      const vx = new Vector()
      const vy = new Vector()
      expect(() => polynomialRegression(vx, vy, 2)).toThrow()
    })
  })

  describe("r2", () => {
    it("returns 1.0 for a perfect linear fit", () => {
      const vx = new Vector([0, 1, 2, 3, 4])
      const vy = new Vector([1, 3, 5, 7, 9])
      const p = linearRegression(vx, vy)
      expect(r2(vx, vy, p)).toBeCloseTo(1, 10)
    })

    it("returns 1.0 for a perfect quadratic fit", () => {
      const xs = [0, 1, 2, 3, 4]
      const vx = new Vector(xs)
      const vy = new Vector(xs.map((x) => 2 + x + x * x))
      const p = polynomialRegression(vx, vy, 2)
      expect(r2(vx, vy, p)).toBeCloseTo(1, 5)
    })

    it("returns value close to 0 for uncorrelated data", () => {
      // y-values unrelated to x
      const vx = new Vector([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const vy = new Vector([5, 5, 5, 5, 5, 5, 5, 5, 5, 100])
      const model = Polynomial.from([0, 1]) // y = x, poor fit
      const score = r2(vx, vy, model)
      expect(score).toBeLessThan(0.5)
    })

    it("throws on mismatched vector lengths", () => {
      const vx = new Vector([1, 2])
      const vy = new Vector([1])
      const model = Polynomial.from([0, 1])
      expect(() => r2(vx, vy, model)).toThrow()
    })

    it("throws on empty vectors", () => {
      const vx = new Vector()
      const vy = new Vector()
      const model = Polynomial.from([1])
      expect(() => r2(vx, vy, model)).toThrow()
    })
  })
})
