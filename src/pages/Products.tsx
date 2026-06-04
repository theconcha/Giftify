import { useState, useEffect, useCallback } from 'react'
import { Search, LayoutGrid, List, Plus, Package, Heart } from 'lucide-react'
import type { Product } from '../types'
import { fetchProducts } from '../lib/products'
import { CATEGORY_OPTIONS } from '../lib/constants'
import ProductCard from '../components/products/ProductCard'
import ProductRow from '../components/products/ProductRow'
import ProductForm from '../components/products/ProductForm'
import Combobox from '../components/ui/Combobox'

const PER_PAGE = 20
const CATEGORY_FILTER_OPTIONS = [{ value: '', label: 'All categories' }, ...CATEGORY_OPTIONS]

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [showArchived, setShowArchived] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, count, error } = await fetchProducts({ search, category, showArchived, favoritesOnly, page, perPage: PER_PAGE })
    if (!error) {
      setProducts(data ?? [])
      setCount(count ?? 0)
    }
    setLoading(false)
  }, [search, category, showArchived, favoritesOnly, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, category, showArchived, favoritesOnly])

  const totalPages = Math.ceil(count / PER_PAGE)

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#2D2420]">Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
        >
          <Plus size={16} /> Add product
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
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-sm text-[#2D2420] placeholder-[#B8A898] focus:outline-none focus:border-[#C2714F] transition-colors"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="px-4 pb-3">
        <Combobox
          options={CATEGORY_FILTER_OPTIONS}
          value={category}
          onChange={setCategory}
          placeholder="Filter by category"
          className="w-full px-3 py-2.5 pr-8 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#C2714F] transition-colors"
        />
      </div>

      {/* Filters row */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[#8B7355] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={e => setFavoritesOnly(e.target.checked)}
              className="rounded accent-[#C2714F]"
            />
            <Heart size={14} className="text-[#C2714F]" /> Favorites
          </label>
          <label className="flex items-center gap-2 text-sm text-[#8B7355] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded accent-[#C2714F]"
            />
            Show archived
          </label>
        </div>
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
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0E8E0] flex items-center justify-center mb-4">
              <Package size={28} className="text-[#C2714F]" />
            </div>
            <p className="font-bold text-[#2D2420]">
              {search || category ? 'No products found' : 'No products yet'}
            </p>
            <p className="text-sm text-[#8B7355] mt-1">
              {search || category ? 'Try adjusting your filters.' : 'Add products to your personal gift library.'}
            </p>
            {!search && !category && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#C2714F] text-white text-sm font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors"
              >
                Add your first product
              </button>
            )}
          </div>
        ) : view === 'card' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onFavoriteToggle={load} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
            {products.map(product => (
              <ProductRow key={product.id} product={product} onFavoriteToggle={load} />
            ))}
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
                p === page ? 'bg-[#C2714F] text-white' : 'border border-[#E8E0D8] text-[#8B7355] hover:bg-[#F0E8E0]'
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

      {showForm && (
        <ProductForm
          onSave={() => { setShowForm(false); load() }}
          onClose={() => setShowForm(false)}
        />
      )}

    </div>
  )
}
