import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Filter, Flame, Plus, X } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Button,
  Chip,
  Fab,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Preloader,
  Searchbar,
  Sheet,
} from '../components/ui'
import { api } from '../lib/api'
import { MONTHS } from '../lib/seasonality'

function RecipeTile({ recipe, selectionMode, onPick, disabled }) {
  const classes = 'mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-white text-left'

  const content = (
    <>
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt={recipe.title} className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gray-100 px-3 text-center text-xs text-gray-500">
          Image non disponible
        </div>
      )}
      <div className="px-3 py-2 text-sm font-medium text-gray-900">
        <div className="flex items-center justify-between gap-2">
          <span>{recipe.title}</span>
          {recipe.cookCount > 0 ? (
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-normal text-gray-500">
              <Flame size={12} />
              {recipe.cookCount}
            </span>
          ) : null}
        </div>
      </div>
    </>
  )

  if (selectionMode) {
    return (
      <button type="button" disabled={disabled} onClick={() => onPick(recipe)} className={classes}>
        {content}
      </button>
    )
  }

  return (
    <button type="button" onClick={() => onPick(recipe)} className={classes}>
      {content}
    </button>
  )
}

const CHIP_COLORS = [
  'bg-red-100 text-red-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
]

const RECIPES_PAGE_SIZE = 10

