import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'
import { SEASONS } from '../lib/seasonality'

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
        {recipe.externalOnly ? (
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Recette externe
          </span>
        ) : null}
        <p className="text-sm text-sage-700">
          {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps non précisé'}
        </p>
      </Link>
    </article>
  )
}

export default function RecipesPage() {
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('')
  const [ingredient, setIngredient] = useState('')
  const [prepMax, setPrepMax] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  const deleteRecipeMutation = useMutation({
    mutationFn: api.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
    },
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(true),
  })

  const recipeFilters = useMemo(() => ({
    search,
    categoryId: selectedCategoryId,
    ingredient,
    season: selectedSeason,
    prepMax,
    sort,
  }), [search, selectedCategoryId, ingredient, selectedSeason, prepMax, sort])

  const recipesQuery = useQuery({
    queryKey: ['recipes', recipeFilters],
    queryFn: () => api.getRecipes(recipeFilters),
  })

  const filteredRecipes = recipesQuery.data ?? []

  const handleDeleteRecipe = (recipe) => {
    const confirmed = window.confirm(`Supprimer la recette "${recipe.title}" ? Cette action est définitive.`)
    if (!confirmed) {
      return
    }
    deleteRecipeMutation.mutate(recipe.id)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategoryId('')
    setSelectedSeason('')
    setIngredient('')
    setPrepMax('')
    setSort('newest')
  }

  const hasActiveFilters =
    selectedCategoryId !== '' ||
    selectedSeason !== '' ||
    ingredient.trim() !== '' ||
    prepMax.trim() !== '' ||
    sort !== 'newest'

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
            <h3 className="text-sm font-semibold text-sage-800">Categorie</h3>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            >
              <option value="">Toutes les categories</option>
              {(categoriesQuery.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Season filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Saisonnalité</h3>
            <select
              value={selectedSeason}
              onChange={(event) => setSelectedSeason(event.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            >
              <option value="">Toutes saisons</option>
              {SEASONS.map((season) => (
                <option key={season.id} value={season.value}>
                  {season.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ingredient filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Ingredient</h3>
            <input
              type="text"
              placeholder="Ex: tomate"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Temps max (min)</h3>
            <input
              type="number"
              min="1"
              value={prepMax}
              onChange={(event) => setPrepMax(event.target.value)}
              placeholder="Ex: 30"
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Tri</h3>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            >
              <option value="newest">Plus recentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="prepTime">Temps de preparation</option>
            </select>
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
      {categoriesQuery.isError ? (
        <p className="mb-4 text-sm text-red-700">{categoriesQuery.error.message}</p>
      ) : null}
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
            Aucune recette ne correspond à la recherche.
          </div>
        )
      ) : null}
    </PageFrame>
  )
}
