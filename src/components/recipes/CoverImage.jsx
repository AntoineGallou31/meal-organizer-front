import { useState } from 'react'
import clsx from 'clsx'
import { Utensils } from 'lucide-react'
import { tintColor } from '../../lib/recipes'

const DEFAULT_COLOR = '#64748b'

// Photo, ou tuile teintée de `color` avec une icône de couverts quand elle manque ou ne charge pas
export default function CoverImage({ src, alt = '', color, iconSize = 20, showIcon = true, className }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={clsx('block size-full object-cover', className)}
      />
    )
  }

  const tone = color || DEFAULT_COLOR

  return (
    <span
      aria-hidden="true"
      className={clsx('flex size-full items-center justify-center', className)}
      style={{ backgroundColor: tintColor(tone), color: tone }}
    >
      {showIcon ? <Utensils size={iconSize} aria-hidden="true" /> : null}
    </span>
  )
}
