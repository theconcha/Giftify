import { useState, useEffect, useRef } from 'react'
import { X, Search, Package, ChevronLeft, Plus } from 'lucide-react'
import type { GiftWithDetails, Person, Product, Occasion } from '../../types'
import { createGift, updateGift } from '../../lib/gifts'
import { fetchPeople } from '../../lib/people'
import { fetchProducts } from '../../lib/products'
import { fetchOccasions, createOccasion } from '../../lib/occasions'
import PersonAvatar from '../people/PersonAvatar'
import { formatDate } from '../../lib/utils'

// ─── Inline occasion step ────────────────────────────────────────────────────

interface OccasionStepProps {
  isLog: boolean
  today: string
  search: string
  setSearch: (v: string) => void
  filteredOccasions: any[]
  selectedOccasion: Occasion | null
  setSelectedOccasion: (o: Occasion | null) => void
  onOccasionCreated: (o: Occasion) => void
  inputClass: string
}

function OccasionStep({
  isLog, today, search, setSearch, filteredOccasions,
  selectedOccasion, setSelectedOccasion, onOccasionCreated, inputClass,
}: OccasionStepProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll to selected occasion whenever it changes
  useEffect(() => {
    if (selectedOccasion && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${selectedOccasion.id}"]`)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedOccasion?.id])

  const handleCreate = async () => {
    if (!newName.trim() || !newDate) return
    setDateError(null)
    if (isLog && newDate > today) {
      setDateError('Date must be today or in the past for a logged gift.')
      return
    }
    if (!isLog && newDate < today) {
      setDateError('Date must be today or in the future for a planned gift.')
      return
    }
    setSaving(true)
    const { data, error } = await createOccasion(
      { name: newName.trim(), date: newDate, holiday_id: null, notes: null },
      []
    )
    setSaving(false)
    if (error || !data) return
    onOccasionCreated(data as unknown as Occasion)
    setShowCreate(false)
    setNewName('')
    setNewDate('')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8B7355]">Select the occasion for this gift.</p>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search occasions…" className={inputClass + ' pl-9'} />
      </div>

      {/* Inline create form — shown above list */}
      {showCreate ? (
        <div className="bg-[#F8F3EE] rounded-xl p-3 space-y-2 border border-[#E8E0D8]">
          <p className="text-xs font-semibold text-[#2D2420]">New occasion</p>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Occasion name" className={inputClass} autoFocus />
          <input
            type="date"
            value={newDate}
            onChange={e => { setNewDate(e.target.value); setDateError(null) }}
            max={isLog ? today : undefined}
            min={!isLog ? today : undefined}
            className={inputClass}
          />
          {dateError && (
            <p className="text-xs text-red-500 font-medium">{dateError}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCreate(false)}
              className="flex-1 py-2 rounded-xl border border-[#E8E0D8] text-xs font-semibold text-[#2D2420] hover:bg-white transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!newName.trim() || !newDate || saving}
              className="flex-1 py-2 rounded-xl bg-[#C2714F] text-white text-xs font-semibold hover:bg-[#A85E3E] transition-colors disabled:opacity-40">
              {saving ? 'Saving…' : 'Create & select'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#C2714F] hover:underline">
          <Plus size={14} /> Add occasion
        </button>
      )}

      {/* Occasions list */}
      <div ref={listRef} className="rounded-xl border border-[#E8E0D8] bg-white divide-y divide-[#E8E0D8] max-h-56 overflow-y-auto">
        {filteredOccasions.length === 0 && (
          <p className="px-3 py-3 text-sm text-[#8B7355] italic">No occasions found.</p>
        )}
        {filteredOccasions.map((occ: any) => (
          <button key={occ.id} data-id={occ.id} onClick={() => setSelectedOccasion(occ)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F8F3EE] transition-colors ${selectedOccasion?.id === occ.id ? 'bg-[#FDF0EB]' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D2420] truncate">{occ.name}</p>
              <p className="text-xs text-[#8B7355]">{formatDate(occ.date)}</p>
            </div>
            {selectedOccasion?.id === occ.id && <span className="text-[#C2714F] font-bold">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

interface Props {
  mode?: 'log' | 'plan'
  gift?: GiftWithDetails | null
  prefillPersonId?: string
  prefillProductId?: string
  onSave: () => void
  onClose: () => void
}

const STEPS = ['Recipients', 'Gift', 'Occasion', 'Details', 'Note']

export default function GiftForm({
  mode = 'log',
  gift,
  prefillPersonId,
  prefillProductId,
  onSave,
  onClose,
}: Props) {
  const isLog = mode === 'log'
  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState(1)
  const [recipientIds, setRecipientIds] = useState<string[]>(
    gift?.recipients?.map(p => p.id) ?? (prefillPersonId ? [prefillPersonId] : [])
  )
  const [giftMode, setGiftMode] = useState<'product' | 'freetext' | 'skip'>(
    gift?.free_text ? 'freetext' : 'product'
  )
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(gift?.product ?? null)
  const [freeText, setFreeText] = useState(gift?.free_text ?? '')
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(gift?.occasion ?? null)
  const [form, setForm] = useState({
    name: gift?.name ?? '',
    date: gift ? (isLog ? (gift.date_given ?? today) : (gift.planned_date ?? today)) : today,
    message: gift?.message ?? '',
  })

  const [people, setPeople] = useState<Person[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPeople({ perPage: 200 }).then(({ data }) => setPeople(data ?? []))
    fetchProducts({ perPage: 200 }).then(({ data }) => setProducts(data ?? []))
    fetchOccasions({ tab: isLog ? 'past' : 'upcoming', perPage: 100 }).then(({ data }) => setOccasions((data as any) ?? []))
    if (prefillProductId) {
      fetchProducts({ perPage: 200 }).then(({ data }) => {
        const p = data?.find(p => p.id === prefillProductId)
        if (p) { setSelectedProduct(p); setGiftMode('product') }
      })
    }
  }, [])

  // Auto-suggest gift name
  useEffect(() => {
    if (gift?.name) return
    const productName = giftMode === 'product' ? selectedProduct?.name : (giftMode === 'freetext' ? freeText : null)
    const firstName = people.find(p => recipientIds[0] === p.id)?.first_name
    if (productName && firstName && recipientIds.length === 1) {
      setForm(f => ({ ...f, name: `${productName} for ${firstName}` }))
    } else if (productName) {
      setForm(f => ({ ...f, name: productName }))
    } else if (firstName && !productName) {
      setForm(f => ({ ...f, name: `Gift for ${firstName}` }))
    }
  }, [selectedProduct, freeText, recipientIds, giftMode, people])

  // Auto-fill date from occasion for plan mode
  useEffect(() => {
    if (!isLog && selectedOccasion?.date) {
      setForm(f => ({ ...f, date: selectedOccasion!.date }))
    }
  }, [selectedOccasion, isLog])

  const toggleRecipient = (id: string) =>
    setRecipientIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const filteredPeople = people.filter(p =>
    !p.is_archived && (!search || `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredProducts = products.filter(p =>
    !p.is_archived && (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredOccasions = (occasions as any[]).filter((o: any) =>
    !search || o.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const data = {
      name: form.name.trim() || `Gift for ${people.find(p => recipientIds[0] === p.id)?.first_name ?? 'recipient'}`,
      product_id: giftMode === 'product' ? (selectedProduct?.id ?? null) : null,
      free_text: giftMode === 'freetext' ? (freeText.trim() || null) : null,
      occasion_id: selectedOccasion?.id ?? null,
      status: isLog ? 'given' as const : 'planned' as const,
      date_given: isLog ? form.date : null,
      planned_date: !isLog ? form.date : null,
      message: form.message.trim() || null,
      custom_photo_url: gift?.custom_photo_url ?? null,
    }
    const { error } = gift
      ? await updateGift(gift.id, data, recipientIds)
      : await createGift(data, recipientIds)
    setLoading(false)
    if (error) return setError(error.message)
    onSave()
  }

  const canAdvance = () => {
    if (step === 1) return recipientIds.length > 0
    if (step === 3) return !!selectedOccasion
    return true
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#C2714F] transition-colors'
  const title = gift ? (isLog ? 'Edit gift' : 'Edit planned gift') : (isLog ? 'Log past gift' : 'Plan future gift')
  const accentColor = isLog ? 'bg-[#C2714F] hover:bg-[#A85E3E]' : 'bg-[#7A9E7E] hover:bg-[#5C8060]'
  const dateLabel = isLog ? 'Date given' : 'Planned date'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#FAF6F1] rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D8]">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => { setStep(s => s - 1); setSearch('') }} className="text-[#8B7355] hover:text-[#2D2420]">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-[#2D2420] text-base">{title}</h2>
              <p className="text-xs text-[#8B7355]">{STEPS[step - 1]} · Step {step} of {STEPS.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8B7355] hover:text-[#2D2420]"><X size={20} /></button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-5 pt-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? (isLog ? 'bg-[#C2714F]' : 'bg-[#7A9E7E]') : 'bg-[#E8E0D8]'}`} />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Step 1: Recipients */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[#8B7355]">
                {isLog ? 'Who did you give this to?' : 'Who are you planning to give this to?'}
              </p>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search people…" className={inputClass + ' pl-9'} />
              </div>
              <div className="rounded-xl border border-[#E8E0D8] bg-white divide-y divide-[#E8E0D8] max-h-64 overflow-y-auto">
                {filteredPeople.map(person => (
                  <label key={person.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F8F3EE]">
                    <input type="checkbox" checked={recipientIds.includes(person.id)}
                      onChange={() => toggleRecipient(person.id)} className="accent-[#C2714F]" />
                    <PersonAvatar person={person} size={30} />
                    <span className="text-sm text-[#2D2420]">{person.first_name} {person.last_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Gift */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setGiftMode('product')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${giftMode === 'product' ? (isLog ? 'bg-[#C2714F] text-white' : 'bg-[#7A9E7E] text-white') : 'bg-[#F0E8E0] text-[#8B7355]'}`}>
                  From library
                </button>
                <button onClick={() => setGiftMode('freetext')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${giftMode === 'freetext' ? (isLog ? 'bg-[#C2714F] text-white' : 'bg-[#7A9E7E] text-white') : 'bg-[#F0E8E0] text-[#8B7355]'}`}>
                  Free text
                </button>
                {!isLog && (
                  <button onClick={() => setGiftMode('skip')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${giftMode === 'skip' ? 'bg-[#7A9E7E] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'}`}>
                    Decide later
                  </button>
                )}
              </div>

              {giftMode === 'product' && (
                <>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search products…" className={inputClass + ' pl-9'} />
                  </div>
                  <div className="rounded-xl border border-[#E8E0D8] bg-white divide-y divide-[#E8E0D8] max-h-64 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button key={product.id} onClick={() => setSelectedProduct(product)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F8F3EE] transition-colors ${selectedProduct?.id === product.id ? 'bg-[#FDF0EB]' : ''}`}>
                        <div className="w-10 h-10 rounded-lg bg-[#F8F3EE] flex items-center justify-center shrink-0 overflow-hidden">
                          {product.photo_url
                            ? <img src={product.photo_url} alt={product.name} className="w-full h-full object-contain" />
                            : <Package size={16} className="text-[#C2714F] opacity-40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2D2420] truncate">{product.name}</p>
                          {product.price != null && <p className="text-xs text-[#C2714F]">${product.price.toFixed(2)}</p>}
                        </div>
                        {selectedProduct?.id === product.id && <span className="text-[#C2714F] font-bold text-lg">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {giftMode === 'freetext' && (
                <div>
                  <p className="text-sm text-[#8B7355] mb-2">Describe the gift (e.g. "$50 cash", "Amazon gift card")</p>
                  <input type="text" value={freeText} onChange={e => setFreeText(e.target.value)}
                    placeholder="e.g. $50 cash" className={inputClass} autoFocus />
                </div>
              )}

              {giftMode === 'skip' && (
                <div className="bg-[#F0F4F0] rounded-xl px-4 py-3">
                  <p className="text-sm text-[#4A6B4A]">You can add a product later when you've decided what to give.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Occasion */}
          {step === 3 && (
            <OccasionStep
              isLog={isLog}
              today={today}
              search={search}
              setSearch={setSearch}
              filteredOccasions={filteredOccasions}
              selectedOccasion={selectedOccasion}
              setSelectedOccasion={setSelectedOccasion}
              onOccasionCreated={(occ) => {
                setOccasions(prev => {
                  const updated = [...prev, occ as any]
                  return updated.sort((a: any, b: any) => {
                    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
                    return isLog ? -diff : diff  // past: newest first; upcoming: soonest first
                  })
                })
                setSelectedOccasion(occ)
              }}
              inputClass={inputClass}
            />
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2420] mb-1">Gift name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 4,000 Weeks for Ashley" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2D2420] mb-1">{dateLabel}</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className={inputClass} />
                {!isLog && <p className="text-xs text-[#8B7355] mt-1">Auto-filled from the occasion date if selected.</p>}
              </div>
            </div>
          )}

          {/* Step 5: Note */}
          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-[#8B7355]">Add a personal note (optional)</p>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Any notes about this gift…"
                rows={4} className={inputClass + ' resize-none'} />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E8E0D8] flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors">
            Cancel
          </button>
          {step < STEPS.length ? (
            <button onClick={() => { setStep(s => s + 1); setSearch('') }} disabled={!canAdvance()}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 ${accentColor}`}>
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 ${accentColor}`}>
              {loading ? 'Saving…' : isLog ? 'Log gift' : 'Save plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
