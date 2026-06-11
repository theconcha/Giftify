import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Package, Gift, ChevronRight, CalendarPlus, BookOpen } from 'lucide-react'
import type { OccasionWithDetails, GiftWithDetails } from '../types'
import { fetchOccasions } from '../lib/occasions'
import { fetchGifts } from '../lib/gifts'
import { ensureSystemOccasions } from '../lib/ensureOccasions'
import { daysUntil, daysUntilLabel, formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import PersonAvatar from '../components/people/PersonAvatar'

export default function Home() {
  const [upcomingOccasions, setUpcomingOccasions] = useState<OccasionWithDetails[]>([])
  const [plannedGifts, setPlannedGifts] = useState<GiftWithDetails[]>([])
  const [recentGifts, setRecentGifts] = useState<GiftWithDetails[]>([])
  const [peopleGiftedCount, setPeopleGiftedCount] = useState(0)
  const [giftsGivenCount, setGiftsGivenCount] = useState(0)
  const [giftsPlannedCount, setGiftsPlannedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await ensureSystemOccasions()

      const [occasionsRes, plannedRes, givenRes, peopleRes, productsRes, giftedRecipientsRes, givenCountRes, plannedCountRes] = await Promise.all([
        fetchOccasions({ tab: 'upcoming', perPage: 5 }),
        fetchGifts({ status: 'planned', perPage: 3 }),
        fetchGifts({ status: 'given', perPage: 5 }),
        supabase.from('people').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('gift_recipients').select('person_id, gifts!inner(status)').eq('gifts.status', 'given'),
        supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('status', 'given'),
        supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('status', 'planned'),
      ])

      const pCount = peopleRes.count ?? 0
      const prCount = productsRes.count ?? 0
      const giftedPeople = new Set((giftedRecipientsRes.data ?? []).map((r: any) => r.person_id))

      setUpcomingOccasions((occasionsRes.data as unknown as OccasionWithDetails[]) ?? [])
      setPlannedGifts((plannedRes.data as unknown as GiftWithDetails[]) ?? [])
      setRecentGifts((givenRes.data as unknown as GiftWithDetails[]) ?? [])
      setPeopleGiftedCount(giftedPeople.size)
      setGiftsGivenCount(givenCountRes.count ?? 0)
      setGiftsPlannedCount(plannedCountRes.count ?? 0)
      setIsEmpty(pCount === 0 && prCount === 0)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full py-16 text-[#8B7355] text-sm">
        Loading…
      </div>
    )
  }

  // ── First-time empty state ────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-16 text-center">
        <div className="text-5xl mb-4">🎁</div>
        <h1 className="text-2xl font-extrabold text-[#2D2420] mb-2">Welcome to Giftify</h1>
        <p className="text-[#8B7355] mb-8 max-w-xs">
          Your thoughtful gift tracker. Start by adding the people you love to give to.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/people"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#C2714F] text-white font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors">
            <Users size={18} /> Add the people you love
          </Link>
          <Link to="/products"
            className="flex items-center justify-center gap-2 py-3 px-4 border border-[#E8E0D8] text-[#2D2420] font-semibold rounded-xl hover:bg-[#F0E8E0] transition-colors">
            <Package size={18} /> Add a product to your library
          </Link>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-4 space-y-6 pb-8">

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/people"
          className="bg-white rounded-2xl border border-[#E8E0D8] p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#FDF0EB] flex items-center justify-center shrink-0">
            <Users size={20} className="text-[#C2714F]" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#2D2420] leading-none">{peopleGiftedCount}</p>
            <p className="text-xs text-[#8B7355] mt-0.5">{peopleGiftedCount === 1 ? 'Person received a gift' : 'People received a gift'}</p>
          </div>
        </Link>
        <Link to="/gifts"
          className="bg-white rounded-2xl border border-[#E8E0D8] p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#F0F4F0] flex items-center justify-center shrink-0">
            <Gift size={20} className="text-[#7A9E7E]" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#2D2420] leading-none">{giftsGivenCount}</p>
            <p className="text-xs text-[#8B7355] mt-0.5">{giftsGivenCount === 1 ? 'Gift given' : 'Gifts given'}</p>
          </div>
        </Link>
        <Link to="/gifts"
          className="bg-white rounded-2xl border border-[#E8E0D8] p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#F8F3EE] flex items-center justify-center shrink-0">
            <CalendarPlus size={20} className="text-[#8B7355]" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#2D2420] leading-none">{giftsPlannedCount}</p>
            <p className="text-xs text-[#8B7355] mt-0.5">{giftsPlannedCount === 1 ? 'Gift planned' : 'Gifts planned'}</p>
          </div>
        </Link>
      </div>

      {/* Lists + quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Left column: gift & occasion lists */}
        <div className="order-2 sm:order-1 sm:col-span-2 space-y-6">

          {/* Planned gifts — only shown if any exist */}
          {plannedGifts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-[#2D2420]">Gifts to give</h2>
                <Link to="/gifts" className="text-xs text-[#7A9E7E] font-semibold flex items-center gap-0.5 hover:underline">
                  View all <ChevronRight size={13} />
                </Link>
              </div>
              <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8] overflow-hidden">
                {plannedGifts.map(gift => {
                  const recipients = gift.gift_recipients?.map(r => r.person).filter(Boolean) ?? []
                  const days = gift.planned_date ? daysUntil(gift.planned_date) : null
                  return (
                    <Link key={gift.id} to={`/gifts/${gift.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#EDF4EE] flex items-center justify-center shrink-0">
                        <CalendarPlus size={15} className="text-[#7A9E7E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2D2420] text-sm truncate">{gift.name}</p>
                        <p className="text-xs text-[#8B7355] truncate">
                          {recipients.map((p: any) => p.first_name).join(', ') || 'No recipients'}
                          {gift.occasion && ` · ${gift.occasion.name}`}
                        </p>
                      </div>
                      {days !== null && (
                        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                          days <= 7 ? 'bg-[#FDF0EB] text-[#C2714F]' : 'bg-[#EDF4EE] text-[#7A9E7E]'
                        }`}>
                          {daysUntilLabel(days)}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Upcoming occasions */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-[#2D2420]">Upcoming occasions</h2>
              <Link to="/occasions" className="text-xs text-[#C2714F] font-semibold flex items-center gap-0.5 hover:underline">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            {upcomingOccasions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-6 text-center">
                <p className="text-sm text-[#8B7355]">No upcoming occasions in the next 90 days.</p>
                <Link to="/occasions" className="text-sm text-[#C2714F] font-semibold hover:underline mt-1 block">
                  View all occasions →
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8] overflow-hidden">
                {upcomingOccasions.map(occasion => {
                  const days = daysUntil(occasion.date)
                  return (
                    <Link key={occasion.id} to={`/occasions/${occasion.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
                      <div className="w-10 text-center shrink-0">
                        <p className="text-[10px] font-semibold text-[#8B7355] uppercase">
                          {new Date(occasion.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                        </p>
                        <p className="text-lg font-extrabold text-[#2D2420] leading-none">
                          {new Date(occasion.date + 'T00:00:00').getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2D2420] text-sm truncate">{occasion.name}</p>
                        <p className="text-xs text-[#8B7355] truncate">
                          {(occasion as any).occasion_people?.length > 0
                            ? (occasion as any).occasion_people.map((op: any) => op.person?.first_name).filter(Boolean).join(', ')
                            : occasion.holiday?.name ?? 'No recipients'}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                        days <= 7 ? 'bg-[#FDF0EB] text-[#C2714F]' : 'bg-[#F0E8E0] text-[#8B7355]'
                      }`}>
                        {daysUntilLabel(days)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Recent gifts given */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-[#2D2420]">Recent gifts given</h2>
              <Link to="/gifts" className="text-xs text-[#C2714F] font-semibold flex items-center gap-0.5 hover:underline">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            {recentGifts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-6 text-center">
                <p className="text-sm text-[#8B7355]">No gifts recorded yet.</p>
                <Link to="/gifts" className="text-sm text-[#C2714F] font-semibold hover:underline mt-1 block">
                  Log your first gift →
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8] overflow-hidden">
                {recentGifts.map(gift => {
                  const recipients = gift.gift_recipients?.map(r => r.person).filter(Boolean) ?? []
                  return (
                    <Link key={gift.id} to={`/gifts/${gift.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
                      <div className="flex -space-x-2 shrink-0">
                        {recipients.slice(0, 2).map((p: any) => (
                          <div key={p.id} className="ring-2 ring-white rounded-full">
                            <PersonAvatar person={p} size={30} />
                          </div>
                        ))}
                        {recipients.length === 0 && (
                          <div className="w-8 h-8 rounded-full bg-[#F0E8E0] flex items-center justify-center">
                            <Gift size={14} className="text-[#C2714F]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2D2420] text-sm truncate">{gift.name}</p>
                        <p className="text-xs text-[#8B7355] truncate">
                          {recipients.map((p: any) => p.first_name).join(', ') || 'No recipients'}
                          {gift.occasion && ` · ${gift.occasion.name}`}
                        </p>
                      </div>
                      <span className="text-xs text-[#8B7355] shrink-0">{formatDate(gift.date_given)}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right column: quick actions */}
        <div className="order-1 sm:order-2 sm:col-span-1 flex flex-col">
          <h2 className="font-bold text-[#2D2420] mb-2">Quick actions</h2>
          <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8] overflow-hidden flex-1">
            <Link to="/gifts"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#FDF0EB] flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-[#C2714F]" />
              </div>
              <span className="flex-1 font-semibold text-[#2D2420] text-sm">Log a gift</span>
              <ChevronRight size={16} className="text-[#8B7355] shrink-0" />
            </Link>
            <Link to="/gifts"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#F0F4F0] flex items-center justify-center shrink-0">
                <CalendarPlus size={16} className="text-[#7A9E7E]" />
              </div>
              <span className="flex-1 font-semibold text-[#2D2420] text-sm">Plan a gift</span>
              <ChevronRight size={16} className="text-[#8B7355] shrink-0" />
            </Link>
            <Link to="/people"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#F8F3EE] flex items-center justify-center shrink-0">
                <Users size={16} className="text-[#8B7355]" />
              </div>
              <span className="flex-1 font-semibold text-[#2D2420] text-sm">Add a person</span>
              <ChevronRight size={16} className="text-[#8B7355] shrink-0" />
            </Link>
            <Link to="/products"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#F8F3EE] flex items-center justify-center shrink-0">
                <Package size={16} className="text-[#8B7355]" />
              </div>
              <span className="flex-1 font-semibold text-[#2D2420] text-sm">Add a product</span>
              <ChevronRight size={16} className="text-[#8B7355] shrink-0" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  )
}
