import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Archive, ArchiveRestore, Trash2, Heart, ExternalLink } from 'lucide-react'
import type { Product } from '../types'
import { fetchProduct, archiveProduct, deleteProduct, toggleFavorite } from '../lib/products'
import { CATEGORY_OPTIONS } from '../lib/constants'
import ProductForm from '../components/products/ProductForm'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await fetchProduct(id)
    if (error || !data) navigate('/products')
    else setProduct(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleArchive = async () => {
    if (!product) return
    await archiveProduct(product.id, !product.is_archived)
    load()
  }

  const handleFavorite = async () => {
    if (!product) return
    await toggleFavorite(product.id, !product.is_favorited)
    load()
  }

  const handleDelete = async () => {
    if (!product) return
    await deleteProduct(product.id)
    navigate('/products')
  }

  const categoryLabels = product?.categories
    .map(c => CATEGORY_OPTIONS.find(o => o.value === c)?.label ?? c) ?? []

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-[#8B7355] text-sm">Loading…</div>
  )

  if (!product) return null

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back nav */}
      <div className="px-4 pt-4 pb-2">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-[#8B7355] hover:text-[#2D2420] transition-colors">
          <ArrowLeft size={16} /> Products
        </Link>
      </div>

      {/* Product photo */}
      <div className="mx-4 mb-4 aspect-video bg-[#F8F3EE] rounded-2xl overflow-hidden flex items-center justify-center">
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-4xl opacity-20">🎁</span>
        )}
      </div>

      {/* Name + price */}
      <div className="px-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-[#2D2420] leading-tight">{product.name}</h1>
          <button
            onClick={handleFavorite}
            className="shrink-0 w-10 h-10 rounded-full bg-white border border-[#E8E0D8] flex items-center justify-center"
            aria-label={product.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={18}
              className={product.is_favorited ? 'fill-[#C2714F] text-[#C2714F]' : 'text-[#8B7355]'}
            />
          </button>
        </div>
        {product.price != null && (
          <p className="text-xl font-bold text-[#C2714F] mt-1">${product.price.toFixed(2)}</p>
        )}
        {product.is_archived && (
          <span className="inline-block mt-2 text-xs bg-[#F0E8E0] text-[#8B7355] px-2 py-0.5 rounded-full font-medium">
            Archived
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
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
          {product.is_archived ? <><ArchiveRestore size={15} /> Unarchive</> : <><Archive size={15} /> Archive</>}
        </button>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-[#E8E0D8] text-[#2D2420] hover:bg-[#F0E8E0] transition-colors"
          >
            <ExternalLink size={15} /> View source
          </a>
        )}
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>

      {/* Product details */}
      <div className="mx-4 bg-white rounded-2xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
        {product.description && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-[#8B7355] mb-1">Why I love it</p>
            <p className="text-sm text-[#2D2420]">{product.description}</p>
          </div>
        )}
        {categoryLabels.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-[#8B7355] mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categoryLabels.map(label => (
                <span key={label} className="px-3 py-1 bg-[#F0E8E0] text-[#8B7355] text-xs font-semibold rounded-full">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
        {product.sku && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0">SKU</span>
            <span className="text-sm text-[#2D2420]">{product.sku}</span>
          </div>
        )}
        {product.url && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="text-xs font-semibold text-[#8B7355] w-20 shrink-0">URL</span>
            <a href={product.url} target="_blank" rel="noopener noreferrer"
              className="text-sm text-[#C2714F] hover:underline truncate">
              {product.url}
            </a>
          </div>
        )}
      </div>

      {/* Gift history placeholder */}
      <div className="mx-4 mt-4 mb-8">
        <h2 className="text-base font-bold text-[#2D2420] mb-3">Who has received this?</h2>
        <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-8 text-center">
          <p className="text-sm text-[#8B7355]">No gifts recorded with this product yet.</p>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <ProductForm
          product={product}
          onSave={() => { setShowEdit(false); load() }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-[#2D2420] text-base mb-2">Delete this product?</h3>
            <p className="text-sm text-[#8B7355] mb-5">This will permanently delete the product. Gift history that references it will be preserved. This can't be undone.</p>
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
