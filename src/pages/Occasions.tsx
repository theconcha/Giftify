import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Settings, List, Info } from 'lucide-react'
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
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const getCalendarRange = (month: Date) => {
    const year = month.getFullYear()
    const m = month.getMonth()
    const start = new Date(year, m, 1)
    start.setDate(1 - start.getDay())
    const end = new Date(year, m + 1, 0)
    const endCopy = new Date(end)
    endCopy.setDate(endCopy.getDate() + (6 - endCopy.getDay()))
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
      const { data, count, error } = await fetchOccasions({ tab, page, perPage: PER_PAGE })
      if (!error) {
        setOccasions((data as unknown as OccasionWithDetails[]) ?? [])
        setCount(count ?? 0)
      }
    }
    setLoading(false)
  }, [tab, page, view, currentMonth])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [tab, view])

  const totalPages = Math.ceil(count / PER_PAGE)

  const handlePrevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="relative flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-[#2D2420]">Occasions</h1>
          <button
            onClick={() => setShowInfo(v => !v)}
            className="text-[#8B7355] hover:text-[#C2714F] transition-colors mt-0.5"
            aria-label="About holiday occasions"
          >
            <Info size={16} />
          </button>
          {showInfo && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowInfo(false)} />
              <div className="absolute top-8 left-0 z-20 w-72 bg-white border border-[#E8E0D8] rounded-xl shadow-lg p-3">
                <p className="text-xs text-[#2D2420] leading-relaxed">
                  Recurring holiday occasions are added automatically. Once a holiday passes, next year's is added for you.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings?tab=holidays"
            state={{ from: '/occasions' }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-[#E8E0D8] text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
          >
            <Settings size={15} /> Manage holidays
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
          >
            <Plus size={16} /> Add occasion
          </button>
        </div>
      </div>

      {/* Tabs + view toggle row */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3">
        {/* Upcoming / Past tabs — only in list view */}
        {view === 'list' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('upcoming')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                tab === 'upcoming' ? 'bg-[#C2714F] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTab('past')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                tab === 'past' ? 'bg-[#C2714F] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'
              }`}
            >
              Past
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* List / Calendar view toggle */}
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
              {tab === 'upcoming' ? 'No upcoming occasions' : 'No past occasions yet'}
            </p>
            <p className="text-sm text-[#8B7355] mt-1">
              {tab === 'upcoming'
                ? 'Add an occasion or check back after holidays are generated.'
                : 'Past occasions will appear here once they pass.'}
            </p>
            {tab === 'upcoming' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
              >
                Add an occasion
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
            {occasions.map(occasion => {
              const days = daysUntil(occasion.date)
              const isUpcoming = days >= 0

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
                    <p className="text-xs text-[#8B7355]">
                      {new Date(occasion.date + 'T00:00:00').getFullYear()}
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
                  {isUpcoming && days <= 90 && (
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

      {/* Pagination */}
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
