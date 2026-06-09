import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { GiftWithDetails } from '../../types'

interface Props {
  gifts: GiftWithDetails[]
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

export default function GiftCalendar({ gifts, currentMonth, onPrevMonth, onNextMonth }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const days = getCalendarDays(year, month)
  const today = toISO(new Date())

  // Group planned gifts by planned_date
  const byDate: Record<string, GiftWithDetails[]> = {}
  for (const gift of gifts) {
    const dateKey = gift.planned_date
    if (!dateKey) continue
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(gift)
  }

  const selectedGifts = selectedDate ? (byDate[selectedDate] ?? []) : []

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0E8E0] transition-colors text-[#2D2420]">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-bold text-[#2D2420]">{MONTH_NAMES[month]} {year}</h2>
        <button onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0E8E0] transition-colors text-[#2D2420]">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-[#8B7355] py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[#E8E0D8] rounded-xl overflow-hidden border border-[#E8E0D8]">
        {days.map(({ date, isCurrentMonth }, i) => {
          const iso = toISO(date)
          const dayGifts = byDate[iso] ?? []
          const isToday = iso === today
          const isSelected = iso === selectedDate

          return (
            <div key={i} onClick={() => setSelectedDate(isSelected ? null : iso)}
              className={`bg-[#FAF6F1] min-h-[52px] md:min-h-[100px] p-1 flex flex-col cursor-pointer transition-colors ${isSelected ? 'bg-[#EDF4EE]' : 'hover:bg-[#F8F3EE]'} ${!isCurrentMonth ? 'opacity-40' : ''}`}>
              <div className="flex justify-center md:justify-start mb-0.5">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#7A9E7E] text-white' : 'text-[#2D2420]'}`}>
                  {date.getDate()}
                </span>
              </div>
              {/* Mobile: dots */}
              <div className="flex md:hidden gap-0.5 flex-wrap justify-center mt-0.5">
                {dayGifts.slice(0, 3).map((_, idx) => (
                  <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#7A9E7E]" />
                ))}
                {dayGifts.length > 3 && <span className="text-[9px] text-[#7A9E7E] font-bold">+{dayGifts.length - 3}</span>}
              </div>
              {/* Desktop: name chips */}
              <div className="hidden md:flex flex-col gap-0.5 w-full">
                {dayGifts.slice(0, 3).map(gift => (
                  <Link key={gift.id} to={`/gifts/${gift.id}`} onClick={e => e.stopPropagation()}
                    className="text-[10px] font-semibold bg-[#EDF4EE] text-[#7A9E7E] px-1.5 py-0.5 rounded truncate block leading-tight hover:bg-[#D4E8D4] transition-colors">
                    {gift.name}
                  </Link>
                ))}
                {dayGifts.length > 3 && <span className="text-[10px] text-[#8B7355] px-1">+{dayGifts.length - 3} more</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedGifts.length === 0 ? (
            <p className="text-sm text-[#8B7355]">No planned gifts on this day.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
              {selectedGifts.map(gift => {
                const recipients = gift.gift_recipients?.map(r => r.person).filter(Boolean) ?? []
                return (
                  <Link key={gift.id} to={`/gifts/${gift.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
                    <div>
                      <p className="font-semibold text-[#2D2420] text-sm">{gift.name}</p>
                      <p className="text-xs text-[#8B7355]">
                        {recipients.map((p: any) => p.first_name).join(', ') || 'No recipients'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-[#EDF4EE] text-[#7A9E7E] px-2 py-1 rounded-full shrink-0 ml-2">Planned</span>
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
