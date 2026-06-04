import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import type { Person } from '../types'
import { fetchPerson, archivePerson, deletePerson } from '../lib/people'
import { MONTH_SHORT, GENDER_OPTIONS, PRONOUN_OPTIONS, RELIGION_OPTIONS } from '../lib/constants'
import PersonAvatar from '../components/people/PersonAvatar'
import PersonForm from '../components/people/PersonForm'

function labelFor(options: { value: string; label: string }[], value: string | null) {
  if (!value) return null
  return options.find(o => o.value === value)?.label ?? value
}

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await fetchPerson(id)
    if (error || !data) navigate('/people')
    else setPerson(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleArchive = async () => {
    if (!person) return
    await archivePerson(person.id, !person.is_archived)
    load()
  }

  const handleDelete = async () => {
    if (!person) return
    await deletePerson(person.id)
    navigate('/people')
  }

  const birthday = person?.birthday_month && person?.birthday_day
    ? `${MONTH_SHORT[person.birthday_month - 1]} ${person.birthday_day}${person.birthday_year ? `, ${person.birthday_year}` : ''}`
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
    )
  }

  if (!person) return null

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back nav */}
      <div className="px-4 pt-4 pb-2">
        <Link to="/people" className="inline-flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors">
          <ArrowLeft size={16} />
          People
        </Link>
      </div>

      {/* Profile header */}
      <div className="px-4 py-4 flex items-center gap-4">
        <PersonAvatar person={person} size={72} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-[#2D2420]">
            {person.first_name} {person.last_name}
          </h1>
          {person.is_archived && (
            <span className="inline-block mt-1 text-xs bg-[#F0E8E0] text-[#8B7355] px-2 py-0.5 rounded-full font-medium">
              Archived
            </span>
          )}
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
          onClick={handleArchive}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-[#E8E0D8] text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
        >
          {person.is_archived ? <><ArchiveRestore size={15} /> Unarchive</> : <><Archive size={15} /> Archive</>}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>

      {/* Profile info */}
      <div className="mx-4 bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
        {[
          { label: 'Birthday', value: birthday },
          { label: 'Email', value: person.email_address },
          { label: 'Address', value: person.street_address },
          { label: 'Gender', value: labelFor(GENDER_OPTIONS, person.gender) },
          { label: 'Pronouns', value: labelFor(PRONOUN_OPTIONS, person.pronouns) },
          { label: 'Religion', value: labelFor(RELIGION_OPTIONS, person.religion) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start gap-4 px-4 py-3">
            <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-[#2D2420]">{value || '—'}</span>
          </div>
        ))}
      </div>

      {/* Gift history placeholder */}
      <div className="mx-4 mt-4 mb-8">
        <h2 className="text-base font-bold text-[#2D2420] mb-3">Gift history</h2>
        <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-8 text-center">
          <p className="text-sm text-[#8B7355]">No gifts recorded yet.</p>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <PersonForm
          person={person}
          onSave={() => { setShowEdit(false); load() }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-[#2D2420] text-base mb-2">Delete {person.first_name}?</h3>
            <p className="text-sm text-[#8B7355] mb-5">This will permanently delete this person and all associated gift history. This can't be undone.</p>
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
