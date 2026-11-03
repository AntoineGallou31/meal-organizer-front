import { useMemo } from 'react'
import ErrorState from '../ErrorState'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import RecipeCard from './RecipeCard'

const SKELETON_COUNT = 4

function ResultsSkeleton() {
  return (
    <div role="status" className="grid grid-cols-2 gap-x-3 gap-y-4">
      <span className="sr-only">Chargement des recettes…</span>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex flex-col gap-2">
          <div className="h-[118px] animate-pulse rounded-2xl bg-sage-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-sage-100" />
        </div>
      ))}
    </div>
  )
}

// Recettes de toutes les pages chargées, sans doublon si la liste a bougé entre deux pages
function flattenPages(data) {
  const byId = new Map()
  data?.pages.forEach((page) => {
    ;(page?.items ?? []).forEach((recipe) => byId.set(recipe.id, recipe))
  })
  return [...byId.values()]
}

// Grille de cartes recette d'une requête paginée, avec son libellé et le chargement au défilement.
// `label(count, hasMore)` donne le libellé, `empty` remplace la grille quand il n'y a aucun résultat.
export default function RecipeResults({ query, label, empty, getCardProps }) {
  const recipes = useMemo(() => flattenPages(query.data), [query.data])
  const sentinelRef = useInfiniteScroll(query)

  if (query.isPending) return <ResultsSkeleton />

  if (query.isError && !query.data) {
    return <ErrorState message="Impossible de charger les recettes" onRetry={() => query.refetch()} />
  }

  if (recipes.length === 0) return empty

  return (
    <div className="flex flex-col gap-2.5">
      <p aria-live="polite" className="text-xs text-sage-500">
        {label(recipes.length, Boolean(query.hasNextPage))}
      </p>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="min-w-0">
            <RecipeCard recipe={recipe} {...getCardProps(recipe)} />
          </li>
        ))}
      </ul>

      {query.hasNextPage ? <div ref={sentinelRef} aria-hidden="true" className="h-px" /> : null}

      {query.isFetchingNextPage ? (
        <p role="status" className="py-3 text-center text-xs text-sage-500">
          Chargement d’autres recettes…
        </p>
      ) : null}

      {query.isFetchNextPageError ? (
        <button
          type="button"
          onClick={() => query.fetchNextPage()}
          className="mx-auto h-11 rounded-full px-4 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50"
        >
          Réessayer de charger la suite
        </button>
      ) : null}
    </div>
  )
}
