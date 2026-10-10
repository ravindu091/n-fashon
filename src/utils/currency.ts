// Currency formatting utility
export function formatCurrency(
  amount: number,
  currency: string = process.env.NEXT_PUBLIC_CURRENCY ?? 'LKR',
  locale: string = process.env.NEXT_PUBLIC_LOCALE ?? 'en-LK'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value)) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

// Safe division — returns 0 when denominator is 0 or NaN
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || !isFinite(denominator)) return 0
  return numerator / denominator
}

export function calcGrossMargin(revenue: number, cogs: number): number {
  return safeDivide((revenue - cogs) * 100, revenue)
}
