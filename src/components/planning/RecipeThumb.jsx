import { useState } from 'react'
import clsx from 'clsx'
import { Utensils } from 'lucide-react'

// Teintes des maquettes, utilisées quand une recette n'a pas de photo
const FALLBACK_COLORS = ['#D9893F', '#C9962E', '#D2692B', '#9AA86A', '#7F9254', '#A86F3E', '#8C7A63', '#B8A27A', '#9A6B3F']

function pickColor(seed) {
  let hash = 0
  for (const char of String(seed ?? '')) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

export default function RecipeThumb({ recipe, className, iconSize = 18, iconStrokeWidth = 2 }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const imageUrl = recipe?.imageUrl

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        onError={() => setFailedUrl(imageUrl)}
        className={clsx('flex-none object-cover', className)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={clsx('flex flex-none items-center justify-center text-white/90', className)}
      style={{ background: pickColor(recipe?.id ?? recipe?.title) }}
    >
      <Utensils size={iconSize} strokeWidth={iconStrokeWidth} />
    </span>
  )
}
