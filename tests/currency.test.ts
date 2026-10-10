import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  safeDivide,
  calcGrossMargin,
} from '@/utils/currency'

describe('Financial & Currency Utilities', () => {
  it('formats currency in LKR correctly', () => {
    const formatted = formatCurrency(2500, 'LKR', 'en-LK')
    expect(formatted).toContain('2,500.00')
  })

  it('safely handles zero division without returning NaN or Infinity', () => {
    expect(safeDivide(100, 0)).toBe(0)
    expect(safeDivide(0, 0)).toBe(0)
    expect(safeDivide(50, 10)).toBe(5)
  })

  it('calculates gross margin percentage correctly and zero-safely', () => {
    // 5000 revenue - 3000 COGS = 2000 gross profit -> 40% margin
    expect(calcGrossMargin(5000, 3000)).toBe(40)

    // Zero revenue should return 0, never NaN
    expect(calcGrossMargin(0, 0)).toBe(0)

    // Negative profit (selling below cost)
    expect(calcGrossMargin(1000, 1500)).toBe(-50)
  })

  it('formats percentage correctly', () => {
    expect(formatPercent(45.67)).toBe('45.7%')
    expect(formatPercent(NaN)).toBe('N/A')
    expect(formatPercent(Infinity)).toBe('N/A')
  })
})
