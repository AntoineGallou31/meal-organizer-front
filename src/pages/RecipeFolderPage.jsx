import { useInfiniteQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import FolderFilters from '../components/recipes/FolderFilters'
import FolderMenu from '../components/recipes/FolderMenu'
import PickErrorToast from '../components/recipes/PickErrorToast'
import RecipeResults from '../components/recipes/RecipeResults'
import SearchField from '../components/recipes/SearchField'
import { FOCUS_RING, ROUND_BUTTON_CLASS } from '../components/recipes/styles'
import useCategories from '../hooks/useCategories'
import useDebouncedValue from '../hooks/useDebouncedValue'
import usePickRecipe from '../hooks/usePickRecipe'
import useRecipeStats from '../hooks/useRecipeStats'
import useScrollRestoration from '../hooks/useScrollRestoration'
import useUpdateSearchParams from '../hooks/useUpdateSearchParams'
import { api } from '../lib/api'
import {
  FOLDER_FILTER_IDS,
  formatListCount,
  formatRecipeCount,
  formatSlotName,
  getSelection,
  getSpecialFolder,
  isInCurrentMonth,
  parseFolderFilters,
  RECIPES_PAGE_SIZE,
  serializeFolderFilters,
} from '../lib/recipes'
import { getCurrentMonth } from '../lib/seasonality'

// Dossier affiché : une catégorie, ou l'un des dossiers spéciaux (suggestions, saison, favoris)
function useFolder(folderId) {
  const categoriesQuery = useCategories()
  const special = getSpecialFolder(folderId)
  const categories = categoriesQuery.data
  const stats = useRecipeStats().data

  if (special) {
    const filter =
      special.id === 'saison' ? { month: getCurrentMonth().value } : special.id === 'favoris' ? { favorite: true } : {}
    const total = special.statKey ? (stats?.[special.statKey] ?? null) : null

    return { special, name: special.name, color: special.color, filter, total, seasonCount: null }
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
  }
}

export default function RecipeFolderPage() {
  const { folderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, updateSearchParams] = useUpdateSearchParams()
  const folder = useFolder(folderId)
  const statsQuery = useRecipeStats()
  // Mode sélection : les cartes ajoutent la recette au créneau du planning
  const selection = getSelection(searchParams)
  const pick = usePickRecipe(selection)
  // Une API qui répond aux stats calcule aussi `cookCount` et connaît `cooked=never`
  const apiUpToDate = statsQuery.isSuccess

  // Les suggestions viennent de leur propre endpoint, qui ne connaît ni la recherche ni les filtres
  const isSuggestions = folder.special?.id === 'suggestions'
  const search = isSuggestions ? '' : (searchParams.get('q') ?? '')
  const term = useDebouncedValue(search.trim(), 250)
  const filterIds = isSuggestions
    ? []
    : FOLDER_FILTER_IDS.filter(
        (id) => !(id === 'saison' && folder.special?.id === 'saison') && !(id === 'jamais' && !apiUpToDate),
      )
  const active = parseFolderFilters(searchParams.get('f'), filterIds)
  const popular = !isSuggestions && searchParams.get('sort') === 'popular'
  const hasFilters = active.size > 0 || popular || search.trim() !== ''

  const filters = {
    ...folder.filter,
    search: term || undefined,
    month: folder.filter.month ?? (active.has('saison') ? getCurrentMonth().value : undefined),
    prepMax: active.has('rapide') ? 30 : undefined,
    cooked: active.has('jamais') ? 'never' : undefined,
    sort: popular ? 'popular' : undefined,
    includeCookCount: true,
    summary: true,
  }

  const recipesQuery = useInfiniteQuery({
    // Sous ['recipe-suggestions'] : rafraîchi comme les autres suggestions quand une recette change
    queryKey: isSuggestions ? ['recipe-suggestions', 'folder'] : ['recipes', 'folder', folderId, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      isSuggestions
        ? api.getRecipeSuggestions({ page: pageParam, limit: RECIPES_PAGE_SIZE })
        : api.getRecipesPage({ ...filters, page: pageParam, limit: RECIPES_PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => (lastPage?.hasMore ? allPages.length + 1 : undefined),
    enabled: !folder.notFound,
  })

  const saveScroll = useScrollRestoration(!recipesQuery.isPending)

  const subtitle =
    folder.special?.description ??
    [
      folder.total != null ? formatRecipeCount(folder.total) : null,
      folder.seasonCount > 0 ? `${folder.seasonCount} de saison` : null,
    ]
      .filter(Boolean)
      .join(' · ')

  // Total connu seulement sans recherche ni filtre (ou avec le seul filtre de saison, via `season_count`)
  const onlySeason = active.size === 1 && active.has('saison') && !popular && search.trim() === ''
  const knownTotal = !hasFilters ? folder.total : onlySeason ? folder.seasonCount : null
  const qualifier = (plural) =>
    [
      active.has('jamais') ? (plural ? 'jamais faites' : 'jamais faite') : null,
      active.has('saison') ? 'de saison' : null,
      active.has('rapide') ? 'en moins de 30 min' : null,
    ]
      .filter(Boolean)
      .join(', ')

  const toggleFilter = (id) => {
    const next = new Set(active)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    updateSearchParams({ f: serializeFolderFilters(next) })
  }

  const clearFilters = () => updateSearchParams({ q: null, f: null, sort: null })

  // Venu de la liste des dossiers : revenir en arrière la retrouve à la même position
  const handleBack = (event) => {
    if (!location.state?.fromFolders) return
    event.preventDefault()
    navigate(-1)
  }

  const inSeasonList = folder.special?.id === 'saison' || active.has('saison')
  const getCardProps = (recipe) => ({
    color: folder.color,
    seasonBadge: inSeasonList || isInCurrentMonth(recipe),
    // Les suggestions et le tri par popularité calculent les compteurs, même sur une API ancienne
    withCookCount: apiUpToDate || popular || isSuggestions,
    ...(selection
      ? {
          onPick: pick.mutate,
          pickLabel: `Ajouter ${recipe.title} au ${formatSlotName(selection)}`,
          disabled: pick.isPending,
        }
      : { onNavigate: saveScroll }),
  })

  const emptyFolderMessage =
    folder.special?.id === 'favoris'
      ? 'Pas encore de favori : touche le cœur sur une fiche recette'
      : isSuggestions
        ? 'Aucune suggestion pour le moment'
        : 'Aucune recette dans ce dossier'

  const emptyState = hasFilters ? (
    <div className="flex flex-col items-start gap-3">
      <p role="status" className="text-sm text-sage-500">
        Aucune recette ne correspond à ces filtres
      </p>
      <button
        type="button"
        onClick={clearFilters}
        className={clsx(
          'h-11 rounded-full border border-sage-200 bg-white px-4 text-sm font-semibold text-sage-900 transition hover:bg-sage-50',
          FOCUS_RING,
        )}
      >
        Effacer les filtres
      </button>
    </div>
  ) : (
    <p className="text-sm text-sage-500">{emptyFolderMessage}</p>
  )

  const canEdit = Boolean(folder.category && !folder.category.is_default && !selection)
  const showFilters = !folder.notFound && !isSuggestions

  return (
    <div aria-busy={pick.isPending} className="mx-auto w-full max-w-xl pb-4">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Link to={`/recipes${selection?.search ?? ''}`} onClick={handleBack} aria-label="Retour aux dossiers" className={clsx(ROUND_BUTTON_CLASS, FOCUS_RING)}>
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
        {canEdit ? <FolderMenu category={folder.category} /> : null}
      </header>

      {showFilters ? (
        <>
          <div className="px-4 pt-3.5">
            <SearchField
              label={folder.name ? `Rechercher dans ${folder.name}` : 'Rechercher dans ce dossier'}
              value={search}
              onChange={(value) => updateSearchParams({ q: value })}
            />
          </div>
          <FolderFilters
            filterIds={filterIds}
            active={active}
            onToggle={toggleFilter}
            popular={popular}
            onTogglePopular={() => updateSearchParams({ sort: popular ? null : 'popular' })}
          />
        </>
      ) : null}

      <section aria-label="Recettes du dossier" className={clsx('px-4', showFilters ? 'pt-2.5' : 'pt-3.5')}>
        {folder.notFound ? (
          <p className="text-sm text-sage-500">Ce dossier n’existe plus.</p>
        ) : (
          <RecipeResults
            query={recipesQuery}
            label={(count, hasMore) => formatListCount({ count, hasMore, total: knownTotal, qualifier })}
            empty={emptyState}
            getCardProps={getCardProps}
          />
        )}
      </section>

      <PickErrorToast error={pick.error} />
    </div>
  )
}
