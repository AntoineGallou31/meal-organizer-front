import { useInfiniteQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import RecipeResults from '../components/recipes/RecipeResults'
import { FOCUS_RING, ROUND_BUTTON_CLASS } from '../components/recipes/styles'
import useCategories from '../hooks/useCategories'
import useRecipeStats from '../hooks/useRecipeStats'
import useScrollRestoration from '../hooks/useScrollRestoration'
import { api } from '../lib/api'
import {
  findIncompleteCategory,
  formatListCount,
  formatRecipeCount,
  getSpecialFolder,
  isInCurrentMonth,
  RECIPES_PAGE_SIZE,
} from '../lib/recipes'
import { getCurrentMonth } from '../lib/seasonality'

// Dossier affiché : une catégorie, ou l'un des dossiers spéciaux (saison, favoris, à compléter).
// `filter` vaut null tant qu'il n'est pas connu, et `empty` quand le dossier n'a rien à charger.
function useFolder(folderId) {
  const categoriesQuery = useCategories()
  const statsQuery = useRecipeStats()
  const special = getSpecialFolder(folderId)
  const categories = categoriesQuery.data

  if (special) {
    const incomplete = findIncompleteCategory(categories)
    const filter =
      special.id === 'saison'
        ? { month: getCurrentMonth().value }
        : special.id === 'favoris'
          ? { favorite: true }
          : categories
            ? incomplete
              ? { categoryId: incomplete.id }
              : 'empty'
            : null
    const total = statsQuery.data?.[special.statKey] ?? (special.id === 'a-completer' ? incomplete?.recipe_count : null)

    return { special, name: special.name, color: special.color, filter, total, seasonCount: null, statsQuery }
  }

  const category = categories?.find((candidate) => candidate.id === folderId) ?? null

  return {
    category,
    notFound: categoriesQuery.isSuccess && !category,
    name: category?.name ?? '',
    color: category?.color,
    // La liste peut se charger sans attendre les catégories
    filter: { categoryId: folderId },
    total: category?.recipe_count ?? null,
    seasonCount: category?.season_count ?? null,
    statsQuery,
  }
}

export default function RecipeFolderPage() {
  const { folderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const folder = useFolder(folderId)
  const backTo = '/recipes'

  const filters = folder.filter && folder.filter !== 'empty' ? { ...folder.filter, includeCookCount: true, summary: true } : null

  const recipesQuery = useInfiniteQuery({
    queryKey: ['recipes', 'folder', folderId, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRecipesPage({ ...filters, page: pageParam, limit: RECIPES_PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => (lastPage?.hasMore ? allPages.length + 1 : undefined),
    enabled: filters != null && !folder.notFound,
  })

  const saveScroll = useScrollRestoration(!recipesQuery.isPending || folder.filter === 'empty')

  const subtitle = [
    folder.total != null ? formatRecipeCount(folder.total) : null,
    folder.seasonCount > 0 ? `${folder.seasonCount} de saison` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  // Venu de la liste des dossiers : revenir en arrière la retrouve à la même position
  const handleBack = (event) => {
    if (!location.state?.fromFolders) return
    event.preventDefault()
    navigate(-1)
  }

  const getCardProps = (recipe) => ({
    color: folder.color,
    seasonBadge: folder.special?.id === 'saison' || isInCurrentMonth(recipe),
    withCookCount: folder.statsQuery.isSuccess,
    onNavigate: saveScroll,
  })

  const emptyMessage =
    folder.special?.id === 'favoris'
      ? 'Pas encore de favori : touche le cœur sur une fiche recette'
      : 'Aucune recette dans ce dossier'

  return (
    <div className="mx-auto w-full max-w-xl pb-4">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Link to={backTo} onClick={handleBack} aria-label="Retour aux dossiers" className={clsx(ROUND_BUTTON_CLASS, FOCUS_RING)}>
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <h1 className="flex min-w-0 items-center gap-2 text-[22px]/[30px] font-semibold tracking-[-0.01em] text-sage-900">
            <span
              aria-hidden="true"
              className="size-2.5 flex-none rounded-full"
              style={{ backgroundColor: folder.color || '#64748b' }}
            />
            <span className="truncate">{folder.name}</span>
          </h1>
          {subtitle ? <p className="text-xs text-sage-500">{subtitle}</p> : null}
        </div>
      </header>

      <section aria-label="Recettes du dossier" className="px-4 pt-3.5">
        {folder.notFound ? (
          <p className="text-sm text-sage-500">Ce dossier n’existe plus.</p>
        ) : folder.filter === 'empty' ? (
          <p className="text-sm text-sage-500">{emptyMessage}</p>
        ) : (
          <RecipeResults
            query={recipesQuery}
            label={(count, hasMore) => formatListCount({ count, hasMore, total: folder.total })}
            empty={<p className="text-sm text-sage-500">{emptyMessage}</p>}
            getCardProps={getCardProps}
          />
        )}
      </section>
    </div>
  )
}