function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default function RecipesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const selectedCategoryId = searchParams.get('category') ?? ''
  const selectedMonth = searchParams.get('month') ?? ''
  const ingredient = searchParams.get('ingredient') ?? ''
  const prepMax = searchParams.get('prepMax') ?? ''
  const sort = searchParams.get('sort') ?? 'oldest'
  const [showFilters, setShowFilters] = useState(false)
  const [columnCount, setColumnCount] = useState(2)
  const loadMoreRef = useRef(null)
  const selectionMode = searchParams.get('mode') === 'select'
  const selectedDate = searchParams.get('date') ?? ''
  const selectedSlot = searchParams.get('slot') ?? ''
  const canPickRecipe = selectionMode && selectedDate !== '' && selectedSlot !== ''

  const updateSearchParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === '' || value == null) {
          next.delete(key)
        } else {
          next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  const setSearch = (value) => updateSearchParam('q', value)
  const setSelectedCategoryId = (value) => updateSearchParam('category', value)
  const setSelectedMonth = (value) => updateSearchParam('month', value)
  const setIngredient = (value) => updateSearchParam('ingredient', value)
  const setPrepMax = (value) => updateSearchParam('prepMax', value)
  const setSort = (value) => updateSearchParam('sort', value)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(true),
  })

  const recipeFilters = useMemo(
    () => ({
      search,
      categoryId: selectedCategoryId,
      ingredient,
      month: selectedMonth,
      prepMax,
      sort,
    }),
    [search, selectedCategoryId, ingredient, selectedMonth, prepMax, sort],
  )

  const debouncedRecipeFilters = useDebouncedValue(recipeFilters, 250)

  const recipesQuery = useInfiniteQuery({
    queryKey: ['recipes', debouncedRecipeFilters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.getRecipesPage({
        ...debouncedRecipeFilters,
        page: pageParam,
        limit: RECIPES_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.page + 1 : undefined),
  })

  const pickRecipeMutation = useMutation({
    mutationFn: api.createMealPlanItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      navigate(-1)
    },
  })

  const filteredRecipes = recipesQuery.data?.pages.flatMap((page) => page.items ?? []) ?? []
  const categories = categoriesQuery.data ?? []
  const hasNextPage = recipesQuery.hasNextPage
  const isFetchingNextPage = recipesQuery.isFetchingNextPage
  const fetchNextPage = recipesQuery.fetchNextPage

  const recipeColumns = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => [])
    filteredRecipes.forEach((recipe, index) => {
      columns[index % columnCount].push(recipe)
    })
    return columns
  }, [filteredRecipes, columnCount])

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategoryId !== '' ||
    selectedMonth !== '' ||
    ingredient.trim() !== '' ||
    prepMax.trim() !== '' ||
    sort !== 'oldest'

  const clearFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        ;['q', 'category', 'month', 'ingredient', 'prepMax', 'sort'].forEach((key) => next.delete(key))
        return next
      },
      { replace: true },
    )
  }

  const handleRecipeClick = (recipe) => {
    if (!canPickRecipe) {
      sessionStorage.setItem('recipes-scroll', String(window.scrollY))
      navigate(`/recipes/${recipe.id}`)
      return
    }

    pickRecipeMutation.mutate({
      date: selectedDate,
      slot: selectedSlot,
      type: 'recipe',
      recipeId: recipe.id,
    })
  }

  useEffect(() => {
    if (recipesQuery.isLoading) return

    const savedScroll = sessionStorage.getItem('recipes-scroll')
    if (savedScroll == null) return

    sessionStorage.removeItem('recipes-scroll')

    const target = Number(savedScroll)
    let attempts = 0

    const tryRestore = () => {
      window.scrollTo({ top: target, behavior: 'instant' })
      attempts += 1
      if (document.documentElement.scrollHeight - window.innerHeight < target && attempts < 20) {
        requestAnimationFrame(tryRestore)
      }
    }

    requestAnimationFrame(tryRestore)
  }, [recipesQuery.isLoading])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        if (!hasNextPage || isFetchingNextPage) return
        fetchNextPage()
      },
      {
        root: null,
        rootMargin: '240px 0px',
        threshold: 0,
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)')

    const updateColumns = () => {
      setColumnCount(mediaQuery.matches ? 3 : 2)
    }

    updateColumns()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateColumns)
      return () => mediaQuery.removeEventListener('change', updateColumns)
    }

    mediaQuery.addListener(updateColumns)
    return () => mediaQuery.removeListener(updateColumns)
  }, [])

  return (
    <Page>
      <Navbar
        title={selectionMode ? 'Choisir une recette' : 'Recettes'}
        left={
          selectionMode ? (
            <Button clear small onClick={() => navigate(-1)} title="Retour" className="rounded-full">
              <ChevronLeft size={30} />
            </Button>
          ) : null
        }
        right={
          selectionMode ? null : (
            <Link to="/recipes/new">
              <Button clear small title="Ajouter une recette" className="rounded-full">
                <Plus size={30} />
              </Button>
            </Link>
          )
        }
      />

      <div className="flex items-center gap-2 py-4 pt-1">
        <Searchbar
          placeholder="Rechercher une recette"
          value={search}
          onChange={(valueOrEvent) =>
            setSearch(
              typeof valueOrEvent === 'string' ? valueOrEvent : (valueOrEvent?.target?.value ?? ''),
            )
          }
          disableButton={!search}
          onDisableButtonClick={() => setSearch('')}
        />
        <Fab
          tonal={!hasActiveFilters}
          onClick={() => setShowFilters(true)}
          title="Filtres"
          className="rounded-full"
        >
          <Filter size={20} />
        </Fab>
      </div>

      <div className="pb-3">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
          <Chip
            className={`shrink-0 ${
              selectedCategoryId === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setSelectedCategoryId('')}
          >
            Toutes
          </Chip>
          {categories.map((category, index) => {
            const isSelected = selectedCategoryId === category.id
            return (
              <Chip
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`shrink-0 ${
                  isSelected ? 'bg-gray-900 text-white' : CHIP_COLORS[index % CHIP_COLORS.length]
                }`}
              >
                {category.name}
              </Chip>
            )
          })}
        </div>
      </div>

      {categoriesQuery.isError ? (
        <List inset strong>
          <ListItem title="Impossible de charger les catégories" footer={categoriesQuery.error?.message} />
        </List>
      ) : null}

      {recipesQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
          <Preloader />
          <span>Chargement des recettes...</span>
        </div>
      ) : null}

      {recipesQuery.isError ? (
        <List inset strong>
          <ListItem title="Impossible de charger les recettes" footer={recipesQuery.error?.message} />
        </List>
      ) : null}

      {pickRecipeMutation.isError ? (
        <List inset strong>
          <ListItem
            title="Impossible d’ajouter la recette au planning"
            footer={pickRecipeMutation.error?.message}
          />
        </List>
      ) : null}

      {!recipesQuery.isLoading && !recipesQuery.isError ? (
        filteredRecipes.length ? (
          <>
            <div className="flex gap-3 pb-6">
              {recipeColumns.map((column, columnIndex) => (
                <div key={`column-${columnIndex}`} className="flex min-w-0 flex-1 flex-col gap-3">
                  {column.map((recipe) => (
                    <RecipeTile
                      key={recipe.id}
                      recipe={recipe}
                      selectionMode={selectionMode}
                      disabled={pickRecipeMutation.isPending}
                      onPick={handleRecipeClick}
                    />
                  ))}
                </div>
              ))}
            </div>

            {hasNextPage ? <div ref={loadMoreRef} className="h-8" aria-hidden="true" /> : null}

            {recipesQuery.isFetching && !recipesQuery.isFetchingNextPage ? (
              <div className="px-4 pb-4 text-center text-xs text-gray-500">Mise à jour des résultats...</div>
            ) : null}

            {isFetchingNextPage ? (
              <div className="px-4 pb-24 text-center text-xs text-gray-500">Chargement de nouvelles recettes...</div>
            ) : (
              <div className="pb-24" />
            )}
          </>
        ) : (
          <List inset strong>
            <ListItem title="Aucune recette ne correspond à la recherche" />
          </List>
        )
      ) : null}

      <Sheet opened={showFilters} onBackdropClick={() => setShowFilters(false)}>
        <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-linear-to-b from-cream-50 via-cream-50 to-white p-4 pb-28">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-sage-200" />

          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-sage-900">Filtres</div>
              </div>
            </div>

            <Button clear small className="text-sage-700" onClick={() => setShowFilters(false)} title="Fermer">
              <X size={30} />
            </Button>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-600">Recherche</div>
          <List   className="mb-4 overflow-hidden rounded-2xl">
            <ListInput
              label="Ingrédient"
              type="text"
              value={ingredient}
              placeholder="Ex: tomate"
              onChange={(event) => setIngredient(event.target.value)}
            />

            <ListInput
              label="Temps max (min)"
              type="number"
              min="1"
              value={prepMax}
              placeholder="Ex: 30"
              onChange={(event) => setPrepMax(event.target.value)}
            />
          </List>

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-600">Classement</div>
          <List   className="overflow-hidden rounded-2xl">
            <ListInput
              label="Mois"
              type="select"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option value="">Tous les mois</option>
              {MONTHS.map((month) => (
                <option key={month.id} value={month.value}>
                  {month.label}
                </option>
              ))}
            </ListInput>

            <ListInput
              label="Tri"
              type="select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="oldest">Plus anciennes</option>
              <option value="newest">Plus récentes</option>
              <option value="prepTime">Temps de préparation</option>
              <option value="popular">Les plus populaires</option>
            </ListInput>
          </List>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto rounded-2xl border border-cream-200 bg-white/95 p-3 shadow-soft backdrop-blur">
              <div className="grid grid-cols-2 gap-2">
                <Button small tonal onClick={clearFilters} disabled={!hasActiveFilters}>
                  Réinitialiser
                </Button>
                <Button small onClick={() => setShowFilters(false)}>
                  Appliquer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Sheet>
    </Page>
  )
}