export class Polynomial {
  readonly coef: readonly number[]
  readonly degree: number

  constructor(coef: readonly number[]) {
    this.coef = coef
    this.degree = coef.length - 1
  }

  static from(coef: readonly number[]): Polynomial {
    coef = trimZeros(coef)
    switch (coef.length) {
      case 0:
        throw new Error()
      case 1:
        return new Polynomial0(coef[0])
      case 2:
        return new Polynomial1(coef[0], coef[1])
      case 3:
        return new Polynomial2(coef[0], coef[1], coef[2])
      case 4:
        return new Polynomial3(coef[0], coef[1], coef[2], coef[3])
      default:
        return new PolynomialN(coef)
    }
  }

  eval(x: number): number {
    const { coef } = this
    const { length } = coef
    let y = 0
    for (let i = length - 1; i > 0; i--) {
      y = (y + coef[i]) * x
    }
    return y + coef[0]
  }

  derivative(): Polynomial {
    const { coef } = this
    const { length } = coef
    if (length <= 1) {
      return new Polynomial0(0)
    }
    const derivativeCoef = new Array<number>(length - 1)
    for (let i = 1; i < length; i++) {
      derivativeCoef[i - 1] = coef[i] * i
    }
    return Polynomial.from(derivativeCoef)
  }
}

export class Polynomial0 extends Polynomial {
  readonly y: number

  constructor(y: number) {
    super([y])
    this.y = y
  }

  eval(_x: number): number {
    return this.y
  }

  derivative(): Polynomial {
    return new Polynomial0(0)
  }
}

export class Polynomial1 extends Polynomial {
  readonly a: number
  readonly b: number

  constructor(a: number, b: number) {
    super([a, b])
    this.a = a
    this.b = b
  }

  eval(x: number): number {
    return this.a + this.b * x
  }

  derivative(): Polynomial {
    return new Polynomial0(this.b)
  }
}

export class Polynomial2 extends Polynomial {
  readonly a: number
  readonly b: number
  readonly c: number

  constructor(a: number, b: number, c: number) {
    super([a, b, c])
    this.a = a
    this.b = b
    this.c = c
  }

  eval(x: number): number {
    return this.a + this.b * x + this.c * x * x
  }

  derivative(): Polynomial {
    return new Polynomial1(this.b, this.c * 2)
  }
}

export class Polynomial3 extends Polynomial {
  readonly a: number
  readonly b: number
  readonly c: number
  readonly d: number

  constructor(a: number, b: number, c: number, d: number) {
    super([a, b, c, d])
    this.a = a
    this.b = b
    this.c = c
    this.d = d
  }

  eval(x: number): number {
    return this.a + this.b * x + this.c * x * x + this.d * x * x * x
  }

  derivative(): Polynomial {
    return new Polynomial2(this.b, this.c * 2, this.d * 3)
  }
}

export class PolynomialN extends Polynomial {
  constructor(coef: readonly number[]) {
    super(coef)
  }

  eval(x: number): number {
    const { coef } = this
    const { length } = coef
    let y = 0
    for (let i = length - 1; i > 0; i--) {
      y = (y + coef[i]) * x
    }
    return y + coef[0]
  }

  derivative(): Polynomial {
    const { coef } = this
    const { length } = coef
    const derivativeCoef = new Array<number>(length - 1)
    for (let i = 1; i < length; i++) {
      derivativeCoef[i - 1] = coef[i] * i
    }
    return Polynomial.from(derivativeCoef)
  }
}

function trimZeros(coef: readonly number[]): number[] {
  let i = coef.length
  while (i > 1 && coef[i - 1] === 0) {
    i = i - 1
  }
  return coef.slice(0, i)
}
