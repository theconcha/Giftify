import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { OccasionWithDetails } from '../../types'
import { daysUntilLabel, daysUntil } from '../../lib/utils'

interface Props {
  occasions: OccasionWithDetails[]
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const gridStart = new Date(firstDay)
  gridStart.setDate(1 - firstDay.getDay())

  const days: { date: Date; isCurrentMonth: boolean }[] = []
  const cursor = new Date(gridStart)

  while (cursor <= lastDay || days.length % 7 !== 0) {
    days.push({ date: new Date(cursor), isCurrentMonth: cursor.getMonth() === month })
    cursor.setDate(cursor.getDate() + 1)
    if (days.length > 42) break
  }
  return days
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function OccasionCalendar({ occasions, currentMonth, onPrevMonth, onNextMonth }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const days = getCalendarDays(year, month)
  const today = toISO(new Date())

  const byDate: Record<string, OccasionWithDetails[]> = {}
  for (const occ of occasions) {
    if (!byDate[occ.date]) byDate[occ.date] = []
    byDate[occ.date].push(occ)
  }

  const selectedOccasions = selectedDate ? (byDate[selectedDate] ?? []) : []

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0E8E0] transition-colors text-[#2D2420]"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-bold text-[#2D2420]">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0E8E0] transition-colors text-[#2D2420]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-[#8B7355] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#E8E0D8] rounded-xl overflow-hidden border border-[#E8E0D8]">
        {days.map(({ date, isCurrentMonth }, i) => {
          const iso = toISO(date)
          const dayOccasions = byDate[iso] ?? []
          const isToday = iso === today
          const isSelected = iso === selectedDate

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(isSelected ? null : iso)}
              className={`bg-[#FAF6F1] min-h-[52px] md:min-h-[100px] p-1 flex flex-col cursor-pointer transition-colors ${
                isSelected ? 'bg-[#FDF0EB]' : 'hover:bg-[#F8F3EE]'
              } ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              {/* Day number */}
              <div className="flex justify-center md:justify-start mb-0.5">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-[#C2714F] text-white' : 'text-[#2D2420]'
                }`}>
                  {date.getDate()}
                </span>
              </div>

              {/* Mobile: dots only */}
              <div className="flex md:hidden gap-0.5 flex-wrap justify-center mt-0.5">
                {dayOccasions.slice(0, 3).map((_, idx) => (
                  <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#C2714F]" />
                ))}
                {dayOccasions.length > 3 && (
                  <span className="text-[9px] text-[#C2714F] font-bold leading-none">
                    +{dayOccasions.length - 3}
                  </span>
                )}
              </div>

              {/* Desktop: occasion name chips */}
              <div className="hidden md:flex flex-col gap-0.5 w-full">
                {dayOccasions.slice(0, 3).map(occ => (
                  <Link
                    key={occ.id}
                    to={`/occasions/${occ.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] font-semibold bg-[#FDF0EB] text-[#C2714F] px-1.5 py-0.5 rounded truncate block leading-tight hover:bg-[#F5D5C5] transition-colors"
                  >
                    {occ.name}
                  </Link>
                ))}
                {dayOccasions.length > 3 && (
                  <span className="text-[10px] text-[#8B7355] font-semibold px-1">
                    +{dayOccasions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected day detail — shown on all screen sizes */}
      {selectedDate && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </p>
          {selectedOccasions.length === 0 ? (
            <p className="text-sm text-[#8B7355]">No occasions on this day.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
              {selectedOccasions.map(occ => {
                const days = daysUntil(occ.date)
                const upcoming = days >= 0 && days <= 90
                return (
                  <Link
                    key={occ.id}
                    to={`/occasions/${occ.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F3EE] transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-[#2D2420] text-sm">{occ.name}</p>
                      {occ.holiday && (
                        <p className="text-xs text-[#8B7355]">{occ.holiday.name}</p>
                      )}
                    </div>
                    {upcoming && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                        days <= 7 ? 'bg-[#FDF0EB] text-[#C2714F]' : 'bg-[#F0E8E0] text-[#8B7355]'
                      }`}>
                        {daysUntilLabel(days)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
