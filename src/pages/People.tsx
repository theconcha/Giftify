import { useState, useEffect, useCallback } from 'react'
import { Search, LayoutGrid, List, UserPlus, Users } from 'lucide-react'
import type { Person } from '../types'
import { fetchPeople } from '../lib/people'
import PersonCard from '../components/people/PersonCard'
import PersonRow from '../components/people/PersonRow'
import PersonForm from '../components/people/PersonForm'

const PER_PAGE = 20

export default function People() {
  const [people, setPeople] = useState<Person[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, count, error } = await fetchPeople({ search, showArchived, page, perPage: PER_PAGE })
    if (!error) {
      setPeople(data ?? [])
      setCount(count ?? 0)
    }
    setLoading(false)
  }, [search, showArchived, page])

  useEffect(() => { load() }, [load])

  // Reset to page 1 when search or filter changes
  useEffect(() => { setPage(1) }, [search, showArchived])

  const totalPages = Math.ceil(count / PER_PAGE)

  return (
    <div className="flex flex-col min-h-full">

      {/* Page header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#2D2420]">People</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
        >
          <UserPlus size={16} />
          Add person
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-sm text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors"
          />
        </div>
      </div>

      {/* Filters row */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-[#8B7355] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className="rounded accent-[#C2714F]"
          />
          Show archived
        </label>
        <div className="flex items-center gap-1 bg-[#F0E8E0] rounded-lg p-1">
          <button
            onClick={() => setView('card')}
            className={`p-1.5 rounded-md transition-colors ${view === 'card' ? 'bg-white text-[#C2714F] shadow-sm' : 'text-[#8B7355]'}`}
            aria-label="Card view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white text-[#C2714F] shadow-sm' : 'text-[#8B7355]'}`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
        ) : people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0E8E0] flex items-center justify-center mb-4">
              <Users size={28} className="text-[#C2714F]" />
            </div>
            <p className="font-bold text-[#2D2420]">
              {search ? 'No people found' : 'No people yet'}
            </p>
            <p className="text-sm text-[#8B7355] mt-1">
              {search ? 'Try a different search.' : 'Add the people you love to give to.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
              >
                Add your first person
              </button>
            )}
          </div>
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {people.map(person => <PersonCard key={person.id} person={person} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
            {people.map(person => <PersonRow key={person.id} person={person} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
                p === page
                  ? 'bg-[#C2714F] text-white'
                  : 'border border-[#E8E0D8] text-[#8B7355] hover:bg-[#F0E8E0]'
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

      {/* Add/Edit modal */}
      {showForm && (
        <PersonForm
          onSave={() => { setShowForm(false); load() }}
          onClose={() => setShowForm(false)}
        />
      )}

    </div>
  )
}
