import { useMemo } from 'react'
import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useCategories from '../../hooks/useCategories'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import usePickRecipe from '../../hooks/usePickRecipe'
import useRecipeStats from '../../hooks/useRecipeStats'
import useScrollRestoration from '../../hooks/useScrollRestoration'
import useUpdateSearchParams from '../../hooks/useUpdateSearchParams'
import { formatDayLong, getSlotLabel } from '../../lib/mealPlan'
import {
  formatSlotName,
  getPlanningPath,
  getVisibleFolders,
  isInCurrentMonth,
  pickFallbackColor,
} from '../../lib/recipes'
import FolderList from './FolderList'
import PickErrorToast from './PickErrorToast'
import RecipeSearchResults from './RecipeSearchResults'
import SearchField from './SearchField'
import SeasonCarousel from './SeasonCarousel'
import { FOCUS_RING, ROUND_BUTTON_CLASS } from './styles'

// Retour au planning : en arrière s'il y a un historique (le panneau du créneau s'y rouvre),
// sinon le lien remplace l'écran courant
function useBackToPlanning() {
  const navigate = useNavigate()
  return (event) => {
    if ((window.history.state?.idx ?? 0) === 0) return
    event.preventDefault()
    navigate(-1)
  }
}

// Écran « Choisir une recette », ouvert depuis le planning (`/recipes?mode=select&date=…&slot=…`)
export default function RecipePicker({ selection }) {
  const [searchParams, updateSearchParams] = useUpdateSearchParams()
  const search = searchParams.get('q') ?? ''
  const isSearching = search.trim() !== ''
  const term = useDebouncedValue(search.trim(), 250)

  const categoriesQuery = useCategories()
  const statsQuery = useRecipeStats()
  const folders = useMemo(() => getVisibleFolders(categoriesQuery.data), [categoriesQuery.data])
  const pick = usePickRecipe(selection)
  const saveScroll = useScrollRestoration(isSearching || !categoriesQuery.isPending)
  const handleBack = useBackToPlanning()

  const slotName = formatSlotName(selection)

  const getCardProps = (recipe) => ({
    color: pickFallbackColor(recipe.id),
    seasonBadge: isInCurrentMonth(recipe),
    withCookCount: statsQuery.isSuccess,
    onPick: pick.mutate,
    pickLabel: `Ajouter ${recipe.title} au ${slotName}`,
    disabled: pick.isPending,
  })

  return (
    <div aria-busy={pick.isPending} className="mx-auto w-full max-w-xl pb-4">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Link
          to={getPlanningPath(selection)}
          replace
          onClick={handleBack}
          aria-label="Retour au planning"
          className={clsx(ROUND_BUTTON_CLASS, FOCUS_RING)}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="text-xs/4 font-semibold tracking-[0.04em] text-terracotta-700 uppercase">
            {formatDayLong(selection.date)} · {getSlotLabel(selection.slot)}
          </p>
          <h1 className="text-xl/7 font-semibold tracking-[-0.01em] text-sage-900">Choisir une recette</h1>
        </div>
      </header>

      <div className="px-4 pt-3.5">
        <SearchField label="Rechercher une recette" value={search} onChange={(value) => updateSearchParams({ q: value })} />
      </div>

      {isSearching ? (
        <RecipeSearchResults term={term} getCardProps={getCardProps} />
      ) : (
        <>
          <SeasonCarousel slotLabel={slotName} onPick={pick.mutate} disabled={pick.isPending} />
          <FolderList
            categoriesQuery={categoriesQuery}
            folders={folders}
            search={selection.search}
            onNavigate={saveScroll}
          />
        </>
      )}

      <PickErrorToast error={pick.error} />
    </div>
  )
}
