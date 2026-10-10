import { describe, it, expect } from 'vitest'

interface MockBatch {
  batchCode: string
  landedUnitCost: number
  remainingQty: number
  receivedDate: Date
}

function simulateFifoAllocation(batches: MockBatch[], qtyNeeded: number) {
  // Sort oldest first (FIFO)
  const sorted = [...batches].sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime())

  const allocations: { batchCode: string; qty: number; unitCost: number; lineCOGS: number }[] = []
  let remaining = qtyNeeded

  for (const b of sorted) {
    if (remaining <= 0) break
    const take = Math.min(remaining, b.remainingQty)
    if (take > 0) {
      allocations.push({
        batchCode: b.batchCode,
        qty: take,
        unitCost: b.landedUnitCost,
        lineCOGS: take * b.landedUnitCost,
      })
      remaining -= take
    }
  }

  if (remaining > 0) {
    throw new Error('Insufficient stock for FIFO allocation')
  }

  return allocations
}

describe('FIFO Batch Costing Algorithm', () => {
  it('allocates strictly from the oldest batch first when multiple batches exist at different costs', () => {
    const batches: MockBatch[] = [
      {
        batchCode: 'BAT-20261001-0001',
        landedUnitCost: 680, // LKR 680
        remainingQty: 4,
        receivedDate: new Date('2026-10-01'),
      },
      {
        batchCode: 'BAT-20261010-0001',
        landedUnitCost: 740, // LKR 740 (higher price due to fabric cost increase)
        remainingQty: 15,
        receivedDate: new Date('2026-10-10'),
      },
    ]

    // Customer buys 6 pieces: 4 pieces from Batch A @ 680, 2 pieces from Batch B @ 740
    const alloc = simulateFifoAllocation(batches, 6)

    expect(alloc).toHaveLength(2)
    expect(alloc[0].batchCode).toBe('BAT-20261001-0001')
    expect(alloc[0].qty).toBe(4)
    expect(alloc[0].unitCost).toBe(680)
    expect(alloc[0].lineCOGS).toBe(2720)

    expect(alloc[1].batchCode).toBe('BAT-20261010-0001')
    expect(alloc[1].qty).toBe(2)
    expect(alloc[1].unitCost).toBe(740)
    expect(alloc[1].lineCOGS).toBe(1480)

    const totalCOGS = alloc[0].lineCOGS + alloc[1].lineCOGS
    expect(totalCOGS).toBe(4200)

    // Selling price: 1500 per piece * 6 = 9000
    const revenue = 9000
    const grossProfit = revenue - totalCOGS
    expect(grossProfit).toBe(4800)

    const margin = (grossProfit / revenue) * 100
    expect(Math.round(margin * 10) / 10).toBe(53.3)
  })

  it('throws error when total requested quantity exceeds available batches', () => {
    const batches: MockBatch[] = [
      {
        batchCode: 'BAT-1',
        landedUnitCost: 500,
        remainingQty: 3,
        receivedDate: new Date('2026-10-01'),
      },
    ]

    expect(() => simulateFifoAllocation(batches, 10)).toThrow('Insufficient stock for FIFO allocation')
  })
})
