import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'

function RecipeCard({ recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group overflow-hidden rounded-3xl border border-cream-200 bg-white transition hover:-translate-y-0.5 hover:shadow-soft dark:border-charcoal-700 dark:bg-charcoal-800"
    >
      <div className="h-36 bg-gradient-to-br from-sage-200 to-terracotta-200 dark:from-charcoal-700 dark:to-charcoal-600">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-sage-900/75 dark:text-cream-100/70">
            Pas de photo
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-sage-900 dark:text-cream-50">{recipe.title}</h3>
        <p className="text-sm text-sage-700 dark:text-cream-300">
          {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps non précisé'}
        </p>
      </div>
    </Link>
  )
}

export default function RecipesPage() {
  const [search, setSearch] = useState('')

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

  return (
    <PageFrame
      title="Bibliotheque"
      subtitle="Toutes vos recettes preferées, prêtes a être planifiées."
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

      {!recipesQuery.isLoading && !recipesQuery.isError ? (
        filteredRecipes.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
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
