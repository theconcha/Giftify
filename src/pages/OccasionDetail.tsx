import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Calendar, Plus } from 'lucide-react'
import type { OccasionWithDetails, GiftWithDetails } from '../types'
import { fetchOccasion, deleteOccasion } from '../lib/occasions'
import { fetchGiftsByOccasion } from '../lib/gifts'
import { formatDate, daysUntil, daysUntilLabel } from '../lib/utils'
import PersonAvatar from '../components/people/PersonAvatar'
import OccasionForm from '../components/occasions/OccasionForm'
import GiftForm from '../components/gifts/GiftForm'

export default function OccasionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [occasion, setOccasion] = useState<OccasionWithDetails | null>(null)
  const [gifts, setGifts] = useState<GiftWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showGiftForm, setShowGiftForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const [occasionRes, giftsRes] = await Promise.all([
      fetchOccasion(id),
      fetchGiftsByOccasion(id),
    ])
    if (occasionRes.error || !occasionRes.data) navigate('/occasions')
    else {
      setOccasion(occasionRes.data as unknown as OccasionWithDetails)
      setGifts((giftsRes.data as unknown as GiftWithDetails[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!occasion) return
    await deleteOccasion(occasion.id)
    navigate('/occasions')
  }

  const days = occasion ? daysUntil(occasion.date) : null
  const isUpcoming = days !== null && days >= 0

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
  )

  if (!occasion) return null

  const recipients = occasion.occasion_people?.map((op: any) => op.person).filter(Boolean) ?? []

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back nav */}
      <div className="px-4 pt-4 pb-2">
        <Link to="/occasions" className="inline-flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors">
          <ArrowLeft size={16} /> Occasions
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-[#2D2420] leading-tight">{occasion.name}</h1>
            <p className="text-[#8B7355] mt-1">{formatDate(occasion.date)}</p>
            {isUpcoming && days !== null && (
              <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
                days <= 7 ? 'bg-[#FDF0EB] text-[#C2714F]' : 'bg-[#F0E8E0] text-[#8B7355]'
              }`}>
                {daysUntilLabel(days)}
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F0E8E0] flex items-center justify-center shrink-0">
            <Calendar size={22} className="text-[#C2714F]" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-[#E8E0D8] text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
        >
          <Pencil size={15} /> Edit
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>

      {/* Details */}
      <div className="mx-4 bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
        {occasion.holiday && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0">Holiday</span>
            <Link
              to="/settings?tab=holidays"
              className="text-sm text-[#C2714F] hover:underline"
            >
              {occasion.holiday.name}
            </Link>
          </div>
        )}
        {occasion.notes && (
          <div className="px-4 py-3">
            <span className="text-xs font-semibold text-[#8B7355] block mb-1">Notes</span>
            <p className="text-sm text-[#2D2420]">{occasion.notes}</p>
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="mx-4 mt-4">
        <h2 className="text-base font-bold text-[#2D2420] mb-3">
          Recipients {recipients.length > 0 && `(${recipients.length})`}
        </h2>
        {recipients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-6 text-center">
            <p className="text-sm text-[#8B7355]">No recipients added.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
            {recipients.map((person: any) => (
              <Link
                key={person.id}
                to={`/people/${person.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors"
              >
                <PersonAvatar person={person} size={36} />
                <span className="text-sm font-semibold text-[#2D2420]">
                  {person.first_name} {person.last_name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Gifts */}
      <div className="mx-4 mt-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#2D2420]">
            Gifts {gifts.length > 0 && `(${gifts.length})`}
          </h2>
          <button onClick={() => setShowGiftForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[#C2714F] hover:underline">
            <Plus size={13} /> Record gift
          </button>
        </div>
        {gifts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-8 text-center">
            <p className="text-sm text-[#8B7355]">No gifts recorded for this occasion yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
            {gifts.map(gift => {
              const recipients = (gift as any).gift_recipients?.map((r: any) => r.person).filter(Boolean) ?? []
              return (
                <Link key={gift.id} to={`/gifts/${gift.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D2420] text-sm truncate">{gift.name}</p>
                    <p className="text-xs text-[#8B7355] truncate">
                      {recipients.map((p: any) => p.first_name).join(', ') || 'No recipients'}
                    </p>
                  </div>
                  <span className="text-xs text-[#8B7355] shrink-0">{formatDate(gift.date_given)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {showGiftForm && occasion && (
        <GiftForm
          onSave={() => { setShowGiftForm(false); load() }}
          onClose={() => setShowGiftForm(false)}
        />
      )}

      {showEdit && (
        <OccasionForm
          occasion={occasion}
          onSave={() => { setShowEdit(false); load() }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-[#2D2420] text-base mb-2">Delete this occasion?</h3>
            <p className="text-sm text-[#8B7355] mb-5">This will permanently delete the occasion and all associated gift records. This can't be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
