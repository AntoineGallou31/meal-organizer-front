import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'
import { MEAL_TYPES, SEASONS, getIngredientsSeasons } from '../lib/seasonality'

function RecipeCard({ recipe, onDelete, isDeleting }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-cream-200 bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative h-36 bg-gradient-to-br from-sage-200 to-terracotta-200">
        <Link to={`/recipes/${recipe.id}`} className="block h-full w-full">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-sage-900/75">
              Pas de photo
            </div>
          )}
        </Link>

        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <Link
            to={`/recipes/${recipe.id}/edit`}
            aria-label={`Modifier ${recipe.title}`}
            title="Modifier"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sage-800 shadow transition hover:bg-white"
          >
            <Pencil size={14} />
          </Link>
          <button
            type="button"
            disabled={isDeleting}
            aria-label={`Supprimer ${recipe.title}`}
            title="Supprimer"
            onClick={() => onDelete(recipe)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-700 shadow transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Link to={`/recipes/${recipe.id}`} className="block space-y-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-sage-900">{recipe.title}</h3>
        <p className="text-sm text-sage-700">
          {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps non précisé'}
        </p>
      </Link>
    </article>
  )
}

export default function RecipesPage() {
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedSeasons, setSelectedSeasons] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  const deleteRecipeMutation = useMutation({
    mutationFn: api.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
    },
  })

  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: api.getRecipes,
  })

  // Get all unique ingredients from recipes for autocomplete
  const allIngredients = useMemo(() => {
    const ingredientsSet = new Set()
    recipesQuery.data?.forEach((recipe) => {
      recipe.ingredients?.forEach((ing) => {
        ingredientsSet.add(ing.toLowerCase().trim())
      })
    })
    return Array.from(ingredientsSet).sort()
  }, [recipesQuery.data])

  const filteredRecipes = useMemo(() => {
    let result = recipesQuery.data ?? []
    const normalizedSearch = search.trim().toLowerCase()

    // Filter by search
    if (normalizedSearch) {
      result = result.filter((recipe) => recipe.title.toLowerCase().includes(normalizedSearch))
    }

    // Filter by type
    if (selectedTypes.length > 0) {
      result = result.filter((recipe) => selectedTypes.includes(recipe.type))
    }

    // Filter by ingredients
    if (selectedIngredients.trim()) {
      const selectedIngs = selectedIngredients
        .split(',')
        .map((ing) => ing.trim().toLowerCase())
        .filter(Boolean)

      result = result.filter((recipe) => {
        const recipeIngs = recipe.ingredients?.map((ing) => ing.toLowerCase().trim()) ?? []
        return selectedIngs.every((selectedIng) =>
          recipeIngs.some((recipeIng) => recipeIng.includes(selectedIng) || selectedIng.includes(recipeIng))
        )
      })
    }

    // Filter by seasons
    if (selectedSeasons.length > 0) {
      result = result.filter((recipe) => {
        const recipeSeasons = getIngredientsSeasons(recipe.ingredients ?? [])
        return selectedSeasons.some((season) => recipeSeasons.includes(season))
      })
    }

    return result
  }, [recipesQuery.data, search, selectedTypes, selectedSeasons, selectedIngredients])

  const handleDeleteRecipe = (recipe) => {
    const confirmed = window.confirm(`Supprimer la recette "${recipe.title}" ? Cette action est définitive.`)
    if (!confirmed) {
      return
    }
    deleteRecipeMutation.mutate(recipe.id)
  }

  const toggleType = (typeId) => {
    setSelectedTypes((prev) => (prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]))
  }

  const toggleSeason = (seasonId) => {
    setSelectedSeasons((prev) =>
      prev.includes(seasonId) ? prev.filter((s) => s !== seasonId) : [...prev, seasonId]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedTypes([])
    setSelectedSeasons([])
    setSelectedIngredients('')
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedSeasons.length > 0 || selectedIngredients.trim() !== ''

  return (
    <PageFrame
      title="Bibliothèque"
      subtitle="Toutes vos recettes préferées, prêtes a être planifiées."
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/recipes/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-500"
          >
            <Plus size={16} />
            Créer
          </Link>
          <Link
            to="/recipes/import"
            className="inline-flex items-center gap-2 rounded-2xl bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-terracotta-500"
          >
            Importer
          </Link>
        </div>
      }
    >
      <label className="mb-4 flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3 py-2">
        <Search size={16} className="text-sage-700" />
        <input
          type="search"
          placeholder="Rechercher une recette"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-500"
        />
      </label>

      {/* Filter toggle button */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className={`mb-4 w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
          showFilters
            ? 'border-sage-600 bg-sage-50 text-sage-700'
            : 'border-cream-300 bg-white text-sage-700 hover:border-sage-300'
        }`}
      >
        {showFilters ? '▼ Masquer les filtres' : '▶ Afficher les filtres'}
        {hasActiveFilters && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-sage-600"></span>}
      </button>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 space-y-4 rounded-2xl border border-cream-200 bg-cream-50 p-4">
          {/* Type filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Type de plat</h3>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((mealType) => (
                <button
                  key={mealType.id}
                  type="button"
                  onClick={() => toggleType(mealType.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedTypes.includes(mealType.id)
                      ? 'bg-sage-600 text-white'
                      : 'border border-sage-300 bg-white text-sage-700 hover:border-sage-400'
                  }`}
                >
                  {mealType.label}
                </button>
              ))}
            </div>
          </div>

          {/* Season filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Saisonnalité</h3>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((season) => (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => toggleSeason(season.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedSeasons.includes(season.value)
                      ? 'bg-blue-600 text-white'
                      : 'border border-blue-300 bg-white text-blue-700 hover:border-blue-400'
                  }`}
                >
                  {season.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredient filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Ingrédients</h3>
            <input
              type="text"
              placeholder="Entrez les ingrédients séparés par des virgules (ex: tomate, fromage)"
              value={selectedIngredients}
              onChange={(e) => setSelectedIngredients(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
              list="ingredients-list"
            />
            <datalist id="ingredients-list">
              {allIngredients.map((ing) => (
                <option key={ing} value={ing} />
              ))}
            </datalist>
            {selectedIngredients && (
              <div className="flex flex-wrap gap-2">
                {selectedIngredients
                  .split(',')
                  .map((ing) => ing.trim())
                  .filter(Boolean)
                  .map((ing) => (
                    <span key={ing} className="inline-flex items-center gap-1 rounded-full bg-sage-200 px-2 py-1 text-xs text-sage-800">
                      {ing}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIngredients(
                            selectedIngredients
                              .split(',')
                              .map((i) => i.trim())
                              .filter((i) => i !== ing)
                              .join(', ')
                          )
                        }
                        className="hover:text-sage-900"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {recipesQuery.isLoading ? <LoadingState label="Chargement des recettes..." /> : null}
      {recipesQuery.isError ? (
        <ErrorState message={recipesQuery.error.message} onRetry={recipesQuery.refetch} />
      ) : null}

      {deleteRecipeMutation.isError ? (
        <p className="mb-4 text-sm text-red-700">{deleteRecipeMutation.error.message}</p>
      ) : null}

      {!recipesQuery.isLoading && !recipesQuery.isError ? (
        filteredRecipes.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isDeleting={deleteRecipeMutation.isPending}
                onDelete={handleDeleteRecipe}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sage-300 bg-cream-100/70 p-4 text-center text-sm text-sage-700">
            Aucune recette ne correspond à votreborder-dashed border-sage-300 bg-cream-100/70 p-4 text-center text-sm text-sage-700">
            Aucune recette ne correspond à la recherche.
          </div>
        )
      ) : null}
    </PageFrame>
  )
}
