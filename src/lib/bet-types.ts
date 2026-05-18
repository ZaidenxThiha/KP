// Pure number generators for the 2D betting modes. Every function returns an
// array of 2-digit strings ("00".."99"); callers dedupe against the current
// selection. Kept side-effect free so it is trivial to unit test.

// Every 2-digit number, "00".."99".
export function all2d(): string[] {
  return Array.from({ length: 100 }, (_, n) => String(n).padStart(2, '0'));
}

// "ခွေ" (box): from a string of digits, every ordered 2-digit pair formed by
// two different positions. "123" -> 12,13,21,23,31,32 ; "112" -> 11,12,21.
export function boxPermutations(input: string): string[] {
  const digits = input.replace(/[^0-9]/g, '').split('');
  const out = new Set<string>();
  for (let i = 0; i < digits.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      if (i !== j) out.add(digits[i] + digits[j]);
    }
  }
  return Array.from(out).sort();
}

// "ပတ်လည်" (reverse): the reversed number of each input ("12" -> "21").
export function reversedOf(numbers: string[]): string[] {
  return numbers.map((n) => n.split('').reverse().join(''));
}

// "အပူး" (twins): 00,11,22,...,99.
export function twins(): string[] {
  return Array.from({ length: 10 }, (_, d) => `${d}${d}`);
}

// "စုံ" (even) / "မ" (odd) — by the value's parity.
export function evens(): string[] {
  return all2d().filter((n) => Number(n) % 2 === 0);
}
export function odds(): string[] {
  return all2d().filter((n) => Number(n) % 2 === 1);
}

// "ထိပ်" — the ten numbers led by digit d: d0,d1,...,d9.
export function byHeadDigit(d: number): string[] {
  return Array.from({ length: 10 }, (_, i) => `${d}${i}`);
}

// "ပိတ်" — the ten numbers ending in digit d: 0d,1d,...,9d.
export function byTailDigit(d: number): string[] {
  return Array.from({ length: 10 }, (_, i) => `${i}${d}`);
}
