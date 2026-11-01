import { PencilLine, Plus } from 'lucide-react'
import { getItemLabel, splitItems } from '../../lib/mealPlan'
import RecipeThumb from './RecipeThumb'

const MAX_VISIBLE_RECIPES = 3

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700 focus-visible:ring-offset-2 focus-visible:ring-offset-sage-50'

export default function MealCell({ items, label, onOpen }) {
  if (items.length === 0) {
    return (
      <button
        type="button"
        aria-label={`Ajouter un repas, ${label}`}
        onClick={onOpen}
        className={`flex min-h-14 w-full items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-sage-300 bg-transparent text-sage-500 transition hover:border-sage-500 hover:bg-white/60 ${focusRing}`}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    )
  }

  const { recipes, notes } = splitItems(items)
  const visibleRecipes = recipes.slice(0, MAX_VISIBLE_RECIPES)
  const hiddenCount = recipes.length - visibleRecipes.length
  const summary = [...recipes, ...notes].map(getItemLabel).join(', ')

  return (
    <button
      type="button"
      aria-label={`${label} : ${summary}`}
      onClick={onOpen}
      className={`flex min-h-14 w-full min-w-0 flex-col justify-center gap-1.5 rounded-[14px] border border-sage-200 bg-white p-1.5 text-left text-sage-900 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:border-sage-300 ${focusRing}`}
    >
      {visibleRecipes.map((item) => (
        <span key={item.id} className="flex min-w-0 items-center gap-1.5">
          <RecipeThumb recipe={item.recipe} iconSize={13} iconStrokeWidth={2.2} className="size-[26px] rounded-[7px]" />
          <span className="line-clamp-2 min-w-0 break-words text-xs/[15px] font-medium">{getItemLabel(item)}</span>
        </span>
      ))}

      {hiddenCount > 0 ? (
        <span className="pl-8 text-xs/[15px] font-medium text-sage-500">+{hiddenCount}</span>
      ) : null}

      {notes.map((item) => (
        <span key={item.id} className="flex min-w-0 items-start gap-[5px] rounded-lg bg-amber-100 px-[7px] py-[5px] text-amber-900">
          <PencilLine size={12} aria-hidden="true" className="mt-0.5 flex-none" />
          <span className="line-clamp-3 min-w-0 whitespace-pre-line break-words text-xs/[15px]">{item.note}</span>
        </span>
      ))}
    </button>
  )
}
