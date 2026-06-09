import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarPlus, Gift, List, Calendar as CalIcon } from 'lucide-react'
import type { GiftWithDetails } from '../types'
import { fetchGifts } from '../lib/gifts'
import { formatDate } from '../lib/utils'
import PersonAvatar from '../components/people/PersonAvatar'
import GiftForm from '../components/gifts/GiftForm'
import GiftCalendar from '../components/gifts/GiftCalendar'

const PER_PAGE = 20

export default function Gifts() {
  const [gifts, setGifts] = useState<GiftWithDetails[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'planned' | 'given'>('planned')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [page, setPage] = useState(1)
  const [formMode, setFormMode] = useState<'log' | 'plan' | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const load = useCallback(async () => {
    setLoading(true)
    if (view === 'calendar') {
      // Calendar shows all planned gifts
      const { data, error } = await fetchGifts({ status: 'planned', perPage: 200 })
      if (!error) setGifts((data as unknown as GiftWithDetails[]) ?? [])
    } else {
      const status = tab === 'planned' ? 'planned' : 'given'
      const { data, count, error } = await fetchGifts({ status, page, perPage: PER_PAGE })
      if (!error) {
        setGifts((data as unknown as GiftWithDetails[]) ?? [])
        setCount(count ?? 0)
      }
    }
    setLoading(false)
  }, [tab, page, view, currentMonth])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [tab, view])

  const totalPages = Math.ceil(count / PER_PAGE)

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-[#2D2420]">Gifts</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setFormMode('log')}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E8E0D8] text-[#2D2420] text-sm font-semibold rounded-xl hover:bg-[#F0E8E0] transition-colors">
            <BookOpen size={15} /> Log past gift
          </button>
          <button onClick={() => setFormMode('plan')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7A9E7E] text-white text-sm font-semibold rounded-xl hover:bg-[#5C8060] transition-colors">
            <CalendarPlus size={15} /> Plan future gift
          </button>
        </div>
      </div>

      {/* Tabs + view toggle */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3">
        {view === 'list' ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('planned')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === 'planned' ? 'bg-[#7A9E7E] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'}`}>
              Upcoming
            </button>
            <button onClick={() => setTab('given')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === 'given' ? 'bg-[#C2714F] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'}`}>
              Given
            </button>
          </div>
        ) : <div />}

        <div className="flex items-center gap-1 bg-[#F0E8E0] rounded-lg p-1">
          <button onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white text-[#C2714F] shadow-sm' : 'text-[#8B7355]'}`}
            aria-label="List view"><List size={16} /></button>
          <button onClick={() => setView('calendar')}
            className={`p-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-white text-[#C2714F] shadow-sm' : 'text-[#8B7355]'}`}
            aria-label="Calendar view"><CalIcon size={16} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
        ) : view === 'calendar' ? (
          <GiftCalendar
            gifts={gifts}
            currentMonth={currentMonth}
            onPrevMonth={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            onNextMonth={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          />
        ) : gifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0E8E0] flex items-center justify-center mb-4">
              <Gift size={28} className="text-[#C2714F]" />
            </div>
            <p className="font-bold text-[#2D2420]">
              {tab === 'planned' ? 'No planned gifts yet' : 'No gifts recorded yet'}
            </p>
            <p className="text-sm text-[#8B7355] mt-1">
              {tab === 'planned'
                ? 'Plan ahead by clicking "Plan future gift" above.'
                : 'Log gifts you\'ve given by clicking "Log past gift" above.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
            {gifts.map(gift => {
              const recipients = gift.gift_recipients?.map(r => r.person).filter(Boolean) ?? []
              const dateLabel = gift.status === 'planned'
                ? (gift.planned_date ? formatDate(gift.planned_date) : 'Date TBD')
                : (gift.date_given ? formatDate(gift.date_given) : '')
              return (
                <Link key={gift.id} to={`/gifts/${gift.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors border-b border-[#E8E0D8] last:border-0">
                  <div className="flex -space-x-2 shrink-0">
                    {recipients.slice(0, 3).map((p: any) => (
                      <div key={p.id} className="ring-2 ring-white rounded-full">
                        <PersonAvatar person={p} size={32} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#2D2420] text-sm truncate">{gift.name}</p>
                      {gift.status === 'planned' && (
                        <span className="shrink-0 text-[10px] font-semibold bg-[#EDF4EE] text-[#7A9E7E] px-1.5 py-0.5 rounded-full">Planned</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8B7355] truncate">
                      {recipients.map((p: any) => p.first_name).join(', ') || 'No recipients'}
                      {gift.occasion && ` · ${gift.occasion.name}`}
                    </p>
                  </div>
                  <span className="text-xs text-[#8B7355] shrink-0">{dateLabel}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && view === 'list' && (
        <div className="px-4 py-4 flex items-center justify-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#E8E0D8] text-[#8B7355] disabled:opacity-40 hover:bg-[#F0E8E0] transition-colors">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-[#C2714F] text-white' : 'border border-[#E8E0D8] text-[#8B7355] hover:bg-[#F0E8E0]'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#E8E0D8] text-[#8B7355] disabled:opacity-40 hover:bg-[#F0E8E0] transition-colors">Next</button>
        </div>
      )}

      {formMode && (
        <GiftForm
          key={formMode}
          mode={formMode}
          onSave={() => { setFormMode(null); load() }}
          onClose={() => setFormMode(null)}
        />
      )}
    </div>
  )
}
