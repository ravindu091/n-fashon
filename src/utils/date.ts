import { format, formatDistanceToNow, isValid } from 'date-fns'

export function formatDate(date: Date | string | number | undefined, formatStr = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  const d = new Date(date)
  if (!isValid(d)) return '-'
  return format(d, formatStr)
}

export function formatDateTime(date: Date | string | number | undefined, formatStr = 'dd/MM/yyyy HH:mm'): string {
  if (!date) return '-'
  const d = new Date(date)
  if (!isValid(d)) return '-'
  return format(d, formatStr)
}

export function formatRelative(date: Date | string | number | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (!isValid(d)) return '-'
  return formatDistanceToNow(d, { addSuffix: true })
}
