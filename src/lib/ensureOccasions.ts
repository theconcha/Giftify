import { supabase } from './supabase'

// ─── Algorithmically calculated holidays ───────────────────────────────────

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

// ─── Hard-coded dates for non-Gregorian holidays (verified from authoritative sources) ──
// Sources:
//   Hanukkah: chabad.org, hebcal.com
//   Passover:  chabad.org, qppstudio.net
//   Diwali:    testbook.com, diwali.info

const VERIFIED_DATES: Record<string, Record<number, string>> = {
  'Hanukkah': {
    2026: '2026-12-04',
    2027: '2027-12-24',
    2028: '2028-12-12',
    2029: '2029-12-01',
    2030: '2030-12-21',
    2031: '2031-12-09',
    2032: '2032-11-28',
    2033: '2033-12-17',
    2034: '2034-12-07',
    2035: '2035-11-26',
  },
  'Passover': {
    2026: '2026-04-01',
    2027: '2027-04-21',
    2028: '2028-04-10',
    2029: '2029-03-30',
    2030: '2030-04-18',
    2031: '2031-04-07',
    2032: '2032-03-26',
    2033: '2033-04-13',
    2034: '2034-04-03',
    2035: '2035-04-23',
  },
  'Diwali': {
    2026: '2026-11-08',
    2027: '2027-10-29',
    2028: '2028-10-17',
    2029: '2029-11-05',
    2030: '2030-10-26',
    2031: '2031-11-14',
    2032: '2032-11-02',
    2033: '2033-10-22',
    2034: '2034-11-10',
    2035: '2035-10-30',
  },
}

// ─── Main date resolver ─────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function getHolidayDate(
  name: string,
  year: number,
  anchorMonth: number | null,
  anchorDay: number | null
): string | null {
  // Use verified hard-coded dates for non-Gregorian holidays
  if (VERIFIED_DATES[name]?.[year]) return VERIFIED_DATES[name][year]

  // Calculate algorithmically for Gregorian-aligned shifting holidays
  switch (name) {
    case "Mother's Day":  return toISO(getNthWeekdayOfMonth(year, 5, 0, 2))
    case "Father's Day":  return toISO(getNthWeekdayOfMonth(year, 6, 0, 3))
    case 'Thanksgiving':  return toISO(getNthWeekdayOfMonth(year, 11, 4, 4))
    case 'Easter':        return toISO(getEasterDate(year))
    default:
      if (!anchorMonth || !anchorDay) return null
      return `${year}-${pad(anchorMonth)}-${pad(anchorDay)}`
  }
}

// ─── Ensure system occasions exist (rolling: one upcoming per holiday) ──────

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentYear = today.getFullYear()
  const holidayIds = holidays.map(h => h.id)

  const { data: existing } = await supabase
    .from('occasions')
    .select('holiday_id, date')
    .eq('user_id', user.id)
    .in('holiday_id', holidayIds)

  const toCreate: object[] = []

  for (const holiday of holidays) {
    // Skip if a future occasion already exists for this holiday
    const hasFutureOccasion = existing?.some(e =>
      e.holiday_id === holiday.id &&
      new Date(e.date + 'T00:00:00') >= today
    )
    if (hasFutureOccasion) continue

    // Calculate this year's date
    const thisYearDate = getHolidayDate(holiday.name, currentYear, holiday.anchor_month, holiday.anchor_day)
    if (!thisYearDate) continue

    // Use this year if it hasn't passed; otherwise use next year
    const thisYearDateObj = new Date(thisYearDate + 'T00:00:00')
    const targetYear = thisYearDateObj >= today ? currentYear : currentYear + 1
    const targetDate = targetYear === currentYear
      ? thisYearDate
      : getHolidayDate(holiday.name, currentYear + 1, holiday.anchor_month, holiday.anchor_day)

    if (!targetDate) continue

    toCreate.push({
      user_id: user.id,
      holiday_id: holiday.id,
      name: `${holiday.name} ${targetYear}`,
      date: targetDate,
      notes: null,
    })
  }

  if (toCreate.length > 0) {
    await supabase.from('occasions').insert(toCreate)
  }
}
