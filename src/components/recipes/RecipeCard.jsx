import clsx from 'clsx'
import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRecipeCardMeta } from '../../lib/recipes'
import CoverImage from './CoverImage'
import { CARD_CLASS, FOCUS_RING } from './styles'

// Carte blanche : lien vers la fiche, ou bouton qui ajoute la recette au planning en mode sélection (`onPick`)
export default function RecipeCard({ recipe, color, seasonBadge = false, withCookCount = false, onNavigate, onPick, pickLabel, disabled = false }) {
  const meta = formatRecipeCardMeta(recipe, { withCookCount })
  const className = clsx(
    'flex h-full w-full flex-col gap-2 p-1.5 pb-2.5 text-left text-sage-900',
    CARD_CLASS,
    FOCUS_RING,
  )

  const content = (
    <>
      <span className="relative block h-[118px] overflow-hidden rounded-xl">
        <CoverImage src={recipe.imageUrl} alt={recipe.title} color={color} iconSize={24} />
        {seasonBadge ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-xl bg-white/[0.94] px-2 py-[3px] text-[11px]/4 font-medium text-lime-800">
            <Leaf size={11} aria-hidden="true" />
            De saison
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-0.5 px-1">
        <span className="line-clamp-2 text-sm/[19px] font-medium">{recipe.title}</span>
        {meta ? <span className="text-xs text-sage-500">{meta}</span> : null}
      </span>
    </>
  )

  if (onPick) {
    return (
      <button
        type="button"
        aria-label={pickLabel}
        disabled={disabled}
        onClick={() => onPick(recipe)}
        className={clsx(className, 'cursor-pointer disabled:cursor-default disabled:opacity-60')}
      >
        {content}
      </button>
    )
  }

  return (
    <Link to={`/recipes/${recipe.id}`} onClick={onNavigate} className={className}>
      {content}
    </Link>
  )
}
