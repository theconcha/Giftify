import { useState, useRef } from 'react'
import { X, Upload, Package } from 'lucide-react'
import type { Product } from '../../types'
import { createProduct, updateProduct } from '../../lib/products'
import { uploadProductImage } from '../../lib/storage'
import { CATEGORY_OPTIONS } from '../../lib/constants'

interface Props {
  product?: Product | null
  onSave: () => void
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E8E0D8] bg-white text-[#2D2420] text-sm focus:outline-none focus:border-[#C2714F] transition-colors'
const labelClass = 'block text-xs font-semibold text-[#2D2420] mb-1'

export default function ProductForm({ product, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    url: product?.url ?? '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    categories: product?.categories ?? [] as string[],
  })
  const [photoUrl, setPhotoUrl] = useState<string | null>(product?.photo_url ?? null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const toggleCategory = (value: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(value)
        ? f.categories.filter(c => c !== value)
        : [...f.categories, value],
    }))
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    setError(null)
    const url = await uploadProductImage(file)
    setPhotoUploading(false)
    if (!url) return setError('Photo upload failed. Please try again.')
    setPhotoUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name: form.name.trim(),
      url: form.url.trim() || null,
      sku: form.sku.trim() || null,
      photo_url: photoUrl,
      description: form.description.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      categories: form.categories,
      is_favorited: product?.is_favorited ?? false,
      is_archived: product?.is_archived ?? false,
    }

    const { error } = product
      ? await updateProduct(product.id, data)
      : await createProduct(data)

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
            {product ? 'Edit product' : 'Add product'}
          </h2>
          <button onClick={onClose} className="text-[#8B7355] hover:text-[#2D2420] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Photo upload */}
          <div>
            <label className={labelClass}>Product photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-[#E8E0D8] bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#C2714F] hover:bg-[#FDF9F7] transition-colors overflow-hidden"
            >
              {photoUploading ? (
                <p className="text-sm text-[#8B7355]">Uploading…</p>
              ) : photoUrl ? (
                <img src={photoUrl} alt="Product" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#8B7355]">
                  <Package size={28} className="opacity-40" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">Upload a photo</p>
                    <p className="text-xs">Click to browse</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#C2714F] font-semibold mt-1">
                    <Upload size={12} /> Choose file
                  </div>
                </div>
              )}
            </div>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="mt-1 text-xs text-[#8B7355] hover:text-red-500 transition-colors"
              >
                Remove photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* URL */}
          <div>
            <label className={labelClass}>Product URL</label>
            <input
              type="url"
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
            <p className="text-xs text-[#8B7355] mt-1">AI auto-fill coming soon</p>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Product name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. 4,000 Weeks"
              className={inputClass}
            />
          </div>

          {/* Price */}
          <div>
            <label className={labelClass}>Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355] text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="0.00"
                className={inputClass + ' pl-7'}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Why you love it</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Your personal note on why this makes a great gift…"
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* SKU */}
          <div>
            <label className={labelClass}>SKU / Item number</label>
            <input
              type="text"
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>

          {/* Categories */}
          <div>
            <label className={labelClass}>Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleCategory(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    form.categories.includes(opt.value)
                      ? 'bg-[#C2714F] text-white'
                      : 'bg-[#F0E8E0] text-[#8B7355] hover:bg-[#E8D8CC]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
            disabled={loading || photoUploading}
            className="flex-1 py-2.5 rounded-xl bg-[#C2714F] text-white text-sm font-semibold hover:bg-[#A85E3E] transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>

      </div>
    </div>
  )
}
