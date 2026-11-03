import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const PREVIEW_COUNT = 3
// Quelques recettes de plus, pour en garder 3 avec photo
const FETCHED_RECIPES = 6

// Photos d'aperçu d'un dossier : `preview_images` quand l'API les fournit, sinon les photos
// des premières recettes du dossier (même ordre que sur la page Dossier), chargées quand
// la carte approche de l'écran (`inView`).
export default function useFolderPreviews(folder, inView) {
  const fromApi = folder.preview_images ?? []
  const needsFetch = fromApi.length === 0 && folder.recipe_count > 0

  const query = useQuery({
    queryKey: ['recipes', 'folder-preview', folder.id],
    queryFn: () => api.getRecipesPage({ categoryId: folder.id, summary: true, page: 1, limit: FETCHED_RECIPES }),
    enabled: needsFetch && inView,
    staleTime: 5 * 60_000,
  })

  if (!needsFetch) return { images: fromApi, isLoading: false }

  return {
    images: (query.data?.items ?? [])
      .map((recipe) => recipe.imageUrl)
      .filter(Boolean)
      .slice(0, PREVIEW_COUNT),
    // En attente tant que la carte n'a pas été vue ; en cas d'erreur, place aux tuiles de repli
    isLoading: query.isPending && !query.isError,
  }
}
