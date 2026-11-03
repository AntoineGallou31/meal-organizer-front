import { useState } from 'react'
import clsx from 'clsx'
import { Utensils } from 'lucide-react'
import { pickFallbackColor } from '../../lib/recipes'

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
      style={{ background: pickFallbackColor(recipe?.id ?? recipe?.title) }}
    >
      <Utensils size={iconSize} strokeWidth={iconStrokeWidth} />
    </span>
  )
}
