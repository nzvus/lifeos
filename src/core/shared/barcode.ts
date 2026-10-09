/**
 * core/shared/barcode.ts — is this a product barcode? (GTIN: EAN-8, UPC-A,
 * EAN-13, GTIN-14). Pure.
 *
 * The last digit is a check digit (GS1: from the right, digits weigh 3, 1,
 * 3, 1, …; the total plus the check digit is a multiple of 10). A camera
 * that misreads one bar gives a code that fails it, so a scan is accepted
 * only when the check passes (2026-10-09: "the barcode scan doesn't work").
 */

/** True for 8, 12, 13 or 14 digits whose check digit is right. */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((total, d, i) => total + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Accepts a code only after it was read `needed` times in a row (reads
 * that fail the check digit are noise and skipped), so one
 * blurred frame can't pick the wrong product. Feed it every read; it
 * returns the code once confirmed, else null.
 */
export function confirmReads(needed = 2): (code: string) => string | null {
  let last: string | null = null;
  let count = 0;
  return (code) => {
    if (!isValidGtin(code)) return null;
    count = code === last ? count + 1 : 1;
    last = code;
    return count >= needed ? code : null;
  };
}
