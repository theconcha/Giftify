import { useState, useEffect } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, ArrowLeft } from 'lucide-react'
import type { Holiday } from '../types'
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from '../lib/holidays'
import { formatAnchorDate } from '../lib/utils'
import { MONTHS } from '../lib/constants'
import Combobox from '../components/ui/Combobox'
import { supabase } from '../lib/supabase'

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#C2714F] transition-colors'
const labelClass = 'block text-xs font-semibold text-[#2D2420] mb-1'

function HolidayForm({ holiday, onSave, onClose }: {
  holiday?: Holiday | null
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: holiday?.name ?? '',
    anchor_month: holiday?.anchor_month?.toString() ?? '',
    anchor_day: holiday?.anchor_day?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = {
      name: form.name.trim(),
      anchor_month: form.anchor_month ? parseInt(form.anchor_month) : null,
      anchor_day: form.anchor_day ? parseInt(form.anchor_day) : null,
      icon_url: null,
      is_system: false,
    }
    const { error } = holiday
      ? await updateHoliday(holiday.id, data)
      : await createHoliday(data)
    setLoading(false)
    if (error) return setError(error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D8]">
          <h2 className="font-bold text-[#2D2420] text-base">{holiday ? 'Edit holiday' : 'Add holiday'}</h2>
          <button onClick={onClose}><X size={20} className="text-[#8B7355]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Holiday name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Lunar New Year"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Anchor date (optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <Combobox
                options={MONTHS}
                value={form.anchor_month}
                onChange={v => setForm(f => ({ ...f, anchor_month: v }))}
                placeholder="Month"
                className={inputClass + ' pr-8'}
              />
              <input
                type="number"
                min={1}
                max={31}
                value={form.anchor_day}
                onChange={e => setForm(f => ({ ...f, anchor_day: e.target.value }))}
                placeholder="Day"
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#C2714F] text-white text-sm font-semibold hover:bg-[#A85E3E] transition-colors disabled:opacity-60">
              {loading ? 'Saving…' : holiday ? 'Save' : 'Add holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Settings() {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'account'
  const location = useLocation()
  const from = (location.state as { from?: string })?.from

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidayForm, setHolidayForm] = useState<Holiday | null | 'new'>(null)
  const [confirmDeleteHoliday, setConfirmDeleteHoliday] = useState<Holiday | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  useEffect(() => {
    fetchHolidays().then(({ data }) => setHolidays(data ?? []))
    supabase.auth.getUser().then(({ data }) => {
      setDisplayName(data.user?.user_metadata?.display_name ?? '')
    })
  }, [])

  const handleDeleteHoliday = async () => {
    if (!confirmDeleteHoliday) return
    await deleteHoliday(confirmDeleteHoliday.id)
    setConfirmDeleteHoliday(null)
    fetchHolidays().then(({ data }) => setHolidays(data ?? []))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAccount(true)
    await supabase.auth.updateUser({ data: { display_name: displayName } })
    setSavingAccount(false)
  }

  const systemHolidays = holidays.filter(h => h.is_system)
  const customHolidays = holidays.filter(h => !h.is_system)

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'holidays', label: 'Holidays' },
    { id: 'notifications', label: 'Notifications' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {from && (
        <div className="px-4 pt-4 pb-1">
          <Link
            to={from}
            className="inline-flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Occasions
          </Link>
        </div>
      )}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-extrabold text-[#2D2420]">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-4 flex gap-2">
        {tabs.map(tab => (
          <a
            key={tab.id}
            href={`?tab=${tab.id}`}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'bg-[#C2714F] text-white' : 'bg-[#F0E8E0] text-[#8B7355]'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Account tab */}
      {activeTab === 'account' && (
        <div className="px-4 space-y-4 pb-8">
          <form onSubmit={handleSaveAccount} className="bg-white rounded-2xl border border-[#E8E0D8] p-4 space-y-4">
            <h2 className="font-bold text-[#2D2420]">Profile</h2>
            <div>
              <label className={labelClass}>Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={savingAccount}
              className="px-4 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
            >
              {savingAccount ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-[#E8E0D8] p-4">
            <button
              onClick={handleSignOut}
              className="text-sm font-semibold text-[#8B7355] hover:text-[#2D2420] transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-red-200 p-4">
            <h2 className="font-bold text-red-500 mb-2">Danger zone</h2>
            <p className="text-sm text-[#8B7355] mb-3">Permanently delete your account and all data. This cannot be undone.</p>
            <button className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors">
              Delete account
            </button>
          </div>
        </div>
      )}

      {/* Holidays tab */}
      {activeTab === 'holidays' && (
        <div className="px-4 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#8B7355]">Manage your custom holidays.</p>
            <button
              onClick={() => setHolidayForm('new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
            >
              <Plus size={15} /> Add holiday
            </button>
          </div>

          {/* Custom holidays */}
          {customHolidays.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2">Your holidays</h2>
              <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
                {customHolidays.map(h => (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2D2420] text-sm">{h.name}</p>
                      <p className="text-xs text-[#8B7355]">{formatAnchorDate(h.anchor_month, h.anchor_day)}</p>
                    </div>
                    <button onClick={() => setHolidayForm(h)} className="text-[#8B7355] hover:text-[#2D2420] p-1">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmDeleteHoliday(h)} className="text-[#8B7355] hover:text-red-500 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System holidays */}
          <div>
            <h2 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2">System holidays</h2>
            <div className="bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
              {systemHolidays.map(h => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D2420] text-sm">{h.name}</p>
                    <p className="text-xs text-[#8B7355]">{formatAnchorDate(h.anchor_month, h.anchor_day)}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-[#F0E8E0] text-[#8B7355] px-2 py-0.5 rounded-full">
                    System
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="px-4 pb-8">
          <div className="bg-white rounded-2xl border border-[#E8E0D8] p-4">
            <h2 className="font-bold text-[#2D2420] mb-3">Reminder lead times</h2>
            <p className="text-sm text-[#8B7355] mb-4">Get email reminders before upcoming occasions.</p>
            {[30, 14, 7, 3, 1].map(days => (
              <label key={days} className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="checkbox" className="accent-[#C2714F]" />
                <span className="text-sm text-[#2D2420]">{days} {days === 1 ? 'day' : 'days'} before</span>
              </label>
            ))}
            <p className="text-xs text-[#8B7355] mt-3">Email notifications coming soon.</p>
          </div>
        </div>
      )}

      {/* Holiday form modal */}
      {holidayForm !== null && (
        <HolidayForm
          holiday={holidayForm === 'new' ? null : holidayForm}
          onSave={() => {
            setHolidayForm(null)
            fetchHolidays().then(({ data }) => setHolidays(data ?? []))
          }}
          onClose={() => setHolidayForm(null)}
        />
      )}

      {/* Delete holiday confirmation */}
      {confirmDeleteHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteHoliday(null)} />
          <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-[#2D2420] text-base mb-2">Delete "{confirmDeleteHoliday.name}"?</h3>
            <p className="text-sm text-[#8B7355] mb-5">Any occasions linked to this holiday will be unlinked but not deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteHoliday(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D8] text-sm font-semibold text-[#2D2420] hover:bg-[#F0E8E0] transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteHoliday}
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
