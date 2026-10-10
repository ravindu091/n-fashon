import { describe, it, expect } from 'vitest'
import { arrayToCSV } from '@/utils/csv'

describe('CSV Export Security (CWE-1236 Formula Injection)', () => {
  it('neutralizes malicious cells starting with formula trigger characters', () => {
    const dangerousData = [
      { name: '=cmd|’ /C calc’!A0', price: 100 },
      { name: '+10+20', price: 200 },
      { name: '-SUM(A1:A10)', price: 300 },
      { name: '@malicious', price: 400 },
      { name: 'Normal Shirt', price: 500 },
    ]

    const headers = [
      { label: 'Garment Name', key: 'name' },
      { label: 'Price', key: 'price' },
    ]

    const csv = arrayToCSV(headers, dangerousData)

    // Formula triggers must be prefixed with a single quote inside the quoted cell
    expect(csv).toContain("\"'=cmd|’ /C calc’!A0\"")
    expect(csv).toContain("\"'+10+20\"")
    expect(csv).toContain("\"'-SUM(A1:A10)\"")
    expect(csv).toContain("\"'@malicious\"")
    expect(csv).toContain('"Normal Shirt"')
  })
})
