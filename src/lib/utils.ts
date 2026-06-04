import { MONTH_SHORT } from './constants'

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${MONTH_SHORT[month - 1]} ${day}, ${year}`
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function isUpcoming(dateStr: string, withinDays = 90): boolean {
  const days = daysUntil(dateStr)
  return days >= 0 && days <= withinDays
}

export function daysUntilLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 0) return `${Math.abs(days)} days ago`
  return `In ${days} days`
}

export function formatAnchorDate(month: number | null, day: number | null): string {
  if (!month && !day) return 'Date varies'
  if (month && day) return `${MONTH_SHORT[month - 1]} ${day}`
  return 'Date varies'
}
