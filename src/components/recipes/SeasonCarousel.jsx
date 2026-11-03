import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Leaf, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { formatRecipeMeta } from '../../lib/mealPlan'
import { pickFallbackColor } from '../../lib/recipes'
import CoverImage from './CoverImage'
import { CARD_CLASS, FOCUS_RING } from './styles'

const IDEAS_COUNT = 6

// Carrousel « Idées de saison » du mode sélection : toucher une carte ajoute la recette au créneau
export default function SeasonCarousel({ slotLabel, onPick, disabled }) {
  const titleId = useId()
  // Mêmes paramètres et même clé que les idées du panneau de créneau du Planning
  const suggestionsQuery = useQuery({
    queryKey: ['planning-suggestions'],
    queryFn: () => api.getRecipeSuggestions({ page: 1, limit: IDEAS_COUNT }),
  })
  const ideas = suggestionsQuery.data?.items ?? []

  // Rien à proposer (ou idées indisponibles) : la section disparaît, les dossiers restent
  if (suggestionsQuery.isError || (suggestionsQuery.isSuccess && ideas.length === 0)) return null

  return (
    // La marge négative compense le bas du carrousel, gardé libre pour l'ombre des cartes
    <section aria-labelledby={titleId} className="-mb-3 pt-[18px]">
      <h2 id={titleId} className="mx-4 mb-2.5 flex items-center gap-1.5 text-[13px]/[18px] font-semibold text-lime-800">
        <Leaf size={14} aria-hidden="true" />
        Idées de saison
      </h2>

      {suggestionsQuery.isPending ? (
        <div aria-hidden="true" className="flex gap-3 overflow-hidden px-4 pt-0.5 pb-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={clsx('flex w-[152px] flex-none flex-col gap-2 p-1.5 pb-2.5', CARD_CLASS)}>
              <div className="h-[100px] animate-pulse rounded-xl bg-sage-100" />
              <div className="mx-1 h-4 w-3/4 animate-pulse rounded bg-sage-100" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex gap-3 overflow-x-auto px-4 pt-0.5 pb-3">
          {ideas.map((recipe) => {
            const meta = formatRecipeMeta(recipe)
            return (
              <li key={recipe.id} className="flex-none">
                <button
                  type="button"
                  aria-label={`Ajouter ${recipe.title} au ${slotLabel}`}
                  disabled={disabled}
                  onClick={() => onPick(recipe)}
                  className={clsx(
                    'flex h-full w-[152px] cursor-pointer flex-col gap-2 p-1.5 pb-2.5 text-left text-sage-900 disabled:cursor-default disabled:opacity-60',
                    CARD_CLASS,
                    FOCUS_RING,
                  )}
                >
                  <span className="relative block h-[100px] w-[140px] overflow-hidden rounded-xl">
                    <CoverImage src={recipe.imageUrl} color={pickFallbackColor(recipe.id)} iconSize={22} />
                    <span
                      aria-hidden="true"
                      className="absolute right-2 bottom-2 flex size-[30px] items-center justify-center rounded-full bg-terracotta-700 text-white shadow-[0_2px_6px_rgba(15,23,42,0.2)]"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                    </span>
                  </span>
                  <span className="flex flex-col gap-px px-1">
                    <span className="line-clamp-2 text-[13px]/[17px] font-medium">{recipe.title}</span>
                    {meta ? <span className="text-xs text-sage-500">{meta}</span> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
