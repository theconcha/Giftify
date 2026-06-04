import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Settings, List } from 'lucide-react'
import type { OccasionWithDetails } from '../types'
import { fetchOccasions } from '../lib/occasions'
import { ensureSystemOccasions } from '../lib/ensureOccasions'
import { daysUntil, daysUntilLabel } from '../lib/utils'
import OccasionForm from '../components/occasions/OccasionForm'
import OccasionCalendar from '../components/occasions/OccasionCalendar'

const PER_PAGE = 20

export default function Occasions() {
  const [occasions, setOccasions] = useState<OccasionWithDetails[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const getCalendarRange = (month: Date) => {
    const year = month.getFullYear()
    const m = month.getMonth()
    // Include a buffer for days shown from adjacent months
    const start = new Date(year, m, 1)
    start.setDate(1 - start.getDay())
    const end = new Date(year, m + 1, 0)
    const endCopy = new Date(end)
    const remaining = 6 - endCopy.getDay()
    endCopy.setDate(endCopy.getDate() + remaining)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: endCopy.toISOString().split('T')[0],
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    await ensureSystemOccasions()

    if (view === 'calendar') {
      const { startDate, endDate } = getCalendarRange(currentMonth)
      const { data, error } = await fetchOccasions({ startDate, endDate })
      if (!error) setOccasions((data as unknown as OccasionWithDetails[]) ?? [])
    } else {
      const { data, count, error } = await fetchOccasions({ upcomingOnly, page, perPage: PER_PAGE })
      if (!error) {
        setOccasions((data as unknown as OccasionWithDetails[]) ?? [])
        setCount(count ?? 0)
      }
    }
    setLoading(false)
  }, [upcomingOnly, page, view, currentMonth])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [upcomingOnly, view])

  const totalPages = Math.ceil(count / PER_PAGE)

  const handlePrevMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#2D2420]">Occasions</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/settings?tab=holidays"
            state={{ from: '/occasions' }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-[#E8E0D8] text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
          >
            <Settings size={15} /> Manage Holidays
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
          >
            <Plus size={16} /> Add occasion
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3">
        {/* Upcoming toggle — only shown in list view */}
        {view === 'list' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUpcomingOnly(false)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                !upcomingOnly ? 'bg-[#C2714F] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setUpcomingOnly(true)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                upcomingOnly ? 'bg-[#C2714F] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'
              }`}
            >
              Upcoming
            </button>
          </div>
        ) : (
          <div /> /* spacer */
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[#F0E8E0] rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white text-[#C2714F] shadow-sm' : 'text-[#8B7355]'}`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`p-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-white text-[#C2714F] shadow-sm' : 'text-[#8B7355]'}`}
            aria-label="Calendar view"
          >
            <Calendar size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
        ) : view === 'calendar' ? (
          <OccasionCalendar
            occasions={occasions}
            currentMonth={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        ) : occasions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0E8E0] flex items-center justify-center mb-4">
              <Calendar size={28} className="text-[#C2714F]" />
            </div>
            <p className="font-bold text-[#2D2420]">
              {upcomingOnly ? 'No upcoming occasions' : 'No occasions yet'}
            </p>
            <p className="text-sm text-[#8B7355] mt-1">
              {upcomingOnly ? 'Nothing in the next 90 days.' : 'Add occasions to track gift-giving events.'}
            </p>
            {!upcomingOnly && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
              >
                Add your first occasion
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
            {occasions.map(occasion => {
              const days = daysUntil(occasion.date)
              const isUpcoming = days >= 0 && days <= 90

              return (
                <Link
                  key={occasion.id}
                  to={`/occasions/${occasion.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors border-b border-[#E8E0D8] last:border-0"
                >
                  <div className="w-12 text-center shrink-0">
                    <p className="text-xs font-semibold text-[#8B7355] uppercase">
                      {new Date(occasion.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                    </p>
                    <p className="text-xl font-extrabold text-[#2D2420] leading-none">
                      {new Date(occasion.date + 'T00:00:00').getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D2420] text-sm truncate">{occasion.name}</p>
                    <p className="text-xs text-[#8B7355] truncate">
                      {(occasion as any).occasion_people?.length > 0
                        ? (occasion as any).occasion_people.map((op: any) => op.person?.first_name).filter(Boolean).join(', ')
                        : 'No recipients'}
                      {occasion.holiday && ` · ${occasion.holiday.name}`}
                    </p>
                  </div>
                  {isUpcoming && (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
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

      {/* Pagination — list view only */}
      {view === 'list' && totalPages > 1 && (
        <div className="px-4 py-4 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#E8E0D8] text-[#8B7355] disabled:opacity-40 hover:bg-[#F0E8E0] transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                p === page ? 'bg-[#C2714F] text-white' : 'border border-[#E8E0D8] text-[#8B7355] hover:bg-[#F0E8E0]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#E8E0D8] text-[#8B7355] disabled:opacity-40 hover:bg-[#F0E8E0] transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <OccasionForm
          onSave={() => { setShowForm(false); load() }}
          onClose={() => setShowForm(false)}
        />
      )}

    </div>
  )
}
