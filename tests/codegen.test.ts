import { describe, it, expect } from 'vitest'
import { getCategoryPrefix, generateVariantCode } from '@/services/codegen.service'

describe('Item Coding System', () => {
  it('maps categories to standard uppercase 3-letter prefixes', () => {
    expect(getCategoryPrefix('T-Shirts')).toBe('TSH')
    expect(getCategoryPrefix('Shirts')).toBe('SHT')
    expect(getCategoryPrefix('Trousers')).toBe('TRS')
    expect(getCategoryPrefix('Jeans')).toBe('JNS')
    expect(getCategoryPrefix('Dresses')).toBe('DRS')
    expect(getCategoryPrefix('Hoodies')).toBe('HDY')
    expect(getCategoryPrefix('Jackets')).toBe('JKT')
    expect(getCategoryPrefix('Shorts')).toBe('SHR')
  })

  it('generates normalized variant codes following PRODUCT-COLOR-SIZE', async () => {
    const code1 = await generateVariantCode('TSH-0001', 'Black', 'M')
    expect(code1).toBe('TSH-0001-BLA-M')

    const code2 = await generateVariantCode('DRS-0002', 'Navy Blue', 'Free Size')
    expect(code2).toBe('DRS-0002-NAV-FREE')

    const code3 = await generateVariantCode('JNS-0010', 'Light Blue', 'XL')
    expect(code3).toBe('JNS-0010-LIG-XL')
  })
})
