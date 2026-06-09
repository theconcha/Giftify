import { useState, useCallback } from 'react'
import { Sparkles, ChevronLeft, ChevronRight, Package, RefreshCw } from 'lucide-react'
import type { Person, Product, Occasion } from '../../types'
import { supabase } from '../../lib/supabase'
import { fetchGiftsByPerson } from '../../lib/gifts'
import { fetchProducts } from '../../lib/products'

interface Suggestion {
  id: string
  reason: string
  product: Product
}

interface Props {
  person: Person
  occasion?: Occasion | null
}

export default function GiftSuggestions({ person, occasion }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [giftsRes, productsRes] = await Promise.all([
      fetchGiftsByPerson(person.id),
      fetchProducts({ showArchived: false, perPage: 100 }),
    ])

    const giftHistory = (giftsRes.data as any[]) ?? []
    const products = productsRes.data ?? []

    if (products.length === 0) {
      setError('Add some products to your library to get gift suggestions.')
      setLoading(false)
      setFetched(true)
      return
    }

    const { data, error: fnError } = await supabase.functions.invoke('suggest-gifts', {
      body: {
        person: {
          first_name: person.first_name,
          last_name: person.last_name,
          gender: person.gender,
          pronouns: person.pronouns,
          religion: person.religion,
        },
        occasion: occasion ? { name: occasion.name, date: occasion.date } : null,
        giftHistory: giftHistory.map((g: any) => ({ name: g.name, product: g.product?.name })),
        products,
      },
    })

    if (fnError || !data || data.error) {
      setError('Could not load suggestions right now.')
      setLoading(false)
      setFetched(true)
      return
    }

    // Map returned IDs back to full product objects
    const mapped: Suggestion[] = (data as { id: string; reason: string }[])
      .map(s => {
        const product = products.find(p => p.id === s.id)
        return product ? { id: s.id, reason: s.reason, product } : null
      })
      .filter(Boolean) as Suggestion[]

    setSuggestions(mapped)
    setLoading(false)
    setFetched(true)
  }, [person.id, occasion?.id])


  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="hidden md:flex items-center gap-2 w-8 bg-white border-l border-[#E8E0D8] h-full justify-center hover:bg-[#F8F3EE] transition-colors"
        aria-label="Show suggestions"
      >
        <Sparkles size={16} className="text-[#C2714F]" />
        <ChevronLeft size={14} className="text-[#8B7355]" />
      </button>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-l border-[#E8E0D8] bg-[#FAF6F1]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E0D8]">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#C2714F]" />
            <span className="text-sm font-bold text-[#2D2420]">Gift ideas</span>
          </div>
          <button onClick={() => setCollapsed(true)} className="text-[#8B7355] hover:text-[#2D2420]">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!fetched && !loading && (
            <div className="text-center py-6">
              <p className="text-xs text-[#8B7355] mb-3">Get AI-powered gift ideas for {person.first_name}.</p>
              <button onClick={load}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#C2714F] text-white text-xs font-semibold rounded-xl hover:bg-[#A85E3E] transition-colors mx-auto">
                <Sparkles size={12} /> Get ideas
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-xs text-[#8B7355] animate-pulse">Finding ideas…</div>
            </div>
          )}

          {error && !loading && (
            <p className="text-xs text-[#8B7355] text-center py-4">{error}</p>
          )}

          {fetched && !loading && suggestions.length === 0 && !error && (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-[#8B7355]">No suggestions found.</p>
              <button onClick={load} className="text-xs text-[#C2714F] font-semibold hover:underline flex items-center gap-1 mx-auto">
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          )}

          {suggestions.map(s => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}

          {fetched && suggestions.length > 0 && (
            <button onClick={load} className="text-xs text-[#8B7355] hover:text-[#C2714F] font-semibold flex items-center gap-1 mx-auto mt-2 transition-colors">
              <RefreshCw size={11} /> Refresh
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile strip (above bottom nav) ─────────────────── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-10 bg-[#FAF6F1] border-t border-[#E8E0D8]">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#E8E0D8]">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-[#C2714F]" />
            <span className="text-xs font-bold text-[#2D2420]">Gift ideas</span>
          </div>
          {!fetched ? (
            <button onClick={load} disabled={loading}
              className="text-xs text-[#C2714F] font-semibold disabled:opacity-50">
              {loading ? 'Loading…' : 'Get ideas'}
            </button>
          ) : (
            <button onClick={load} disabled={loading} className="text-[#8B7355] hover:text-[#C2714F] transition-colors disabled:opacity-40">
              <RefreshCw size={13} />
            </button>
          )}
        </div>

        {(fetched || loading) && (
          <div className="flex gap-2 px-3 py-2 overflow-x-auto">
            {loading && (
              <p className="text-xs text-[#8B7355] py-1 animate-pulse">Finding ideas…</p>
            )}
            {error && !loading && (
              <p className="text-xs text-[#8B7355] py-1">{error}</p>
            )}
            {!loading && fetched && suggestions.length === 0 && !error && (
              <p className="text-xs text-[#8B7355] py-1">No suggestions found. Try refreshing.</p>
            )}
            {suggestions.map(s => (
              <MobileSuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Desktop suggestion card ───────────────────────────────────────────────────

function SuggestionCard({ suggestion }: {
  suggestion: Suggestion
}) {
  const { product, reason } = suggestion
  return (
    <div className="bg-white rounded-xl border border-[#E8E0D8] overflow-hidden">
      <div className="aspect-square bg-[#F8F3EE] flex items-center justify-center p-2">
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className="max-w-full max-h-full object-contain" />
        ) : (
          <Package size={24} className="text-[#C2714F] opacity-20" />
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-[#2D2420] line-clamp-2 leading-snug">{product.name}</p>
        {product.price != null && (
          <p className="text-xs text-[#C2714F] font-semibold mt-0.5">${product.price.toFixed(2)}</p>
        )}
        <p className="text-[10px] text-[#8B7355] mt-1 line-clamp-2 leading-snug italic">{reason}</p>
      </div>
    </div>
  )
}

// ── Mobile suggestion card (horizontal) ──────────────────────────────────────

function MobileSuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const { product } = suggestion
  return (
    <div className="shrink-0 w-28 bg-white rounded-xl border border-[#E8E0D8] overflow-hidden">
      <div className="h-20 bg-[#F8F3EE] flex items-center justify-center p-1.5">
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className="max-w-full max-h-full object-contain" />
        ) : (
          <Package size={20} className="text-[#C2714F] opacity-20" />
        )}
      </div>
      <div className="p-1.5">
        <p className="text-[10px] font-bold text-[#2D2420] line-clamp-2 leading-snug">{product.name}</p>
        {product.price != null && (
          <p className="text-[10px] text-[#C2714F] font-semibold">${product.price.toFixed(2)}</p>
        )}
      </div>
    </div>
  )
}
