import { useState } from 'react'
import { X } from 'lucide-react'
import type { Person } from '../../types'
import { createPerson, updatePerson } from '../../lib/people'
import { MONTHS, GENDER_OPTIONS, PRONOUN_OPTIONS, RELIGION_OPTIONS } from '../../lib/constants'
import Combobox from '../ui/Combobox'

interface Props {
  person?: Person | null
  onSave: () => void
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2.5 pr-8 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#C2714F] transition-colors'
const labelClass = 'block text-xs font-semibold text-[#2D2420] mb-1'

export default function PersonForm({ person, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    first_name: person?.first_name ?? '',
    last_name: person?.last_name ?? '',
    birthday_month: person?.birthday_month?.toString() ?? '',
    birthday_day: person?.birthday_day?.toString() ?? '',
    birthday_year: person?.birthday_year?.toString() ?? '',
    street_address: person?.street_address ?? '',
    email_address: person?.email_address ?? '',
    gender: person?.gender ?? '',
    pronouns: person?.pronouns ?? '',
    religion: person?.religion ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      birthday_month: form.birthday_month ? parseInt(form.birthday_month) : null,
      birthday_day: form.birthday_day ? parseInt(form.birthday_day) : null,
      birthday_year: form.birthday_year ? parseInt(form.birthday_year) : null,
      street_address: form.street_address.trim() || null,
      email_address: form.email_address.trim() || null,
      photo_url: person?.photo_url ?? null,
      gender: (form.gender || null) as Person['gender'],
      pronouns: (form.pronouns || null) as Person['pronouns'],
      religion: (form.religion || null) as Person['religion'],
      is_archived: person?.is_archived ?? false,
    }

    const { error } = person
      ? await updatePerson(person.id, data)
      : await createPerson(data)

    setLoading(false)
    if (error) return setError(error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D8]">
          <h2 className="font-bold text-[#2D2420] text-base">
            {person ? 'Edit person' : 'Add person'}
          </h2>
          <button onClick={onClose} className="text-[#8B7355] hover:text-[#2D2420] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name *</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                placeholder="Ashley"
                className={inputClass.replace('pr-8', 'pr-3')}
              />
            </div>
            <div>
              <label className={labelClass}>Last name *</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                placeholder="Johnson"
                className={inputClass.replace('pr-8', 'pr-3')}
              />
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label className={labelClass}>Birthday</label>
            <div className="grid grid-cols-3 gap-2">
              <Combobox
                options={MONTHS}
                value={form.birthday_month}
                onChange={v => set('birthday_month', v)}
                placeholder="Month"
                className={inputClass}
              />
              <input
                type="text"
                value={form.birthday_day}
                onChange={e => set('birthday_day', e.target.value)}
                placeholder="Day"
                className={inputClass.replace('pr-8', 'pr-3')}
              />
              <input
                type="number"
                value={form.birthday_year}
                onChange={e => set('birthday_year', e.target.value)}
                placeholder="Year"
                min={1900}
                max={2100}
                className={inputClass.replace('pr-8', 'pr-3')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email address</label>
            <input
              type="email"
              value={form.email_address}
              onChange={e => set('email_address', e.target.value)}
              placeholder="ashley@example.com"
              className={inputClass.replace('pr-8', 'pr-3')}
            />
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>Street address</label>
            <input
              type="text"
              value={form.street_address}
              onChange={e => set('street_address', e.target.value)}
              placeholder="123 Main St, City, State 12345"
              className={inputClass.replace('pr-8', 'pr-3')}
            />
          </div>

          {/* Gender */}
          <div>
            <label className={labelClass}>Gender</label>
            <Combobox
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={v => set('gender', v)}
              placeholder="Select or type gender"
              className={inputClass}
            />
          </div>

          {/* Pronouns */}
          <div>
            <label className={labelClass}>Pronouns</label>
            <Combobox
              options={PRONOUN_OPTIONS}
              value={form.pronouns}
              onChange={v => set('pronouns', v)}
              placeholder="Select or type pronouns"
              className={inputClass}
            />
          </div>

          {/* Religion */}
          <div>
            <label className={labelClass}>Religion</label>
            <Combobox
              options={RELIGION_OPTIONS}
              value={form.religion}
              onChange={v => set('religion', v)}
              placeholder="Select or type religion"
              className={inputClass}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        {/* Footer */}
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
            {loading ? 'Saving…' : person ? 'Save changes' : 'Add person'}
          </button>
        </div>

      </div>
    </div>
  )
}
