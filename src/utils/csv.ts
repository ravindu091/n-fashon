/**
 * Convert array of records to CSV string.
 * Prevents formula injection (CSV Injection / CWE-1236) by escaping cells
 * starting with =, +, -, @, \t, \r with a leading single quote or space.
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  headers: { label: string; key: keyof T | string }[],
  data: T[]
): string {
  const sanitizeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""'
    let str = String(val).trim()

    // Formula injection guard
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`
    }

    // Escape double quotes
    str = str.replace(/"/g, '""')
    return `"${str}"`
  }

  const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',')

  const dataRows = data.map((row) => {
    return headers
      .map((h) => {
        const val = (row as Record<string, unknown>)[h.key as string]
        return sanitizeCell(val)
      })
      .join(',')
  })

  return [headerRow, ...dataRows].join('\r\n')
}
