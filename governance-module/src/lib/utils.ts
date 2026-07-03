/** Fisher–Yates shuffle (returns a new array; stable input). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Convert a Western integer to Arabic-Indic digits. */
export function toArabicDigits(n: number): string {
  return String(n)
    .split('')
    .map((c) => (/\d/.test(c) ? arabicIndic[Number(c)] : c))
    .join('');
}
