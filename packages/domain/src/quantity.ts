import { convertUnitStrict, type StandardUnit } from './units';

export class QuantityRangeError extends RangeError {}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

// Exact arithmetic on supplied decimal numbers; conversion to Number is an explicit boundary.
export class Quantity {
  private constructor(private readonly n: bigint, private readonly d: bigint) {}

  private static ratio(n: bigint, d: bigint): Quantity {
    if (d === 0n) throw new QuantityRangeError('Cannot divide by zero');
    if (d < 0n) { n = -n; d = -d; }
    const divisor = gcd(n, d);
    return new Quantity(n / divisor, d / divisor);
  }

  static from(value: number): Quantity {
    if (!Number.isFinite(value)) throw new QuantityRangeError('Quantity must be finite');
    const [mantissa, exponent = '0'] = value.toString().toLowerCase().split('e');
    const decimals = mantissa.split('.')[1]?.length ?? 0;
    const power = Number(exponent) - decimals;
    const numerator = BigInt(mantissa.replace('.', ''));
    return power >= 0
      ? Quantity.ratio(numerator * 10n ** BigInt(power), 1n)
      : Quantity.ratio(numerator, 10n ** BigInt(-power));
  }

  add(other: Quantity): Quantity {
    return Quantity.ratio(this.n * other.d + other.n * this.d, this.d * other.d);
  }
  subtract(other: Quantity): Quantity {
    return Quantity.ratio(this.n * other.d - other.n * this.d, this.d * other.d);
  }
  multiply(other: Quantity): Quantity { return Quantity.ratio(this.n * other.n, this.d * other.d); }
  divide(other: Quantity): Quantity { return Quantity.ratio(this.n * other.d, this.d * other.n); }
  compare(other: Quantity): number {
    const difference = this.n * other.d - other.n * this.d;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }
  min(other: Quantity): Quantity { return this.compare(other) <= 0 ? this : other; }
  isZero(): boolean { return this.n === 0n; }

  toNumber(): number {
    if (this.n === 0n) return 0;
    const negative = this.n < 0n;
    const n = negative ? -this.n : this.n;
    const shift = 20 - (n.toString().length - this.d.toString().length);
    const digits = shift >= 0
      ? (n * 10n ** BigInt(shift)) / this.d
      : n / (this.d * 10n ** BigInt(-shift));
    const result = Number(`${negative ? '-' : ''}${digits}e${-shift}`);
    if (!Number.isFinite(result) || result === 0) {
      throw new QuantityRangeError('Quantity exceeds representable numeric range');
    }
    return result;
  }
}

export function convertQuantity(quantity: Quantity, from: StandardUnit, to: StandardUnit): Quantity {
  return quantity.multiply(Quantity.from(convertUnitStrict(1, from, to)));
}
