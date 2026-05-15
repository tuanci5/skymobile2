/**
 * Formats a number with a plus sign if positive, or in parentheses if negative.
 * Used for financial reports.
 */
export function fmt(n: number) {
  if (n === 0) return '0';
  if (n < 0) return `(${Math.abs(n).toLocaleString('vi-VN')})`;
  return `+${n.toLocaleString('vi-VN')}`;
}

/**
 * Formats a number using Vietnamese locale.
 */
export function fmtPos(n: number) {
  return n.toLocaleString('vi-VN');
}
