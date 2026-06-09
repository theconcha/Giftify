import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Package, CheckCircle } from 'lucide-react'
import type { GiftWithDetails } from '../types'
import { fetchGift, deleteGift, markAsGiven } from '../lib/gifts'
import { formatDate } from '../lib/utils'
import PersonAvatar from '../components/people/PersonAvatar'
import GiftForm from '../components/gifts/GiftForm'

export default function GiftDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [gift, setGift] = useState<GiftWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmGiven, setConfirmGiven] = useState(false)
  const [givenDate, setGivenDate] = useState(new Date().toISOString().split('T')[0])
  const [markingGiven, setMarkingGiven] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await fetchGift(id)
    if (error || !data) navigate('/gifts')
    else setGift(data as unknown as GiftWithDetails)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!gift) return
    await deleteGift(gift.id)
    navigate('/gifts')
  }

  const handleMarkAsGiven = async () => {
    if (!gift) return
    setMarkingGiven(true)
    await markAsGiven(gift.id, givenDate)
    setMarkingGiven(false)
    setConfirmGiven(false)
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
  if (!gift) return null

  const recipients = gift.gift_recipients?.map(r => r.person).filter(Boolean) ?? []
  const isPlanned = gift.status === 'planned'
  const displayDate = isPlanned
    ? (gift.planned_date ? formatDate(gift.planned_date) : 'Date TBD')
    : (gift.date_given ? formatDate(gift.date_given) : '')

  return (
    <div className="max-w-2xl mx-auto">

      <div className="px-4 pt-4 pb-2">
        <Link to="/gifts" className="inline-flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors">
          <ArrowLeft size={16} /> Gifts
        </Link>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-[#2D2420] leading-tight">{gift.name}</h1>
            <p className="text-[#8B7355] mt-1 text-sm">{displayDate}</p>
          </div>
          {isPlanned && (
            <span className="shrink-0 text-xs font-semibold bg-[#EDF4EE] text-[#7A9E7E] px-2.5 py-1 rounded-full mt-1">
              Planned
            </span>
          )}
        </div>
      </div>

      {/* Mark as given — prominent for planned gifts */}
      {isPlanned && (
        <div className="mx-4 mb-4 p-4 bg-[#EDF4EE] rounded-2xl border border-[#C8D8C8]">
          <p className="text-sm text-[#4A6B4A] font-semibold mb-2">Have you given this gift?</p>
          <button onClick={() => setConfirmGiven(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7A9E7E] text-white text-sm font-semibold rounded-xl hover:bg-[#5C8060] transition-colors">
            <CheckCircle size={16} /> Mark as given ✓
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-[#E8E0D8] text-[#2D2420] hover:bg-[#F0E8E0] transition-colors">
          <Pencil size={15} /> Edit
        </button>
        <button onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors ml-auto">
          <Trash2 size={15} /> Delete
        </button>
      </div>

      {/* Gift details */}
      <div className="mx-4 bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0">Gift</span>
          {gift.product ? (
            <Link to={`/products/${gift.product.id}`} className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 rounded-lg bg-[#F8F3EE] flex items-center justify-center overflow-hidden shrink-0">
                {gift.product.photo_url
                  ? <img src={gift.product.photo_url} alt={gift.product.name} className="w-full h-full object-contain" />
                  : <Package size={14} className="text-[#C2714F] opacity-40" />}
              </div>
              <span className="text-sm text-[#C2714F] hover:underline">{gift.product.name}</span>
            </Link>
          ) : (
            <span className="text-sm text-[#2D2420]">{gift.free_text ?? (isPlanned ? 'To be decided' : '—')}</span>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-3">
          <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0">Occasion</span>
          {gift.occasion ? (
            <Link to={`/occasions/${gift.occasion.id}`} className="text-sm text-[#C2714F] hover:underline">
              {gift.occasion.name}
            </Link>
          ) : (
            <span className="text-sm text-[#2D2420]">—</span>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-3">
          <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0">
            {isPlanned ? 'Planned for' : 'Date given'}
          </span>
          <span className="text-sm text-[#2D2420]">{displayDate}</span>
        </div>

        {gift.message && (
          <div className="px-4 py-3">
            <span className="text-xs font-semibold text-[#8B7355] block mb-1">Note</span>
            <p className="text-sm text-[#2D2420]">{gift.message}</p>
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="mx-4 mt-4 mb-8">
        <h2 className="text-base font-bold text-[#2D2420] mb-3">
          Recipients {recipients.length > 0 && `(${recipients.length})`}
        </h2>
        {recipients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-6 text-center">
            <p className="text-sm text-[#8B7355]">No recipients recorded.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
            {recipients.map((person: any) => (
              <Link key={person.id} to={`/people/${person.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors">
                <PersonAvatar person={person} size={36} />
                <span className="text-sm font-semibold text-[#2D2420]">{person.first_name} {person.last_name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <GiftForm
          mode={isPlanned ? 'plan' : 'log'}
          gift={gift}
          onSave={() => { setShowEdit(false); load() }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Mark as given confirmation */}
      {confirmGiven && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmGiven(false)} />
          <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-[#2D2420] text-base mb-2">When did you give this?</h3>
            <input type="date" value={givenDate} onChange={e => setGivenDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#7A9E7E] mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setConfirmGiven(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors">
                Cancel
              </button>
              <button onClick={handleMarkAsGiven} disabled={markingGiven}
                className="flex-1 py-2.5 rounded-xl bg-[#7A9E7E] text-white text-sm font-semibold hover:bg-[#5C8060] transition-colors disabled:opacity-60">
                {markingGiven ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-[#2D2420] text-base mb-2">Delete this gift?</h3>
            <p className="text-sm text-[#8B7355] mb-5">This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
