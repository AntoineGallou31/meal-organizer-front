import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Leaf, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { formatRecipeMeta } from '../../lib/mealPlan'
import RecipeThumb from './RecipeThumb'

const VISIBLE_IDEAS = 3
// On en demande plus que nécessaire pour en garder 3 une fois exclues celles déjà au menu
const FETCHED_IDEAS = 6

export default function SeasonIdeas({ slotLabel, excludedRecipeIds, onAdd }) {
  const titleId = useId()
  const suggestionsQuery = useQuery({
    queryKey: ['planning-suggestions'],
    queryFn: () => api.getRecipeSuggestions({ page: 1, limit: FETCHED_IDEAS }),
  })

  const ideas = (suggestionsQuery.data?.items ?? [])
    .filter((recipe) => !excludedRecipeIds.has(recipe.id))
    .slice(0, VISIBLE_IDEAS)

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
      <h3 id={titleId} className="flex items-center gap-1.5 text-xs font-semibold text-lime-800">
        <Leaf size={14} aria-hidden="true" />
        Idées de saison à ajouter
      </h3>

      {suggestionsQuery.isPending ? (
        <div aria-hidden="true" className="flex flex-col gap-2.5">
          {Array.from({ length: VISIBLE_IDEAS }, (_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-[10px] bg-sage-100" />
          ))}
        </div>
      ) : suggestionsQuery.isError ? (
        <p className="text-sm text-sage-500">Impossible de charger les idées pour le moment.</p>
      ) : ideas.length === 0 ? (
        <p className="text-sm text-sage-500">Toutes les idées du moment sont déjà au menu.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {ideas.map((recipe) => (
            <li key={recipe.id} className="flex items-center gap-3">
              <RecipeThumb recipe={recipe} className="size-11 rounded-[10px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-sm/[19px] font-medium text-sage-900">{recipe.title}</span>
                {formatRecipeMeta(recipe) ? (
                  <span className="text-xs text-sage-500">{formatRecipeMeta(recipe)}</span>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={`Ajouter ${recipe.title} au ${slotLabel.toLowerCase()}`}
                onClick={() => onAdd(recipe)}
                className="flex size-11 flex-none items-center justify-center rounded-full border border-terracotta-200 bg-terracotta-50 text-terracotta-700 transition hover:bg-terracotta-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
