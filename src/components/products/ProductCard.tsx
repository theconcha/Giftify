import { Link } from 'react-router-dom'
import { Heart, Package } from 'lucide-react'
import type { Product } from '../../types'
import { CATEGORY_OPTIONS } from '../../lib/constants'
import { toggleFavorite } from '../../lib/products'

interface Props {
  product: Product
  onFavoriteToggle: () => void
}

export default function ProductCard({ product, onFavoriteToggle }: Props) {
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
      className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Square image area — always square, image never cropped */}
      <div className="aspect-square bg-white overflow-hidden relative flex-shrink-0">
        {product.photo_url ? (
          <div className="absolute inset-3 flex items-center justify-center">
            <img
              src={product.photo_url}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={36} className="text-[#C2714F] opacity-20" />
          </div>
        )}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center z-10"
          aria-label={product.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={16}
            className={product.is_favorited ? 'fill-[#C2714F] text-[#C2714F]' : 'text-[#8B7355]'}
          />
        </button>
      </div>

      {/* Text block — always starts right below the square image area */}
      <div className="p-3 border-t border-[#E8E0D8] flex flex-col gap-1">
        <p className="font-bold text-[#2D2420] text-sm leading-snug line-clamp-2">{product.name}</p>
        {product.price != null && (
          <p className="text-[#C2714F] font-semibold text-sm">${product.price.toFixed(2)}</p>
        )}
        {categoryLabels && (
          <p className="text-xs text-[#8B7355] line-clamp-1">{categoryLabels}</p>
        )}
        {product.is_archived && (
          <span className="inline-block text-[10px] bg-[#F0E8E0] text-[#8B7355] px-2 py-0.5 rounded-full font-medium w-fit">
            Archived
          </span>
        )}
      </div>
    </Link>
  )
}
