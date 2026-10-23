/** Small statistics for E6. */
export function median(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** Least-squares slope of y over x; null with fewer than two distinct x. */
export function slope(points: readonly { x: number; y: number }[]): number | null {
  if (points.length < 2) return null;
  const mx = points.reduce((a, p) => a + p.x, 0) / points.length;
  const my = points.reduce((a, p) => a + p.y, 0) / points.length;
  const sxx = points.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  if (sxx === 0) return null;
  return points.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / sxx;
}

/**
 * Least squares of y on one or two regressors (with an intercept): the
 * coefficients [intercept, b1, b2?] and the residuals' SD (n − k − 1
 * degrees of freedom). Null when the system is singular or too small.
 */
export function ols(
  rows: readonly { y: number; x: readonly number[] }[],
): { coef: number[]; sd: number } | null {
  const k = rows[0]?.x.length ?? 0;
  const p = k + 1;
  if (rows.length <= p) return null;
  // Normal equations: (XᵀX) β = Xᵀy, solved by Gauss–Jordan.
  const a = Array.from({ length: p }, () => new Array<number>(p + 1).fill(0));
  for (const r of rows) {
    const v = [1, ...r.x];
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) a[i]![j]! += v[i]! * v[j]!;
      a[i]![p]! += v[i]! * r.y;
    }
  }
  for (let c = 0; c < p; c++) {
    let pivot = c;
    for (let r = c + 1; r < p; r++)
      if (Math.abs(a[r]![c]!) > Math.abs(a[pivot]![c]!)) pivot = r;
    if (Math.abs(a[pivot]![c]!) < 1e-9) return null;
    [a[c], a[pivot]] = [a[pivot]!, a[c]!];
    for (let r = 0; r < p; r++) {
      if (r === c) continue;
      const f = a[r]![c]! / a[c]![c]!;
      for (let j = c; j <= p; j++) a[r]![j]! -= f * a[c]![j]!;
    }
  }
  const coef = a.map((row, i) => row[p]! / row[i]!);
  const ss = rows.reduce((s, r) => {
    const fit = coef[0]! + r.x.reduce((t, x, i) => t + coef[i + 1]! * x, 0);
    return s + (r.y - fit) ** 2;
  }, 0);
  return { coef, sd: Math.sqrt(ss / (rows.length - p)) };
}
