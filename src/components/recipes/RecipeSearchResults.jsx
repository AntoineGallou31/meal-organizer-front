import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatListCount, RECIPES_PAGE_SIZE } from '../../lib/recipes'
import RecipeResults from './RecipeResults'

const RESULT_NOUN = ['résultat', 'résultats']

// Résultats de la recherche globale, qui remplacent les raccourcis et les dossiers
export default function RecipeSearchResults({ term, getCardProps }) {
  const query = useInfiniteQuery({
    queryKey: ['recipes', 'search', term],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.getRecipesPage({
        search: term,
        summary: true,
        includeCookCount: true,
        page: pageParam,
        limit: RECIPES_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => (lastPage?.hasMore ? allPages.length + 1 : undefined),
    enabled: term !== '',
    // Garde les résultats précédents affichés pendant que la nouvelle recherche se charge
    placeholderData: keepPreviousData,
  })

  return (
    <section aria-label="Résultats de la recherche" className="px-4 pt-[18px]">
      <RecipeResults
        query={query}
        label={(count, hasMore) => formatListCount({ count, hasMore, noun: RESULT_NOUN })}
        empty={
          <p role="status" className="text-xs text-sage-500">
            Aucune recette trouvée
          </p>
        }
        getCardProps={getCardProps}
      />
    </section>
  )
}
