import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'

function RecipeCard({ recipe, onDelete, isDeleting }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-cream-200 bg-white transition hover:-translate-y-0.5 hover:shadow-soft dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="relative h-36 bg-gradient-to-br from-sage-200 to-terracotta-200 dark:from-charcoal-700 dark:to-charcoal-600">
        <Link to={`/recipes/${recipe.id}`} className="block h-full w-full">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-sage-900/75 dark:text-cream-100/70">
              Pas de photo
            </div>
          )}
        </Link>

        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <Link
            to={`/recipes/${recipe.id}/edit`}
            aria-label={`Modifier ${recipe.title}`}
            title="Modifier"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sage-800 shadow transition hover:bg-white dark:bg-charcoal-800/90 dark:text-cream-100"
          >
            <Pencil size={14} />
          </Link>
          <button
            type="button"
            disabled={isDeleting}
            aria-label={`Supprimer ${recipe.title}`}
            title="Supprimer"
            onClick={() => onDelete(recipe)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-700 shadow transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-charcoal-800/90 dark:text-red-300 dark:hover:bg-red-900/40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Link to={`/recipes/${recipe.id}`} className="block space-y-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-sage-900 dark:text-cream-50">{recipe.title}</h3>
        <p className="text-sm text-sage-700 dark:text-cream-300">
          {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps non précisé'}
        </p>
      </Link>
    </article>
  )
}

export default function RecipesPage() {
  const [search, setSearch] = useState('')
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

  const filteredRecipes = useMemo(() => {
    const source = recipesQuery.data ?? []
    const normalized = search.trim().toLowerCase()

    if (!normalized) {
      return source
    }

    return source.filter((recipe) => recipe.title.toLowerCase().includes(normalized))
  }, [recipesQuery.data, search])

  const handleDeleteRecipe = (recipe) => {
    const confirmed = window.confirm(`Supprimer la recette "${recipe.title}" ? Cette action est définitive.`)
    if (!confirmed) {
      return
    }
    deleteRecipeMutation.mutate(recipe.id)
  }

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
      <label className="mb-4 flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3 py-2 dark:border-charcoal-700 dark:bg-charcoal-800">
        <Search size={16} className="text-sage-700 dark:text-cream-300" />
        <input
          type="search"
          placeholder="Rechercher une recette"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-500 dark:text-cream-100 dark:placeholder:text-cream-400"
        />
      </label>

      {recipesQuery.isLoading ? <LoadingState label="Chargement des recettes..." /> : null}
      {recipesQuery.isError ? (
        <ErrorState message={recipesQuery.error.message} onRetry={recipesQuery.refetch} />
      ) : null}

      {deleteRecipeMutation.isError ? (
        <p className="mb-4 text-sm text-red-700 dark:text-red-300">{deleteRecipeMutation.error.message}</p>
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
          <div className="rounded-2xl border border-dashed border-sage-300 bg-cream-100/70 p-4 text-center text-sm text-sage-700 dark:border-sage-700 dark:bg-charcoal-800 dark:text-cream-300">
            Aucune recette ne correspond à la recherche.
          </div>
        )
      ) : null}
    </PageFrame>
  )
}
