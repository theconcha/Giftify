import { useState, useRef } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { OccasionWithDetails } from '../../types'
import { createOccasion, updateOccasion } from '../../lib/occasions'

interface Props {
  occasion?: OccasionWithDetails | null
  onSave: () => void
  onClose: () => void
}

const QUICK_START = [
  { name: 'Eid al-Fitr',          emoji: '🌙' },
  { name: 'Wedding / Anniversary', emoji: '💍' },
  { name: 'Baby Shower / New Baby',emoji: '👶' },
  { name: 'Graduation',            emoji: '🎓' },
]

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#C2714F] transition-colors'
const labelClass = 'block text-xs font-semibold text-[#2D2420] mb-1'

export default function OccasionForm({ occasion, onSave, onClose }: Props) {
  const currentYear = new Date().getFullYear()
  const [form, setForm] = useState({
    name: occasion?.name ?? '',
    date: occasion?.date ?? '',
    notes: occasion?.notes ?? '',
  })
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const handleChipSelect = (chip: typeof QUICK_START[0]) => {
    const isDeselecting = selectedChip === chip.name
    if (isDeselecting) {
      setSelectedChip(null)
      setForm(f => ({ ...f, name: '', date: '' }))
      return
    }
    setSelectedChip(chip.name)
    setForm(f => ({
      ...f,
      name: `${chip.name} ${currentYear}`,
      date: '',
    }))
    setTimeout(() => dateRef.current?.focus(), 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name: form.name.trim(),
      date: form.date,
      holiday_id: null,
      notes: form.notes.trim() || null,
    }

    const { error } = occasion
      ? await updateOccasion(occasion.id, data, [])
      : await createOccasion(data, [])

    setLoading(false)
    if (error) return setError(error.message)
    onSave()
  }

  const searchUrl = selectedChip
    ? `https://www.google.com/search?q=${encodeURIComponent(`${selectedChip} ${currentYear} date`)}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D8]">
          <h2 className="font-bold text-[#2D2420] text-base">
            {occasion ? 'Edit occasion' : 'Add occasion'}
          </h2>
          <button onClick={onClose} className="text-[#8B7355] hover:text-[#2D2420]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Quick-start chips — only shown when adding, not editing */}
          {!occasion && (
            <div>
              <label className={labelClass}>Quick start</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_START.map(chip => (
                  <button
                    key={chip.name}
                    type="button"
                    onClick={() => handleChipSelect(chip)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      selectedChip === chip.name
                        ? 'bg-[#C2714F] text-white'
                        : 'bg-[#F0E8E0] text-[#8B7355] hover:bg-[#E8D8CC]'
                    }`}
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.name}</span>
                  </button>
                ))}
              </div>
              {selectedChip === 'Eid al-Fitr' && (
                <p className="text-xs text-[#8B7355] mt-2">
                  Date varies yearly —{' '}
                  <a
                    href={searchUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C2714F] font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    find {currentYear} date <ExternalLink size={11} />
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Occasion name */}
          <div>
            <label className={labelClass}>Occasion name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Jake's Graduation Party"
              className={inputClass}
            />
          </div>

          {/* Date */}
          <div>
            <label className={labelClass}>Date *</label>
            <input
              ref={dateRef}
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes…"
              rows={2}
              className={inputClass + ' resize-none'}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        <div className="px-5 py-4 border-t border-[#E8E0D8] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[#C2714F] text-white text-sm font-semibold hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving…' : occasion ? 'Save changes' : 'Add occasion'}
          </button>
        </div>

      </div>
    </div>
  )
}
