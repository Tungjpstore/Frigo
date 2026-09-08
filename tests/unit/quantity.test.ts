import { describe, expect, it } from 'vitest';
import { convertQuantity, Quantity } from '../../packages/domain/src/quantity';

describe('exact decimal quantity arithmetic', () => {
  it('does not accumulate IEEE decimal subtraction/conversion noise', () => {
    const sum = Quantity.from(0.1).add(Quantity.from(0.2));
    expect(sum.toNumber()).toBe(0.3);
    expect(sum.subtract(Quantity.from(0.3)).isZero()).toBe(true);
    expect(convertQuantity(Quantity.from(0.0001), 'kg', 'g').toNumber()).toBe(0.1);
  });
  it.each([Number.MIN_VALUE, 1e-300, 1e-20, 1, 1e20, 1e300, Number.MAX_VALUE, -0.1, 0])('round-trips representable %s', (value) => {
    expect(Quantity.from(value).toNumber()).toBe(value);
  });
  it('rejects invalid, zero-divisor, underflow and overflow arithmetic explicitly', () => {
    expect(() => Quantity.from(NaN)).toThrow();
    expect(() => Quantity.from(Infinity)).toThrow();
    expect(() => Quantity.from(1).divide(Quantity.from(0))).toThrow();
    expect(() => Quantity.from(Number.MIN_VALUE).divide(Quantity.from(1000)).toNumber()).toThrow();
    expect(() => Quantity.from(1e300).multiply(Quantity.from(1e100)).toNumber()).toThrow();
    expect(() => convertQuantity(Quantity.from(1), 'pack', 'g')).toThrow();
  });
});
