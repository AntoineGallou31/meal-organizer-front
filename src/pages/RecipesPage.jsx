import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Filter, Plus } from 'lucide-react'
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
} from 'konsta/react'
import { api } from '../lib/api'
import { SEASONS } from '../lib/seasonality'

function RecipeTile({ recipe, selectionMode, onPick, disabled }) {
  const classes = 'mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-white text-left'

  const content = (
    <>
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt={recipe.title} className="w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex min-h-28 items-center justify-center bg-gray-100 px-3 text-center text-xs text-gray-500">
          Pas de photo
        </div>
      )}
      <div className="px-3 py-2 text-sm font-medium text-gray-900">
        <div>{recipe.title}</div>
        {selectionMode ? <div className="mt-1 text-xs text-gray-500">Choisir cette recette</div> : null}
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

export default function RecipesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('')
  const [ingredient, setIngredient] = useState('')
  const [prepMax, setPrepMax] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const selectionMode = searchParams.get('mode') === 'select'
  const selectedDate = searchParams.get('date') ?? ''
  const selectedSlot = searchParams.get('slot') ?? ''
  const canPickRecipe = selectionMode && selectedDate !== '' && selectedSlot !== ''

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(true),
  })

  const recipeFilters = useMemo(
    () => ({
      search,
      categoryId: selectedCategoryId,
      ingredient,
      season: selectedSeason,
      prepMax,
      sort,
    }),
    [search, selectedCategoryId, ingredient, selectedSeason, prepMax, sort],
  )

  const recipesQuery = useQuery({
    queryKey: ['recipes', recipeFilters],
    queryFn: () => api.getRecipes(recipeFilters),
  })

  const pickRecipeMutation = useMutation({
    mutationFn: api.assignMeal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      navigate(-1)
    },
  })

  const filteredRecipes = recipesQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  const isRecipeToComplete = (recipe) => {
    if (!recipe) return false

    if (recipe.externalOnly) {
      return true
    }

    return (recipe.categories ?? []).some((category) => {
      const categoryName = String(category?.name ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

      return categoryName === 'a completer'
    })
  }

  const hasActiveFilters =
    selectedCategoryId !== '' ||
    selectedSeason !== '' ||
    ingredient.trim() !== '' ||
    prepMax.trim() !== '' ||
    sort !== 'newest'

  const clearFilters = () => {
    setSelectedCategoryId('')
    setSelectedSeason('')
    setIngredient('')
    setPrepMax('')
    setSort('newest')
  }

  const handleRecipeClick = (recipe) => {
    if (!canPickRecipe) {
      if (isRecipeToComplete(recipe) && recipe.sourceUrl) {
        window.location.assign(recipe.sourceUrl)
        return
      }

      navigate(`/recipes/${recipe.id}`)
      return
    }

    pickRecipeMutation.mutate({
      date: selectedDate,
      slot: selectedSlot,
      recipeId: recipe.id,
    })
  }

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

      <div className="flex items-center gap-2 px-4 pb-2">
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
            small
            tonal={!hasActiveFilters}
            onClick={() => setShowFilters(true)}
            title="Filtres"
            className="rounded-full"
          >
            <Filter size={18} />
          </Fab>
      </div>

      <div className="px-4 pb-3">
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
          <div className="columns-2 gap-3 px-4 pb-24 sm:columns-3">
            {filteredRecipes.map((recipe) => (
              <RecipeTile
                key={recipe.id}
                recipe={recipe}
                selectionMode={selectionMode}
                disabled={pickRecipeMutation.isPending}
                onPick={handleRecipeClick}
              />
            ))}
          </div>
        ) : (
          <List inset strong>
            <ListItem title="Aucune recette ne correspond à la recherche" />
          </List>
        )
      ) : null}

      <Sheet opened={showFilters} onBackdropClick={() => setShowFilters(false)}>
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Filtres</div>
              <div className="text-sm text-gray-500">Affiner les recettes</div>
            </div>
            <Button clear small onClick={() => setShowFilters(false)}>
              Fermer
            </Button>
          </div>

          <List strongIos outlineIos>
            <ListInput
              label="Saisonnalité"
              type="select"
              value={selectedSeason}
              onChange={(event) => setSelectedSeason(event.target.value)}
            >
              <option value="">Toutes saisons</option>
              {SEASONS.map((season) => (
                <option key={season.id} value={season.value}>
                  {season.label}
                </option>
              ))}
            </ListInput>

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

            <ListInput
              label="Tri"
              type="select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="prepTime">Temps de préparation</option>
            </ListInput>
          </List>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button small onClick={clearFilters} disabled={!hasActiveFilters}>
              Réinitialiser
            </Button>
            <Button small tonal onClick={() => setShowFilters(false)}>
              Appliquer
            </Button>
          </div>
        </div>
      </Sheet>
    </Page>
  )
}