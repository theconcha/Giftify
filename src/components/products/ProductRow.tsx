import { Link } from 'react-router-dom'
import { Heart, Package } from 'lucide-react'
import type { Product } from '../../types'
import { CATEGORY_OPTIONS } from '../../lib/constants'
import { toggleFavorite } from '../../lib/products'

interface Props {
  product: Product
  onFavoriteToggle: () => void
}

export default function ProductRow({ product, onFavoriteToggle }: Props) {
  const categoryLabels = product.categories
    .map(c => CATEGORY_OPTIONS.find(o => o.value === c)?.label ?? c)
    .join(', ')

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    await toggleFavorite(product.id, !product.is_favorited)
    onFavoriteToggle()
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors border-b border-[#E8E0D8] last:border-0"
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-[#F8F3EE] flex items-center justify-center shrink-0 overflow-hidden">
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={18} className="text-[#C2714F] opacity-40" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#2D2420] text-sm truncate">{product.name}</p>
        {categoryLabels && (
          <p className="text-xs text-[#8B7355] truncate">{categoryLabels}</p>
        )}
      </div>

      {/* Price */}
      {product.price != null && (
        <span className="text-sm font-semibold text-[#C2714F] shrink-0">
          ${product.price.toFixed(2)}
        </span>
      )}

      {/* Favorite */}
      <button
        onClick={handleFavorite}
        className="shrink-0 p-1"
        aria-label={product.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          size={16}
          className={product.is_favorited ? 'fill-[#C2714F] text-[#C2714F]' : 'text-[#8B7355]'}
        />
      </button>
    </Link>
  )
}
