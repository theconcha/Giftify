import { supabase } from './supabase'

function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, nth: number): Date {
  const date = new Date(year, month - 1, 1)
  let count = 0
  while (count < nth) {
    if (date.getDay() === dayOfWeek) count++
    if (count < nth) date.setDate(date.getDate() + 1)
  }
  return date
}

function getEasterDate(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function pad(n: number) { return String(n).padStart(2, '0') }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function getHolidayDate(
  name: string,
  year: number,
  anchorMonth: number | null,
  anchorDay: number | null
): string | null {
  switch (name) {
    case "Mother's Day":   return toISO(getNthWeekdayOfMonth(year, 5, 0, 2))   // 2nd Sunday of May
    case "Father's Day":   return toISO(getNthWeekdayOfMonth(year, 6, 0, 3))   // 3rd Sunday of June
    case 'Thanksgiving':   return toISO(getNthWeekdayOfMonth(year, 11, 4, 4))  // 4th Thursday of November
    case 'Easter':         return toISO(getEasterDate(year))
    default:
      if (!anchorMonth || !anchorDay) return null
      return `${year}-${pad(anchorMonth)}-${pad(anchorDay)}`
  }
}

export async function ensureSystemOccasions(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .eq('is_system', true)
    .not('anchor_month', 'is', null)
    .not('anchor_day', 'is', null)

  if (!holidays?.length) return

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1]
  const holidayIds = holidays.map(h => h.id)

  const { data: existing } = await supabase
    .from('occasions')
    .select('holiday_id, date')
    .eq('user_id', user.id)
    .in('holiday_id', holidayIds)

  const toCreate: object[] = []

  for (const holiday of holidays) {
    for (const year of years) {
      const dateStr = getHolidayDate(holiday.name, year, holiday.anchor_month, holiday.anchor_day)
      if (!dateStr) continue

      const alreadyExists = existing?.some(
        e => e.holiday_id === holiday.id && e.date === dateStr
      )

      if (!alreadyExists) {
        toCreate.push({
          user_id: user.id,
          holiday_id: holiday.id,
          name: `${holiday.name} ${year}`,
          date: dateStr,
          notes: null,
        })
      }
    }
  }

  if (toCreate.length > 0) {
    await supabase.from('occasions').insert(toCreate)
  }
}
